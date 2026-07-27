# TaskManager — Plateforme de Gestion de Tâches Collaborative

Application web collaborative de gestion de projets et de tâches, avec vues Liste et Kanban, commentaires, notifications, et tableau de bord statistique. Développée dans le cadre d'un stage de perfectionnement Vue.js Fullstack.

> Le nom d'interface affiché dans l'application est **Taskly** — `TaskManager` reste le nom du projet/dépôt.

## Fonctionnalités

**Cœur du cahier des charges**
- Authentification JWT (connexion, pas d'inscription publique — les comptes sont créés par l'administrateur)
- Gestion de projets et tâches avec statut (À faire / En cours / Terminé), priorité et échéance
- Vues Liste et Kanban avec glisser-déposer entre colonnes
- Assignation multi-membres sur les tâches
- Commentaires sur les tâches, avec notifications
- Filtrage et recherche des tâches
- Alertes de retard (tâches et projets)
- Isolation des données par utilisateur (un membre ne voit que ses projets)

**Au-delà du cahier des charges**
- Mode sombre (bascule persistée)
- Tableau de bord : répartition par statut/priorité, taux de complétion, décomptes de retard
- Page de notifications avec suivi lu/non lu
- Photo de profil (upload)
- Projets épinglés et récents dans la barre latérale, avec recherche rapide
- Suppression de projets/tâches/commentaires (droits admin ou auteur selon le cas)
- Modales de création de projet (couleur, membres) et de tâche (assignation limitée aux membres du projet)

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | Vue 3 (Composition API), Vue Router, Pinia |
| Backend | Node.js, Express |
| Base de données | PostgreSQL |
| Authentification | JWT + bcrypt |
| Style | Tailwind CSS |

## Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm

## Installation

### 1. Base de données

Créer la base et les tables via `psql` ou le Query Tool de pgAdmin :

```sql
CREATE DATABASE taskmanager_db
    WITH ENCODING 'UTF8'
    TEMPLATE = template0;

\c taskmanager_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#E8523F',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_assignments (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

Créer ensuite un compte administrateur initial (remplace le hash par un vrai hash bcrypt généré via `node -e "require('bcrypt').hash('TonMotDePasse', 10).then(console.log)"`) :

```sql
INSERT INTO users (nom, email, password_hash, role)
VALUES ('Administrateur Principal', 'admin@taskmanager.com', 'TON_HASH_BCRYPT_ICI', 'admin');
```

### 2. Backend

```bash
cd backend
npm install
```

Créer `backend/.env` :

```
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=taskmanager_db
DB_PORT=5432
JWT_SECRET=votre_cle_secrete_jwt
FRONTEND_URL=http://localhost:5173
```

Lancer le serveur :

```bash
npm run dev
```

L'API est disponible sur `http://localhost:5000/api`. Le dossier `backend/uploads` (photos de profil) est créé automatiquement au premier upload.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

## Variables d'environnement (backend)

| Variable | Description |
|---|---|
| `PORT` | Port d'écoute de l'API (défaut : 5000) |
| `DB_HOST` | Hôte PostgreSQL |
| `DB_USER` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `DB_NAME` | Nom de la base (`taskmanager_db`) |
| `DB_PORT` | Port PostgreSQL (défaut : 5432) |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT |
| `FRONTEND_URL` | Origine autorisée par CORS (défaut : `http://localhost:5173`) |

## Structure du projet

```
task-manager/
├── backend/
│   ├── src/
│   │   ├── config/          # Connexion PostgreSQL
│   │   ├── controllers/     # Logique métier par domaine
│   │   ├── middlewares/     # Authentification, rôles
│   │   ├── routes/          # Définition des routes Express
│   │   ├── services/        # Fonctions utilitaires partagées (autorisation, statut projet)
│   │   └── server.js
│   └── uploads/              # Photos de profil (généré automatiquement)
└── frontend/
    └── src/
        ├── components/       # Composants réutilisables (Avatar, modales, layout)
        ├── views/            # Pages de l'application
        ├── stores/           # Stores Pinia (auth)
        ├── router/           # Routes Vue Router + garde de navigation
        ├── services/         # Client API (Axios)
        └── utils/            # Couleurs, thème, projets récents/épinglés
```

## Sécurité

- Mots de passe hachés avec bcrypt
- Authentification par token JWT (Bearer, expiration 8h)
- Isolation des données : chaque requête vérifie l'appartenance au projet (membre ou administrateur) avant de renvoyer des données ou d'autoriser une modification
- CORS restreint à l'origine du frontend

## Comptes de test

Si vous utilisez le jeu de données de démonstration :

| Email | Mot de passe | Rôle |
|---|---|---|
| awa.koffi@taskly.io | Admin123! | admin |
| moussa.diallo@taskly.io | Membre123! | user |
| sarah.yao@taskly.io | Membre123! | user |
| jean.toure@taskly.io | Membre123! | user |

⚠️ À usage local/développement uniquement — ne pas utiliser ces identifiants en production.

## Ce qu'il reste à faire

- Validation des entrées côté backend (Joi/Zod)
- Mécanisme de refresh token
- Tests fonctionnels et vérification du responsive sur mobile réel
- Schéma de base de données (diagramme ERD)