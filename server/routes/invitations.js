// routes/invitations.js
const express = require('express');
const {
  mesInvitations, accepterInvitation, refuserInvitation, annulerInvitation,
} = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/invitations/mes-invitations:
 *   get:
 *     summary: Mes invitations reçues
 *     tags: [Invitations]
 *     responses:
 *       200:
 *         description: Liste des invitations reçues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Invitation' }
 *                 en_attente:
 *                   type: integer
 *                   description: Nombre d'invitations en attente
 */
router.get('/mes-invitations', mesInvitations);

/**
 * @swagger
 * /api/invitations/{id}/accepter:
 *   patch:
 *     summary: Accepter une invitation
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Invitation acceptée, ajouté aux membres du projet
 *       404:
 *         description: Invitation introuvable ou déjà traitée
 */
router.patch('/:id/accepter', accepterInvitation);

/**
 * @swagger
 * /api/invitations/{id}/refuser:
 *   patch:
 *     summary: Refuser une invitation
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Invitation refusée
 */
router.patch('/:id/refuser', refuserInvitation);

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Annuler une invitation (créateur uniquement)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Invitation annulée
 *       403:
 *         description: Non autorisé
 */
router.delete('/:id', annulerInvitation);

module.exports = router;
