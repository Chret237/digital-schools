// controllers/utilisateurController.js
const { query } = require("../config/db");

// GET /api/utilisateurs
const listerUtilisateurs = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const params = search ? [`%${search}%`] : [];
    const where = search ? "WHERE nom ILIKE $1 OR email ILIKE $1" : "";

    const result = await query(
      `SELECT id, nom, email, role, avatar, date_inscription FROM utilisateurs ${where} ORDER BY nom ASC LIMIT 50`,
      params,
    );
    res.json({ utilisateurs: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/utilisateurs/:id
const voirUtilisateur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT id, nom, email, role, avatar, date_inscription FROM utilisateurs WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const stats = await query(
      `SELECT
         COUNT(DISTINCT p.id)  AS projets_crees,
         COUNT(DISTINCT t.id)  AS taches_assignees,
         COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'termine') AS taches_terminees
       FROM utilisateurs u
       LEFT JOIN projets p ON p.createur_id = u.id
       LEFT JOIN taches  t ON t.assigne_a   = u.id
       WHERE u.id = $1`,
      [id],
    );

    res.json({ utilisateur: result.rows[0], stats: stats.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/utilisateurs/stats  (admin only)
const statsGlobales = async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM utilisateurs)                       AS total_utilisateurs,
        (SELECT COUNT(*) FROM projets)                            AS total_projets,
        (SELECT COUNT(*) FROM projets WHERE statut = 'actif')     AS projets_actifs,
        (SELECT COUNT(*) FROM taches)                             AS total_taches,
        (SELECT COUNT(*) FROM taches WHERE statut = 'termine')    AS taches_terminees,
        (SELECT COUNT(*) FROM taches WHERE statut = 'en_cours')   AS taches_en_cours,
        (SELECT COUNT(*) FROM taches WHERE statut = 'a_faire')    AS taches_a_faire
    `);
    res.json({ stats: stats.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { listerUtilisateurs, voirUtilisateur, statsGlobales };
