// controllers/tacheController.js
const { validationResult } = require("express-validator");
const { query } = require("../config/db");

// GET /api/projets/:id/taches
const listerTaches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, assigne_a, priorite } = req.query;

    let where = "WHERE t.projet_id = $1";
    const params = [id];
    let i = 2;

    if (statut) {
      where += ` AND t.statut = $${i++}`;
      params.push(statut);
    }
    if (assigne_a) {
      where += ` AND t.assigne_a = $${i++}`;
      params.push(assigne_a);
    }
    if (priorite) {
      where += ` AND t.priorite = $${i++}`;
      params.push(priorite);
    }

    const result = await query(
      `SELECT t.*,
              ua.nom AS assigne_nom, ua.avatar AS assigne_avatar,
              uc.nom AS createur_nom,
              COUNT(c.id) AS nb_commentaires
       FROM taches t
       LEFT JOIN utilisateurs ua ON t.assigne_a = ua.id
       JOIN utilisateurs uc ON t.createur_id = uc.id
       LEFT JOIN commentaires c ON c.tache_id = t.id
       ${where}
       GROUP BY t.id, ua.nom, ua.avatar, uc.nom
       ORDER BY
         CASE t.priorite WHEN 'urgente' THEN 1 WHEN 'haute' THEN 2 WHEN 'normale' THEN 3 ELSE 4 END,
         t.date_echeance ASC NULLS LAST`,
      params,
    );

    res.json({ taches: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/projets/:id/taches
const creerTache = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { id } = req.params;
    const { titre, description, assigne_a, priorite, date_echeance } = req.body;

    // Vérifier projet existant
    const projet = await query("SELECT id FROM projets WHERE id = $1", [id]);
    if (projet.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });

    // Vérifier que l'utilisateur assigné est bien membre du projet
    if (assigne_a) {
      const membreCheck = await query(
        "SELECT 1 FROM membres_projets WHERE projet_id = $1 AND utilisateur_id = $2",
        [id, assigne_a],
      );
      if (membreCheck.rows.length === 0) {
        return res
          .status(403)
          .json({
            message: "L'utilisateur assigné n'est pas membre de ce projet.",
          });
      }
    }

    const result = await query(
      `INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, date_echeance, createur_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        titre.trim(),
        description || null,
        assigne_a || null,
        priorite || "normale",
        date_echeance || null,
        req.user.id,
      ],
    );

    res.status(201).json({ message: "Tâche créée.", tache: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/taches/:id — détail d'une tâche avec commentaires
const voirTache = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tache = await query(
      `SELECT t.*, ua.nom AS assigne_nom, ua.avatar AS assigne_avatar, uc.nom AS createur_nom
       FROM taches t
       LEFT JOIN utilisateurs ua ON t.assigne_a = ua.id
       JOIN utilisateurs uc ON t.createur_id = uc.id
       WHERE t.id = $1`,
      [id],
    );
    if (tache.rows.length === 0)
      return res.status(404).json({ message: "Tâche introuvable." });

    const commentaires = await query(
      `SELECT c.*, u.nom AS auteur_nom, u.avatar AS auteur_avatar
       FROM commentaires c JOIN utilisateurs u ON c.auteur_id = u.id
       WHERE c.tache_id = $1 ORDER BY c.date_creation ASC`,
      [id],
    );

    res.json({ tache: tache.rows[0], commentaires: commentaires.rows });
  } catch (err) {
    next(err);
  }
};

// PUT /api/taches/:id — modifier une tâche
const modifierTache = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titre, description, assigne_a, priorite, date_echeance } = req.body;

    const existing = await query("SELECT * FROM taches WHERE id = $1", [id]);
    if (existing.rows.length === 0)
      return res.status(404).json({ message: "Tâche introuvable." });

    // Vérifier que le nouvel assigné est membre du projet (si fourni)
    if (assigne_a && assigne_a !== existing.rows[0].assigne_a) {
      const tacheProjet = await query(
        "SELECT projet_id FROM taches WHERE id = $1",
        [id],
      );
      const membreCheck = await query(
        "SELECT 1 FROM membres_projets WHERE projet_id = $1 AND utilisateur_id = $2",
        [tacheProjet.rows[0].projet_id, assigne_a],
      );
      if (membreCheck.rows.length === 0) {
        return res
          .status(403)
          .json({
            message: "L'utilisateur assigné n'est pas membre de ce projet.",
          });
      }
    }

    const result = await query(
      `UPDATE taches SET
         titre = COALESCE($1, titre),
         description = COALESCE($2, description),
         assigne_a = $3,
         priorite = COALESCE($4, priorite),
         date_echeance = $5,
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        titre?.trim(),
        description,
        assigne_a ?? existing.rows[0].assigne_a,
        priorite,
        date_echeance,
        id,
      ],
    );

    res.json({ message: "Tâche modifiée.", tache: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/taches/:id/statut — changer le statut
const changerStatut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = ["a_faire", "en_cours", "termine"];
    if (!statutsValides.includes(statut)) {
      return res
        .status(400)
        .json({
          message: `Statut invalide. Valeurs acceptées : ${statutsValides.join(", ")}`,
        });
    }

    const result = await query(
      "UPDATE taches SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [statut, id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Tâche introuvable." });

    res.json({ message: "Statut mis à jour.", tache: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/taches/:id
const supprimerTache = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM taches WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Tâche introuvable." });
    res.json({ message: "Tâche supprimée." });
  } catch (err) {
    next(err);
  }
};

// POST /api/taches/:id/commentaires
const ajouterCommentaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    if (!contenu?.trim())
      return res
        .status(400)
        .json({ message: "Le commentaire ne peut pas être vide." });

    const tache = await query("SELECT id FROM taches WHERE id = $1", [id]);
    if (tache.rows.length === 0)
      return res.status(404).json({ message: "Tâche introuvable." });

    const result = await query(
      "INSERT INTO commentaires (tache_id, auteur_id, contenu) VALUES ($1, $2, $3) RETURNING *",
      [id, req.user.id, contenu.trim()],
    );

    // Enrichir avec les infos auteur
    const commentaire = await query(
      `SELECT c.*, u.nom AS auteur_nom, u.avatar AS auteur_avatar
       FROM commentaires c JOIN utilisateurs u ON c.auteur_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id],
    );

    res
      .status(201)
      .json({
        message: "Commentaire ajouté.",
        commentaire: commentaire.rows[0],
      });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listerTaches,
  creerTache,
  voirTache,
  modifierTache,
  changerStatut,
  supprimerTache,
  ajouterCommentaire,
};
