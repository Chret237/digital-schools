-- ============================================
-- SCHÉMA BASE DE DONNÉES - Digital Solutions
-- ============================================

-- Extension pour UUID (optionnel)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table UTILISATEURS
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'membre' CHECK (role IN ('administrateur', 'membre')),
    avatar VARCHAR(255),
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table PROJETS
CREATE TABLE IF NOT EXISTS projets (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'en_pause', 'terminé', 'annulé')),
    createur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    date_echeance DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table TÂCHES
CREATE TABLE IF NOT EXISTS taches (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    statut VARCHAR(20) DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('faible', 'normale', 'haute', 'urgente')),
    assigne_a INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    createur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    date_echeance DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table COMMENTAIRES (relation N-N taches-utilisateurs)
CREATE TABLE IF NOT EXISTS commentaires (
    id SERIAL PRIMARY KEY,
    tache_id INTEGER NOT NULL REFERENCES taches(id) ON DELETE CASCADE,
    auteur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table MEMBRES_PROJETS (N-N projets-utilisateurs)
CREATE TABLE IF NOT EXISTS membres_projets (
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    role_projet VARCHAR(20) DEFAULT 'membre' CHECK (role_projet IN ('chef', 'membre', 'observateur')),
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (projet_id, utilisateur_id)
);

-- Table INVITATIONS
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    invite_par INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'annulee')),
    message TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP,
    UNIQUE (projet_id, utilisateur_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_taches_projet ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_assigne ON taches(assigne_a);
CREATE INDEX IF NOT EXISTS idx_projets_createur ON projets(createur_id);
CREATE INDEX IF NOT EXISTS idx_commentaires_tache ON commentaires(tache_id);
CREATE INDEX IF NOT EXISTS idx_invitations_utilisateur ON invitations(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_invitations_projet ON invitations(projet_id);
CREATE INDEX IF NOT EXISTS idx_invitations_statut ON invitations(statut);