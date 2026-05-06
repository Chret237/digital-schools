// controllers/projetController.js
const { validationResult } = require("express-validator");
const { query, transaction } = require("../config/db");

// GET /api/projets — liste paginée
const listerProjets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = Math.min(50, parseInt(req.query.limite) || 10);
    const offset = (page - 1) * limite;
    const search = req.query.search || "";
    const statut = req.query.statut || "";

    let whereClause = "WHERE (p.createur_id = $1 OR mp.utilisateur_id = $1)";
    const params = [req.user.id];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (p.titre ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (statut) {
      whereClause += ` AND p.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) FROM projets p
       LEFT JOIN membres_projets mp ON p.id = mp.projet_id
       ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT DISTINCT p.id, p.titre, p.description, p.statut, p.date_echeance, p.date_creation,
              u.nom AS createur_nom, u.email AS createur_email,
              COUNT(DISTINCT t.id) AS total_taches,
              COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'termine') AS taches_terminees,
              COUNT(DISTINCT mp2.utilisateur_id) AS total_membres
       FROM projets p
       LEFT JOIN membres_projets mp ON p.id = mp.projet_id
       JOIN utilisateurs u ON p.createur_id = u.id
       LEFT JOIN taches t ON p.id = t.projet_id
       LEFT JOIN membres_projets mp2 ON p.id = mp2.projet_id
       ${whereClause}
       GROUP BY p.id, u.nom, u.email
       ORDER BY p.date_creation DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limite, offset],
    );

    res.json({
      projets: result.rows,
      pagination: { page, limite, total, pages: Math.ceil(total / limite) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projets/:id — détail d'un projet
const voirProjet = async (req, res, next) => {
  try {
    const { id } = req.params;

    const projet = await query(
      `SELECT p.*, u.nom AS createur_nom, u.email AS createur_email
       FROM projets p JOIN utilisateurs u ON p.createur_id = u.id
       WHERE p.id = $1`,
      [id],
    );
    if (projet.rows.length === 0) {
      return res.status(404).json({ message: "Projet introuvable." });
    }

    const membres = await query(
      `SELECT u.id, u.nom, u.email, u.avatar, mp.role_projet, mp.date_ajout
       FROM membres_projets mp JOIN utilisateurs u ON mp.utilisateur_id = u.id
       WHERE mp.projet_id = $1`,
      [id],
    );

    const taches = await query(
      `SELECT t.*, u.nom AS assigne_nom, u.avatar AS assigne_avatar,
              c.nom AS createur_nom
       FROM taches t
       LEFT JOIN utilisateurs u ON t.assigne_a = u.id
       JOIN utilisateurs c ON t.createur_id = c.id
       WHERE t.projet_id = $1
       ORDER BY t.date_creation DESC`,
      [id],
    );

    res.json({
      projet: projet.rows[0],
      membres: membres.rows,
      taches: taches.rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projets — créer un projet
const creerProjet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { titre, description, date_echeance } = req.body;

    const result = await transaction(async (client) => {
      const projet = await client.query(
        "INSERT INTO projets (titre, description, createur_id, date_echeance) VALUES ($1, $2, $3, $4) RETURNING *",
        [titre.trim(), description || null, req.user.id, date_echeance || null],
      );
      // Ajouter le créateur comme chef de projet
      await client.query(
        "INSERT INTO membres_projets (projet_id, utilisateur_id, role_projet) VALUES ($1, $2, $3)",
        [projet.rows[0].id, req.user.id, "chef"],
      );
      return projet.rows[0];
    });

    res.status(201).json({ message: "Projet créé.", projet: result });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projets/:id — modifier un projet (créateur ou admin)
const modifierProjet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { id } = req.params;
    const existant = await query(
      "SELECT createur_id FROM projets WHERE id = $1",
      [id],
    );
    if (existant.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });

    if (
      existant.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res
        .status(403)
        .json({ message: "Seul le créateur peut modifier ce projet." });
    }

    const { titre, description, statut, date_echeance } = req.body;
    const result = await query(
      "UPDATE projets SET titre = $1, description = $2, statut = $3, date_echeance = $4, updated_at = NOW() WHERE id = $5 RETURNING *",
      [
        titre.trim(),
        description || null,
        statut || "actif",
        date_echeance || null,
        id,
      ],
    );

    res.json({ message: "Projet modifié.", projet: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projets/:id — supprimer (créateur ou admin)
const supprimerProjet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existant = await query(
      "SELECT createur_id FROM projets WHERE id = $1",
      [id],
    );
    if (existant.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });

    if (
      existant.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res
        .status(403)
        .json({ message: "Seul le créateur peut supprimer ce projet." });
    }

    await query("DELETE FROM projets WHERE id = $1", [id]);
    res.json({ message: "Projet supprimé." });
  } catch (err) {
    next(err);
  }
};

// POST /api/projets/:id/membres — ajouter un membre
const ajouterMembre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { utilisateur_id, role_projet } = req.body;

    // Vérifier que le projet appartient à l'utilisateur
    const projet = await query(
      "SELECT createur_id FROM projets WHERE id = $1",
      [id],
    );
    if (projet.rows.length === 0)
      return res.status(404).json({ message: "Projet introuvable." });
    if (
      projet.rows[0].createur_id !== req.user.id &&
      req.user.role !== "administrateur"
    ) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    await query(
      "INSERT INTO membres_projets (projet_id, utilisateur_id, role_projet) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [id, utilisateur_id, role_projet || "membre"],
    );

    res.status(201).json({ message: "Membre ajouté au projet." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listerProjets,
  voirProjet,
  creerProjet,
  modifierProjet,
  supprimerProjet,
  ajouterMembre,
};
