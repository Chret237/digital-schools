# Digital Solutions — Backend API

API RESTful pour la plateforme de gestion de projets collaboratifs.

## Stack technique

- **Runtime :** Node.js + Express
- **Base de données :** PostgreSQL
- **Auth :** JWT + bcryptjs
- **Temps réel :** Socket.IO
- **Docs API :** Swagger UI (OpenAPI 3.0)

## Installation

```bash
cd server
npm install
cp .env.example .env   # puis éditer .env avec vos paramètres
```

## Configuration `.env`

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_solutions
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=un_secret_long_et_aleatoire
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

## Initialiser la base de données

```bash
# Créer la BDD dans PostgreSQL d'abord :
psql -U postgres -c "CREATE DATABASE digital_solutions;"

# Puis lancer le setup :
npm run db:setup
```

## Démarrer le serveur

```bash
npm run dev      # développement (nodemon)
npm start        # production
```

## Documentation API

Une fois le serveur lancé, ouvrir :

```
http://localhost:5000/api-docs
```

## Endpoints principaux

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/auth/register` | Créer un compte | ❌ |
| POST | `/api/auth/login` | Se connecter | ❌ |
| GET | `/api/auth/me` | Mon profil | ✅ |
| GET | `/api/projets` | Liste des projets | ✅ |
| POST | `/api/projets` | Créer un projet | ✅ |
| GET | `/api/projets/:id` | Détail projet | ✅ |
| PUT | `/api/projets/:id` | Modifier projet | ✅ |
| DELETE | `/api/projets/:id` | Supprimer projet | ✅ |
| GET | `/api/projets/:id/taches` | Tâches du projet | ✅ |
| POST | `/api/projets/:id/taches` | Créer une tâche | ✅ |
| PATCH | `/api/taches/:id/statut` | Changer statut | ✅ |
| POST | `/api/taches/:id/commentaires` | Commenter | ✅ |
| GET | `/api/utilisateurs` | Liste utilisateurs | ✅ |
| GET | `/api/utilisateurs/stats` | Stats globales | 🔐 Admin |

## Utilisateurs de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@digital.cm | password | Administrateur |
| alice@digital.cm | password | Membre |
| bob@digital.cm | password | Membre |
| claire@digital.cm | password | Membre |

## Health Check

```
GET http://localhost:5000/health
```

## WebSockets (Socket.IO)

Événements disponibles :
- `join_project(projetId)` — Rejoindre la room d'un projet
- `leave_project(projetId)` — Quitter la room
