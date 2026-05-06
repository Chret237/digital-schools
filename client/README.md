# Digital Solutions — Frontend React

Interface utilisateur de la plateforme de gestion de projets.

## Stack technique

- **Framework :** React 18 + React Router v6
- **État global :** Redux Toolkit
- **HTTP :** Axios (avec intercepteurs JWT auto)
- **Temps réel :** Socket.IO client
- **Graphiques :** Recharts
- **Notifications :** react-hot-toast
- **Fonts :** Sora + JetBrains Mono (Google Fonts)

## Installation

```bash
cd client
npm install
```

## Démarrer

```bash
npm start    # http://localhost:3000
```

> Le proxy vers `http://localhost:5000` est configuré dans `package.json`.  
> Le backend doit tourner en parallèle.

## Structure

```
src/
├── components/
│   ├── ui/           # Button, Input, Badge, Modal, Avatar, Spinner…
│   └── layout/       # Layout (sidebar), PrivateRoute
├── pages/
│   ├── AuthPage.js         # Login + Register
│   ├── DashboardPage.js    # Stats + graphiques
│   ├── ProjectsPage.js     # Liste projets (recherche, filtre, pagination)
│   ├── ProjectDetailPage.js # Kanban + tâches + commentaires
│   └── ProfilePage.js      # Profil + changement mot de passe
├── services/
│   └── api.js        # Axios instance + intercepteurs
├── store/
│   ├── index.js
│   └── slices/       # authSlice, projetSlice, tacheSlice
└── styles/
    ├── global.css    # Variables CSS + reset
    └── components.css # Styles composants réutilisables
```

## Pages & Routes

| Route | Page | Auth |
|-------|------|------|
| `/login` | Connexion | ❌ |
| `/register` | Inscription | ❌ |
| `/dashboard` | Tableau de bord | ✅ |
| `/projects` | Liste des projets | ✅ |
| `/projects/:id` | Détail + Kanban | ✅ |
| `/profile` | Mon profil | ✅ |

## Fonctionnalités implémentées

- ✅ Authentification JWT (login / register / logout)
- ✅ Profil utilisateur (modification, changement mdp)
- ✅ Liste des projets avec **recherche instantanée**, filtre statut, pagination
- ✅ CRUD projets (créer, modifier, supprimer)
- ✅ Tableau **Kanban** 3 colonnes (À faire / En cours / Terminé)
- ✅ Création et suppression de tâches
- ✅ Changement de statut des tâches
- ✅ Panneau de détail tâche avec **commentaires**
- ✅ Tableau de bord avec **graphiques** (Recharts)
- ✅ Design responsive (mobile + desktop)
- ✅ Notifications toast (succès / erreur)
- ✅ Gestion des erreurs utilisateur
