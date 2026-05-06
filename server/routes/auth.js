// routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  me,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const registerValidation = [
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis.")
    .isLength({ min: 2, max: 100 }),
  body("email").isEmail().withMessage("Email invalide.").normalizeEmail(),
  body("mot_de_passe")
    .isLength({ min: 6 })
    .withMessage("Mot de passe minimum 6 caractères."),
];
const loginValidation = [
  body("email").isEmail().withMessage("Email invalide."),
  body("mot_de_passe").notEmpty().withMessage("Mot de passe requis."),
];
const profileValidation = [
  body("nom").trim().notEmpty().isLength({ min: 2, max: 100 }),
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouveau compte
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, mot_de_passe]
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Alice Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@digital.cm
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Compte créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/Utilisateur' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erreur' }
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/register", registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, mot_de_passe]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@digital.cm
 *               mot_de_passe:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token: { type: string, description: "JWT à utiliser dans Authorization: Bearer <token>" }
 *                 user: { $ref: '#/components/schemas/Utilisateur' }
 *       401:
 *         description: Identifiants incorrects
 */
router.post("/login", loginValidation, login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Profil retourné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/Utilisateur' }
 *       401:
 *         description: Non authentifié
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Modifier son profil
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom: { type: string, example: Alice Martin }
 *               avatar: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put("/profile", authenticate, profileValidation, updateProfile);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Changer son mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ancien_mot_de_passe, nouveau_mot_de_passe]
 *             properties:
 *               ancien_mot_de_passe: { type: string }
 *               nouveau_mot_de_passe: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Mot de passe changé
 *       401:
 *         description: Ancien mot de passe incorrect
 */
router.put("/password", authenticate, changePassword);

module.exports = router;
