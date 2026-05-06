// routes/projets.js
const express = require("express");
const { body } = require("express-validator");
const {
  listerProjets,
  voirProjet,
  creerProjet,
  modifierProjet,
  supprimerProjet,
  ajouterMembre,
} = require("../controllers/projetController");
const { listerTaches, creerTache } = require("../controllers/tacheController");
const {
  envoyerInvitation,
  listerInvitationsProjet,
  retirerMembre,
} = require("../controllers/invitationController");
const { authenticate, isProjectMember } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

const projetValidation = [
  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est requis.")
    .isLength({ max: 200 }),
  body("description").optional().isLength({ max: 2000 }),
  body("date_echeance").optional().isISO8601().withMessage("Date invalide."),
];
const tacheValidation = [
  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est requis.")
    .isLength({ max: 200 }),
  body("priorite").optional().isIn(["faible", "normale", "haute", "urgente"]),
  body("date_echeance").optional().isISO8601(),
];

/**
 * @swagger
 * /api/projets:
 *   get:
 *     summary: Lister mes projets (paginé)
 *     tags: [Projets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche dans titre et description
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [actif, en_pause, terminé, annulé] }
 *     responses:
 *       200:
 *         description: Liste des projets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projets:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Projet' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get("/", listerProjets);

/**
 * @swagger
 * /api/projets:
 *   post:
 *     summary: Créer un nouveau projet
 *     tags: [Projets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre]
 *             properties:
 *               titre: { type: string, example: "Nouveau site e-commerce" }
 *               description: { type: string }
 *               date_echeance: { type: string, format: date, example: "2025-12-31" }
 *     responses:
 *       201:
 *         description: Projet créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 projet: { $ref: '#/components/schemas/Projet' }
 */
router.post("/", projetValidation, creerProjet);

/**
 * @swagger
 * /api/projets/{id}:
 *   get:
 *     summary: Détail d'un projet (avec tâches et membres)
 *     tags: [Projets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet, membres et tâches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projet: { $ref: '#/components/schemas/Projet' }
 *                 membres:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Utilisateur' }
 *                 taches:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Tache' }
 *       404:
 *         description: Projet introuvable
 */
router.get("/:id", isProjectMember, voirProjet);

/**
 * @swagger
 * /api/projets/{id}:
 *   put:
 *     summary: Modifier un projet (créateur ou admin)
 *     tags: [Projets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre: { type: string }
 *               description: { type: string }
 *               statut: { type: string, enum: [actif, en_pause, terminé, annulé] }
 *               date_echeance: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Projet modifié
 *       403:
 *         description: Non autorisé
 */
router.put("/:id", isProjectMember, projetValidation, modifierProjet);

/**
 * @swagger
 * /api/projets/{id}:
 *   delete:
 *     summary: Supprimer un projet (créateur ou admin)
 *     tags: [Projets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet supprimé
 *       403:
 *         description: Non autorisé
 */
router.delete("/:id", isProjectMember, supprimerProjet);

/**
 * @swagger
 * /api/projets/{id}/membres:
 *   post:
 *     summary: Ajouter un membre au projet
 *     tags: [Projets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilisateur_id]
 *             properties:
 *               utilisateur_id: { type: integer, example: 3 }
 *               role_projet: { type: string, enum: [chef, membre, observateur], default: membre }
 *     responses:
 *       201:
 *         description: Membre ajouté
 */
router.post("/:id/membres", isProjectMember, ajouterMembre);

/**
 * @swagger
 * /api/projets/{id}/taches:
 *   get:
 *     summary: Lister les tâches d'un projet
 *     tags: [Tâches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [a_faire, en_cours, termine] }
 *       - in: query
 *         name: assigne_a
 *         schema: { type: integer }
 *       - in: query
 *         name: priorite
 *         schema: { type: string, enum: [faible, normale, haute, urgente] }
 *     responses:
 *       200:
 *         description: Liste des tâches
 */
router.get("/:id/taches", isProjectMember, listerTaches);

/**
 * @swagger
 * /api/projets/{id}/taches:
 *   post:
 *     summary: Créer une tâche dans un projet
 *     tags: [Tâches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre]
 *             properties:
 *               titre: { type: string, example: "Corriger le bug de login" }
 *               description: { type: string }
 *               assigne_a: { type: integer, nullable: true }
 *               priorite: { type: string, enum: [faible, normale, haute, urgente], default: normale }
 *               date_echeance: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Tâche créée
 */
router.post("/:id/taches", isProjectMember, tacheValidation, creerTache);

/**
 * @swagger
 * /api/projets/{id}/invitations:
 *   get:
 *     summary: Lister les invitations d'un projet (créateur uniquement)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des invitations
 *   post:
 *     summary: Inviter un utilisateur dans le projet
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilisateur_id]
 *             properties:
 *               utilisateur_id: { type: integer, example: 3 }
 *               message: { type: string, example: "Rejoins notre équipe !" }
 *     responses:
 *       201:
 *         description: Invitation envoyée
 *       409:
 *         description: Déjà membre ou invitation en attente
 */
router.get("/:id/invitations", listerInvitationsProjet);
router.post("/:id/invitations", envoyerInvitation);

/**
 * @swagger
 * /api/projets/{id}/membres/{userId}:
 *   delete:
 *     summary: Retirer un membre du projet (créateur uniquement)
 *     tags: [Projets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Membre retiré
 *       403:
 *         description: Non autorisé
 */
router.delete("/:id/membres/:userId", retirerMembre);

module.exports = router;
