// middleware/errorHandler.js

// Middleware de gestion globale des erreurs
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  // Erreur de validation express-validator
  if (err.type === "validation") {
    return res
      .status(400)
      .json({ message: "Données invalides.", errors: err.errors });
  }

  // Erreur PostgreSQL - clé dupliquée
  if (err.code === "23505") {
    return res.status(409).json({ message: "Cette ressource existe déjà." });
  }

  // Erreur PostgreSQL - contrainte de clé étrangère
  if (err.code === "23503") {
    return res.status(400).json({ message: "Référence invalide." });
  }

  // Erreur générique
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur.";
  res.status(status).json({ message });
};

// Middleware 404
const notFound = (req, res) => {
  res
    .status(404)
    .json({ message: `Route ${req.method} ${req.path} introuvable.` });
};

module.exports = { errorHandler, notFound };
