import Joi from 'joi';

const messages = {
  'string.empty': 'Ce champ ne peut pas être vide',
  'string.min': 'Ce champ est trop court',
  'string.max': 'Ce champ est trop long',
  'string.email': "L'adresse e-mail n'est pas valide",
  'string.guid': "L'identifiant fourni n'est pas valide",
  'string.pattern.name': "L'identifiant fourni n'est pas valide",
  'any.required': 'Ce champ est requis',
  'any.only': 'Valeur non autorisée pour ce champ',
};

const uuid = Joi.string().pattern(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'uuid'
);

export const createUserSchema = Joi.object({
  nom: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
  }),
  role: Joi.string().valid('user', 'admin').default('user'),
}).messages(messages);

export const createProjectSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  color: Joi.string().trim().max(20).allow('', null),
  member_ids: Joi.array().items(uuid).default([]),
}).messages(messages);

export const addTaskAssigneeSchema = Joi.object({
  user_id: uuid.required(),
}).messages(messages);

export const updateProjectSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().max(2000).allow('', null),
  color: Joi.string().trim().max(20).allow('', null),
})
  .min(1)
  .messages({ ...messages, 'object.min': 'Aucune modification fournie' });

export const addMemberSchema = Joi.object({
  user_id: uuid.required(),
}).messages(messages);

export const createTaskSchema = Joi.object({
  project_id: uuid.required(),
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(5000).allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  due_date: Joi.date().iso().allow(null),
  assigned_user_ids: Joi.array().items(uuid).default([]),
}).messages(messages);              