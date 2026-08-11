import express from 'express';
// Importe le framework Express

import { authenticate, requireAdmin } from '../middlewares/auth.js';
// Importe les middlewares d'authentification (vérifie le JWT) et de restriction admin (vérifie le rôle)

import { validate } from '../middlewares/validate.js';
// Importe la factory de middleware de validation (basée sur des schémas Joi)

import {
  createUserSchema,
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  createTaskSchema,
  addTaskAssigneeSchema
} from '../validation/adminSchemas.js';
// Importe les schémas de validation Joi correspondant à chaque action de cette route (un schéma par opération)

import {
  createUser,
  createProjectAndAssign,
  createTaskAndAssign,
  getAllUsers,
  addProjectMember,
  updateProject,
  deleteProject,
  deleteTask,
  addTaskAssignee
} from '../controllers/adminController.js';
// Importe les fonctions contrôleurs correspondantes depuis le fichier adminController.js

const router = express.Router();
// Crée une nouvelle instance de routeur Express, dédiée aux routes d'administration

router.use(authenticate, requireAdmin);
// Applique ces deux middlewares à TOUTES les routes définies plus bas dans ce routeur :
// d'abord authenticate (vérifie le token et attache req.user), puis requireAdmin (vérifie req.user.role === 'admin')

router.post('/users', validate(createUserSchema), createUser);
// POST /users : valide le corps de la requête avec createUserSchema, puis crée un nouvel utilisateur

router.get('/users', getAllUsers);
// GET /users : liste tous les utilisateurs (pas de validation de body nécessaire pour un GET)

router.post('/projects', validate(createProjectSchema), createProjectAndAssign);
// POST /projects : valide le corps avec createProjectSchema, puis crée un projet et l'assigne (probablement à des membres)

router.put('/projects/:id', validate(updateProjectSchema), updateProject);
// PUT /projects/:id : valide le corps avec updateProjectSchema, puis met à jour le projet dont l'id est dans l'URL

router.delete('/projects/:id', deleteProject);
// DELETE /projects/:id : supprime le projet dont l'id est dans l'URL (pas de validation de body)

router.post('/projects/:projectId/members', validate(addMemberSchema), addProjectMember);
// POST /projects/:projectId/members : valide le corps avec addMemberSchema, puis ajoute un membre au projet ciblé

router.post('/tasks', validate(createTaskSchema), createTaskAndAssign);
// POST /tasks : valide le corps avec createTaskSchema, puis crée une tâche et l'assigne (probablement à un ou plusieurs utilisateurs)

router.post('/tasks/:id/assignees', validate(addTaskAssigneeSchema), addTaskAssignee);
// POST /tasks/:id/assignees : valide le corps avec addTaskAssigneeSchema, puis ajoute un assigné à la tâche ciblée

router.delete('/tasks/:id', deleteTask);
// DELETE /tasks/:id : supprime la tâche dont l'id est dans l'URL (pas de validation de body)

export default router;
// Exporte ce routeur pour qu'il soit monté sur un préfixe (ex: /api/admin) dans le fichier principal de l'application