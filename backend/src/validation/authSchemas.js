import Joi from 'joi';

const messages = {
  'string.empty': 'Ce champ ne peut pas être vide',
  'string.min': 'Ce champ est trop court',
  'string.max': 'Ce champ est trop long',
  'string.email': "L'adresse e-mail n'est pas valide",
  'any.required': 'Ce champ est requis',
};

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).messages(messages);

export const updateProfileSchema = Joi.object({
  nom: Joi.string().trim().min(2).max(100),
  email: Joi.string().email(),
})
  .min(1)
  .messages({ ...messages, 'object.min': 'Aucune modification fournie' });

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  }),
}).messages(messages);