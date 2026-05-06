// middleware/checkTacheOwner.js
// Seul le chef de projet ou le créateur de la tâche peut la modifier/supprimer
const { query } = require('../config/db');

const checkTacheOwner = async (req, res, next) => {
  try {
    const tacheId = req.params.id;

    const result = await query(
      `SELECT t.createur_id, t.projet_id, mp.role_projet
       FROM taches t
       LEFT JOIN membres_projets mp ON mp.projet_id = t.projet_id AND mp.utilisateur_id = $1
       WHERE t.id = $2`,
      [req.user.id, tacheId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }

    const { createur_id, role_projet } = result.rows[0];

    // Admin global → toujours autorisé
    if (req.user.role === 'administrateur') return next();
    // Créateur de la tâche → autorisé
    if (createur_id === req.user.id) return next();
    // Chef du projet → autorisé
    if (role_projet === 'chef') return next();

    return res.status(403).json({ message: 'Seul le créateur de la tâche ou le chef de projet peut effectuer cette action.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkTacheOwner };
