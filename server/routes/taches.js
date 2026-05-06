// routes/taches.js
const express = require("express");
const {
  voirTache,
  modifierTache,
  changerStatut,
  supprimerTache,
  ajouterCommentaire,
} = require("../controllers/tacheController");
const { authenticate } = require("../middleware/auth");
const { checkTacheOwner } = require("../middleware/checkTacheOwner");

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/taches/{id}:
 *   get:
 *     summary: Détail d'une tâche avec ses commentaires
 *     tags: [Tâches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tâche et commentaires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tache: { $ref: '#/components/schemas/Tache' }
 *                 commentaires:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Commentaire' }
 *       404:
 *         description: Tâche introuvable
 */
router.get("/:id", voirTache);

/**
 * @swagger
 * /api/taches/{id}:
 *   put:
 *     summary: Modifier une tâche
 *     tags: [Tâches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre: { type: string }
 *               description: { type: string }
 *               assigne_a: { type: integer, nullable: true }
 *               priorite: { type: string, enum: [faible, normale, haute, urgente] }
 *               date_echeance: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Tâche modifiée
 */
router.put("/:id", checkTacheOwner, modifierTache);

/**
 * @swagger
 * /api/taches/{id}/statut:
 *   patch:
 *     summary: Changer le statut d'une tâche (Kanban)
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
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [a_faire, en_cours, termine]
 *                 example: en_cours
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 tache: { $ref: '#/components/schemas/Tache' }
 *       400:
 *         description: Statut invalide
 */
router.patch("/:id/statut", checkTacheOwner, changerStatut);

/**
 * @swagger
 * /api/taches/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Tâches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tâche supprimée
 *       404:
 *         description: Tâche introuvable
 */
router.delete("/:id", checkTacheOwner, supprimerTache);

/**
 * @swagger
 * /api/taches/{id}/commentaires:
 *   post:
 *     summary: Ajouter un commentaire à une tâche
 *     tags: [Commentaires]
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
 *             required: [contenu]
 *             properties:
 *               contenu: { type: string, example: "Je prends en charge cette tâche." }
 *     responses:
 *       201:
 *         description: Commentaire ajouté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 commentaire: { $ref: '#/components/schemas/Commentaire' }
 */
router.post("/:id/commentaires", ajouterCommentaire);

module.exports = router;
