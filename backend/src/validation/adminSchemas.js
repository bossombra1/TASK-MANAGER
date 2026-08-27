import Joi from 'joi';
// Importe la librairie Joi, utilisée pour définir des schémas de validation de données

const messages = {
  // Objet de messages d'erreur personnalisés, réutilisé par plusieurs schémas via .messages()
  'string.empty': 'Ce champ ne peut pas être vide',
  // Message affiché quand une chaîne requise est vide
  'string.min': 'Ce champ est trop court',
  // Message affiché quand une chaîne est plus courte que la longueur minimale définie
  'string.max': 'Ce champ est trop long',
  // Message affiché quand une chaîne dépasse la longueur maximale définie
  'string.email': "L'adresse e-mail n'est pas valide",
  // Message affiché quand la validation .email() échoue
  'string.guid': "L'identifiant fourni n'est pas valide",
  // Message affiché en cas d'échec de validation d'un GUID (non utilisé directement ici, mais prévu)
  'string.pattern.name': "L'identifiant fourni n'est pas valide",
  // Message affiché quand une chaîne ne respecte pas un pattern nommé (utilisé par le pattern "uuid" ci-dessous)
  'any.required': 'Ce champ est requis',
  // Message affiché quand un champ obligatoire est absent
  'any.only': 'Valeur non autorisée pour ce champ',
  // Message affiché quand une valeur ne fait pas partie des valeurs autorisées (ex: .valid(...))
};

const uuid = Joi.string().pattern(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'uuid'
);
// Définit un schéma réutilisable "uuid" : une chaîne qui doit respecter le format UUID standard
// (8-4-4-4-12 caractères hexadécimaux séparés par des tirets), insensible à la casse (/i)
// Le second argument 'uuid' nomme ce pattern, ce qui permet au message 'string.pattern.name' de s'appliquer

export const createUserSchema = Joi.object({
  // Schéma de validation pour la création d'un utilisateur
  nom: Joi.string().trim().min(2).max(100).required(),
  // "nom" : chaîne obligatoire, espaces de début/fin retirés, entre 2 et 100 caractères
  email: Joi.string().email().required(),
  // "email" : chaîne obligatoire, doit respecter le format email
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
  }),
  // "password" : chaîne obligatoire d'au moins 8 caractères, avec un message d'erreur spécifique
  // qui surcharge le message générique 'string.min' défini plus haut, uniquement pour ce champ
  role: Joi.string().valid('user', 'admin').default('user'),
  // "role" : chaîne qui doit être 'user' ou 'admin' ; si absente, prend la valeur par défaut 'user'
}).messages(messages);
// Applique l'objet de messages génériques défini plus haut à tous les champs de ce schéma
// (sauf ceux explicitement surchargés, comme password.string.min)

export const createProjectSchema = Joi.object({
  // Schéma de validation pour la création d'un projet
  title: Joi.string().trim().min(2).max(150).required(),
  // "title" : chaîne obligatoire, nettoyée, entre 2 et 150 caractères
  description: Joi.string().trim().max(2000).allow('', null),
  // "description" : chaîne facultative, max 2000 caractères, autorise explicitement une chaîne vide ou null
  color: Joi.string().trim().max(20).allow('', null),
  // "color" : chaîne facultative, max 20 caractères, autorise une chaîne vide ou null
  member_ids: Joi.array().items(uuid).default([]),
  // "member_ids" : tableau d'UUID (réutilise le schéma "uuid" défini plus haut), vide par défaut si absent
}).messages(messages);
// Applique les messages d'erreur génériques à ce schéma

export const addTaskAssigneeSchema = Joi.object({
  // Schéma de validation pour l'ajout d'un assigné à une tâche
  user_id: uuid.required(),
  // "user_id" : doit être un UUID valide (réutilise le schéma "uuid") et est obligatoire
}).messages(messages);
// Applique les messages d'erreur génériques à ce schéma

export const updateProjectSchema = Joi.object({
  // Schéma de validation pour la mise à jour d'un projet (tous les champs sont facultatifs individuellement)
  title: Joi.string().trim().min(2).max(150),
  // "title" : chaîne facultative, entre 2 et 150 caractères si fournie
  description: Joi.string().trim().max(2000).allow('', null),
  // "description" : chaîne facultative, max 2000 caractères, autorise vide ou null
  color: Joi.string().trim().max(20).allow('', null),
  // "color" : chaîne facultative, max 20 caractères, autorise vide ou null
})
  .min(1)
  // Contrainte au niveau de l'objet entier : au moins 1 clé doit être présente dans les données soumises
  // (empêche une requête de mise à jour totalement vide)
  .messages({ ...messages, 'object.min': 'Aucune modification fournie' });
  // Fusionne les messages génériques avec un message spécifique pour la contrainte .min(1) ci-dessus

export const addMemberSchema = Joi.object({
  // Schéma de validation pour l'ajout d'un membre à un projet
  user_id: uuid.required(),
  // "user_id" : doit être un UUID valide et est obligatoire
}).messages(messages);
// Applique les messages d'erreur génériques à ce schéma

export const createTaskSchema = Joi.object({
  // Schéma de validation pour la création d'une tâche
  project_id: uuid.required(),
  // "project_id" : doit être un UUID valide et est obligatoire (la tâche doit appartenir à un projet)
  title: Joi.string().trim().min(2).max(200).required(),
  // "title" : chaîne obligatoire, entre 2 et 200 caractères
  description: Joi.string().trim().max(5000).allow('', null),
  // "description" : chaîne facultative, max 5000 caractères, autorise vide ou null
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  // "priority" : doit être 'low', 'medium' ou 'high' ; vaut 'medium' par défaut si absente
  due_date: Joi.date().iso().allow(null),
 start_date: Joi.date().iso().allow(null),
  // "due_date" : doit être une date au format ISO si fournie, ou explicitement null
  assigned_user_ids: Joi.array().items(uuid).default([]),
  // "assigned_user_ids" : tableau d'UUID, vide par défaut si absent
}).messages(messages);
// Applique les messages d'erreur génériques à ce schéma