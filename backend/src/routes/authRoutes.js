import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validation/authSchemas.js';
import { uploadAvatar } from '../config/upload.js';
import { register, login, updateProfile, changePassword, updateAvatar } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.put('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

router.post('/avatar', authenticate, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Erreur lors de l'upload" });
    next();
  });
}, updateAvatar);

export default router;