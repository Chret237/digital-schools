// controllers/invitationController.js
const { query, transaction } = require("../config/db");

// ─── POST /api/projets/:id/invitations ─────────────────────────────────────
// Créateur invite un utilisateur
const envoyerInvitation = async (req, res, next) => {
  try {
    const projetId = req.params.id;
    const { utilisateur_id, message } = req.body;

    if (!utilisateur_id) {
      return res.status(400).json({ message: "utilisateur_id est requis." });
    }
    if (parseInt(utilisateur_id) === req.user.id) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas vous inviter vous-même." });
    }

    // Vérifier que le projet existe et que c'est bien le créateur (ou admin)
    const projet = await query(
      "SELECT id, titre, createur_id FROM projets WHERE id = $1",
      [projetId],
    );
    if (projet.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });
    if (
      projet.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res
        .status(403)
        .json({ message: "Seul le créateur peut inviter des membres." });
    }

    // Vérifier que l'utilisateur cible existe
    const cible = await query(
      "SELECT id, nom, email FROM utilisateurs WHERE id = $1",
      [utilisateur_id],
    );
    if (cible.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur introuvable." });

    // Vérifier qu'il n'est pas déjà membre
    const dejaM = await query(
      "SELECT 1 FROM membres_projets WHERE projet_id = $1 AND utilisateur_id = $2",
      [projetId, utilisateur_id],
    );
    if (dejaM.rows.length > 0) {
      return res
        .status(409)
        .json({
          message: `${cible.rows[0].nom} est déjà membre de ce projet.`,
        });
    }

    // Vérifier qu'il n'y a pas déjà une invitation en_attente
    const dejaInv = await query(
      "SELECT id, statut FROM invitations WHERE projet_id = $1 AND utilisateur_id = $2",
      [projetId, utilisateur_id],
    );
    if (dejaInv.rows.length > 0) {
      if (dejaInv.rows[0].statut === "en_attente") {
        return res
          .status(409)
          .json({
            message: "Une invitation est déjà en attente pour cet utilisateur.",
          });
      }
      // Réenvoyer si refusée/annulée : mettre à jour
      const updated = await query(
        "UPDATE invitations SET statut = 'en_attente', message = $1, date_creation = NOW(), date_reponse = NULL WHERE id = $2 RETURNING *",
        [message || null, dejaInv.rows[0].id],
      );
      return res
        .status(200)
        .json({ message: "Invitation renvoyée.", invitation: updated.rows[0] });
    }

    const result = await query(
      "INSERT INTO invitations (projet_id, invite_par, utilisateur_id, message) VALUES ($1, $2, $3, $4) RETURNING *",
      [projetId, req.user.id, utilisateur_id, message || null],
    );

    // Émettre un événement Socket.IO en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${utilisateur_id}`).emit("nouvelle_invitation", {
        invitation: result.rows[0],
        projet: { id: projetId, titre: projet.rows[0].titre },
        invite_par: { id: req.user.id, nom: req.user.nom },
      });
    }

    res.status(201).json({
      message: `Invitation envoyée à ${cible.rows[0].nom}.`,
      invitation: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/projets/:id/invitations ──────────────────────────────────────
// Créateur liste les invitations d'un projet
const listerInvitationsProjet = async (req, res, next) => {
  try {
    const projetId = req.params.id;
    const projet = await query(
      "SELECT createur_id FROM projets WHERE id = $1",
      [projetId],
    );
    if (projet.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });
    if (
      projet.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const result = await query(
      `SELECT i.*, u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.avatar AS utilisateur_avatar
       FROM invitations i
       JOIN utilisateurs u ON i.utilisateur_id = u.id
       WHERE i.projet_id = $1
       ORDER BY i.date_creation DESC`,
      [projetId],
    );
    res.json({ invitations: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/invitations/mes-invitations ──────────────────────────────────
// Utilisateur connecté voit ses invitations reçues
const mesInvitations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*,
              p.titre AS projet_titre, p.description AS projet_description,
              u.nom AS invite_par_nom, u.email AS invite_par_email
       FROM invitations i
       JOIN projets p ON i.projet_id = p.id
       JOIN utilisateurs u ON i.invite_par = u.id
       WHERE i.utilisateur_id = $1
       ORDER BY i.date_creation DESC`,
      [req.user.id],
    );
    const enAttente = result.rows.filter(
      (i) => i.statut === "en_attente",
    ).length;
    res.json({ invitations: result.rows, en_attente: enAttente });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/invitations/:id/accepter ──────────────────────────────────
const accepterInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inv = await query(
      "SELECT * FROM invitations WHERE id = $1 AND utilisateur_id = $2 AND statut = 'en_attente'",
      [id, req.user.id],
    );
    if (inv.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Invitation introuvable ou déjà traitée." });
    }

    const invitation = inv.rows[0];

    await transaction(async (client) => {
      // Ajouter à membres_projets
      await client.query(
        "INSERT INTO membres_projets (projet_id, utilisateur_id, role_projet) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [invitation.projet_id, req.user.id, "membre"],
      );
      // Mettre à jour le statut
      await client.query(
        "UPDATE invitations SET statut = 'acceptee', date_reponse = NOW() WHERE id = $1",
        [id],
      );
    });

    // Notifier le créateur via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`project_${invitation.projet_id}`).emit("invitation_acceptee", {
        utilisateur: { id: req.user.id, nom: req.user.nom },
        projet_id: invitation.projet_id,
      });
    }

    res.json({
      message: "Invitation acceptée. Vous êtes maintenant membre du projet.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/invitations/:id/refuser ───────────────────────────────────
const refuserInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE invitations SET statut = 'refusee', date_reponse = NOW() WHERE id = $1 AND utilisateur_id = $2 AND statut = 'en_attente' RETURNING *",
      [id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Invitation introuvable ou déjà traitée." });
    }
    res.json({ message: "Invitation refusée." });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/invitations/:id ──────────────────────────────────────────
// Créateur annule une invitation en_attente
const annulerInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inv = await query(
      "SELECT i.*, p.createur_id FROM invitations i JOIN projets p ON i.projet_id = p.id WHERE i.id = $1",
      [id],
    );
    if (inv.rows.length === 0)
      return res.status(404).json({ message: "Invitation introuvable." });

    const invitation = inv.rows[0];
    if (
      invitation.createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res.status(403).json({ message: "Action non autorisée." });
    }
    if (invitation.statut !== "en_attente") {
      return res
        .status(400)
        .json({
          message: "Seules les invitations en attente peuvent être annulées.",
        });
    }

    await query(
      "UPDATE invitations SET statut = 'annulee', date_reponse = NOW() WHERE id = $1",
      [id],
    );
    res.json({ message: "Invitation annulée." });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/projets/:id/membres/:userId ──────────────────────────────
// Créateur retire un membre du projet
const retirerMembre = async (req, res, next) => {
  try {
    const { id: projetId, userId } = req.params;
    const projet = await query(
      "SELECT createur_id FROM projets WHERE id = $1",
      [projetId],
    );
    if (projet.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });
    if (
      projet.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res
        .status(403)
        .json({ message: "Seul le créateur peut retirer des membres." });
    }
    if (parseInt(userId) === projet.rows[0].createur_id) {
      return res
        .status(400)
        .json({ message: "Le créateur ne peut pas être retiré du projet." });
    }
    await query(
      "DELETE FROM membres_projets WHERE projet_id = $1 AND utilisateur_id = $2",
      [projetId, userId],
    );
    res.json({ message: "Membre retiré du projet." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  envoyerInvitation,
  listerInvitationsProjet,
  mesInvitations,
  accepterInvitation,
  refuserInvitation,
  annulerInvitation,
  retirerMembre,
};
