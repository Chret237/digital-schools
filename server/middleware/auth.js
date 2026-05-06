// middleware/auth.js
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

// Middleware d'authentification principal
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours
    const result = await query(
      "SELECT id, nom, email, role FROM utilisateurs WHERE id = $1",
      [decoded.id],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expiré. Veuillez vous reconnecter." });
    }
    return res.status(401).json({ message: "Token invalide." });
  }
};

// Middleware réservé aux administrateurs
const adminOnly = (req, res, next) => {
  if (req.user.role !== "administrateur") {
    return res
      .status(403)
      .json({ message: "Accès réservé aux administrateurs." });
  }
  next();
};

// Middleware : être membre du projet ou admin
const isProjectMember = async (req, res, next) => {
  try {
    const projetId = req.params.id || req.params.projetId;
    if (req.user.role === "administrateur") return next();

    const result = await query(
      "SELECT 1 FROM membres_projets WHERE projet_id = $1 AND utilisateur_id = $2",
      [projetId, req.user.id],
    );
    // Aussi accepter le créateur
    const createur = await query(
      "SELECT 1 FROM projets WHERE id = $1 AND createur_id = $2",
      [projetId, req.user.id],
    );

    if (result.rows.length === 0 && createur.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas membre de ce projet." });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, adminOnly, isProjectMember };
