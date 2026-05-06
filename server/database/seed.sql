-- ============================================
-- DONNÉES DE TEST - Digital Solutions
-- ============================================
-- Mots de passe : tous sont "Password123!" (hashés avec bcrypt)

INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
(
    'Admin Système',
    'admin@digital.cm',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'administrateur'
),
(
    'Alice Dupont',
    'alice@digital.cm',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'membre'
),
(
    'Bob Martin',
    'bob@digital.cm',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'membre'
),
(
    'Claire Ngo',
    'claire@digital.cm',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'membre'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO projets (titre, description, statut, createur_id, date_echeance) VALUES
(
    'Refonte Site Vitrine',
    'Modernisation complète du site vitrine de l''entreprise avec un design responsive.',
    'actif',
    1,
    '2025-06-30'
),
(
    'Application Mobile RH',
    'Développement d''une application mobile pour la gestion des ressources humaines.',
    'actif',
    2,
    '2025-08-15'
),
(
    'Dashboard Analytics',
    'Tableau de bord pour visualiser les KPIs et métriques business en temps réel.',
    'en_pause',
    1,
    '2025-05-01'
);

INSERT INTO membres_projets (projet_id, utilisateur_id, role_projet) VALUES
(1, 1, 'chef'), (1, 2, 'membre'), (1, 3, 'membre'),
(2, 2, 'chef'), (2, 3, 'membre'), (2, 4, 'membre'),
(3, 1, 'chef'), (3, 4, 'membre');

INSERT INTO taches (projet_id, titre, description, statut, priorite, assigne_a, createur_id, date_echeance) VALUES
(1, 'Maquettes Figma', 'Créer les maquettes de toutes les pages', 'termine', 'haute', 2, 1, '2025-04-01'),
(1, 'Intégration HTML/CSS', 'Intégrer les maquettes en HTML/CSS responsive', 'en_cours', 'haute', 2, 1, '2025-05-15'),
(1, 'SEO & Performance', 'Optimiser le référencement et les temps de chargement', 'a_faire', 'normale', 3, 1, '2025-06-15'),
(2, 'Architecture API', 'Définir l''architecture de l''API REST', 'termine', 'urgente', 2, 2, '2025-03-20'),
(2, 'Écran de connexion', 'Développer l''écran de connexion et d''inscription', 'en_cours', 'haute', 3, 2, '2025-04-30'),
(2, 'Module congés', 'Gestion des demandes de congés', 'a_faire', 'normale', 4, 2, '2025-07-01'),
(3, 'Connexion base de données', 'Connecter le dashboard à la BDD analytics', 'a_faire', 'urgente', 4, 1, '2025-04-20'),
(3, 'Graphiques temps réel', 'Implémenter les graphiques avec WebSockets', 'a_faire', 'haute', 1, 1, '2025-04-25');

INSERT INTO commentaires (tache_id, auteur_id, contenu) VALUES
(1, 2, 'Maquettes terminées, en attente de validation client.'),
(1, 1, 'Validé ! Excellent travail, on peut passer à l''intégration.'),
(2, 2, 'Intégration en cours, environ 60% réalisé.'),
(4, 2, 'Architecture RESTful avec JWT définie. Doc disponible sur Confluence.');