// routes/utilisateurs.js
const express = require("express");
const {
  listerUtilisateurs,
  voirUtilisateur,
  statsGlobales,
} = require("../controllers/utilisateurController");
const { authenticate, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/utilisateurs:
 *   get:
 *     summary: Lister les utilisateurs (recherche par nom/email)
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get("/", listerUtilisateurs);

/**
 * @swagger
 * /api/utilisateurs/stats:
 *   get:
 *     summary: Statistiques globales (admin uniquement)
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Stats globales
 *       403:
 *         description: Réservé aux administrateurs
 */
router.get("/stats", adminOnly, statsGlobales);

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   get:
 *     summary: Profil et stats d'un utilisateur
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Profil utilisateur avec statistiques
 *       404:
 *         description: Utilisateur introuvable
 */
router.get("/:id", voirUtilisateur);

module.exports = router;
