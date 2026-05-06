// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Solutions API",
      version: "1.0.0",
      description: `
## API de gestion de projets collaboratifs

Plateforme développée pour **Digital Solutions** permettant la gestion de projets, tâches et équipes.

### Authentification
Toutes les routes protégées nécessitent un **Bearer Token JWT**.

Obtenez votre token via \`POST /api/auth/login\`, puis ajoutez le header :
\`\`\`
Authorization: Bearer <votre_token>
\`\`\`

### Utilisateurs de test
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@digital.cm | password | Administrateur |
| alice@digital.cm | password | Membre |
| bob@digital.cm | password | Membre |
| claire@digital.cm | password | Membre |
      `,
      contact: {
        name: "Digital Solutions Developer",
        email: "kamdeuchretien@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Serveur de développement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Utilisateur: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nom: { type: "string", example: "Alice Dupont" },
            email: {
              type: "string",
              format: "email",
              example: "alice@digital.cm",
            },
            role: {
              type: "string",
              enum: ["administrateur", "membre"],
              example: "membre",
            },
            avatar: { type: "string", nullable: true },
            date_inscription: { type: "string", format: "date-time" },
          },
        },
        Projet: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            titre: { type: "string", example: "Refonte Site Vitrine" },
            description: {
              type: "string",
              example: "Modernisation du site...",
            },
            statut: {
              type: "string",
              enum: ["actif", "en_pause", "terminé", "annulé"],
              example: "actif",
            },
            createur_id: { type: "integer", example: 1 },
            date_echeance: { type: "string", format: "date", nullable: true },
            date_creation: { type: "string", format: "date-time" },
          },
        },
        Tache: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            projet_id: { type: "integer", example: 1 },
            titre: { type: "string", example: "Intégration HTML/CSS" },
            description: { type: "string", nullable: true },
            statut: {
              type: "string",
              enum: ["a_faire", "en_cours", "termine"],
              example: "en_cours",
            },
            priorite: {
              type: "string",
              enum: ["faible", "normale", "haute", "urgente"],
              example: "haute",
            },
            assigne_a: { type: "integer", nullable: true },
            date_echeance: { type: "string", format: "date", nullable: true },
            date_creation: { type: "string", format: "date-time" },
          },
        },
        Commentaire: {
          type: "object",
          properties: {
            id: { type: "integer" },
            tache_id: { type: "integer" },
            auteur_id: { type: "integer" },
            auteur_nom: { type: "string" },
            contenu: { type: "string" },
            date_creation: { type: "string", format: "date-time" },
          },
        },
        Erreur: {
          type: "object",
          properties: {
            message: { type: "string", example: "Ressource introuvable." },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limite: { type: "integer", example: 10 },
            total: { type: "integer", example: 42 },
            pages: { type: "integer", example: 5 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentification et gestion de profil" },
      {
        name: "Projets",
        description: "CRUD des projets et gestion des membres",
      },
      {
        name: "Tâches",
        description: "Gestion des tâches et changement de statut",
      },
      { name: "Commentaires", description: "Commentaires sur les tâches" },
      { name: "Utilisateurs", description: "Liste et stats des utilisateurs" },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
