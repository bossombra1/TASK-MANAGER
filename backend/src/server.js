import express from 'express';
// Importe le framework Express

import cors from 'cors';
// Importe le middleware CORS, pour autoriser des requêtes cross-origin (ex: depuis le frontend sur un autre port/domaine)

import dotenv from 'dotenv';
// Importe dotenv, pour charger les variables d'environnement depuis un fichier .env

import path from 'path';
// Importe le module natif Node.js "path", pour manipuler des chemins de fichiers de façon portable

import { fileURLToPath } from 'url';
// Importe une fonction native Node.js permettant de convertir une URL de module (import.meta.url) en chemin de fichier classique

import authRoutes from './routes/authRoutes.js';
// Importe le routeur des routes d'authentification (login, inscription, etc.)

import adminRoutes from './routes/adminRoutes.js';
// Importe le routeur des routes d'administration (vu précédemment : users, projects, tasks...)

import projectRoutes from './routes/projectRoutes.js';
// Importe le routeur des routes liées aux projets (accessibles aux utilisateurs non-admin)

import taskRoutes from './routes/taskRoutes.js';
// Importe le routeur des routes liées aux tâches (accessibles aux utilisateurs non-admin)

import commentRoutes from './routes/commentRoutes.js';
// Importe le routeur des routes liées aux commentaires

import superAdminRoutes from './routes/superAdminRoutes.js';
// Importe le routeur des routes liées aux super admin

import notificationRoutes from './routes/notificationRoutes.js';
// Importe le routeur des routes liées aux notifications

dotenv.config();
// Charge les variables définies dans le fichier .env dans process.env (doit être fait tôt, avant toute utilisation de process.env)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Reconstitue l'équivalent de __dirname (absent nativement en modules ES) :
// fileURLToPath convertit l'URL du fichier courant en chemin, path.dirname en extrait le dossier parent

const app = express();
// Crée l'instance principale de l'application Express

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
// Active CORS pour toute l'application, en autorisant uniquement l'origine définie par FRONTEND_URL
// ou, à défaut, l'URL par défaut du serveur de dev Vite (localhost:5173)

app.use(express.json());
// Active le middleware natif d'Express qui parse automatiquement le corps des requêtes au format JSON
// et le rend disponible dans req.body

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Sert les fichiers statiques du dossier "uploads" (situé un niveau au-dessus du dossier courant)
// sur le préfixe d'URL /uploads (ex: un fichier uploads/avatar.png devient accessible via /uploads/avatar.png)

app.use('/api/auth', authRoutes);
// Monte le routeur d'authentification sur le préfixe /api/auth

app.use('/api/admin', adminRoutes);
// Monte le routeur d'administration sur le préfixe /api/admin

app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager opérationnelle' });
});
// Route racine simple (GET /) : sert de endpoint de vérification que l'API tourne (health check basique)

app.use('/api/projects', projectRoutes);
// Monte le routeur des projets sur le préfixe /api/projects

app.use('/api/tasks', taskRoutes);
// Monte le routeur des tâches sur le préfixe /api/tasks

app.use('/api/comments', commentRoutes);
// Monte le routeur des commentaires sur le préfixe /api/comments

app.use('/api/super-admin', superAdminRoutes);
// Monte le routeur des super admin sur le préfixe /api/super-admin

app.use('/api/notifications', notificationRoutes);
// Monte le routeur des notifications sur le préfixe /api/notifications

const PORT = process.env.PORT || 5000;
// Définit le port d'écoute du serveur : celui défini en variable d'environnement, ou 5000 par défaut

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
// Démarre le serveur HTTP sur le port défini, et affiche un message de confirmation dans la console une fois lancé