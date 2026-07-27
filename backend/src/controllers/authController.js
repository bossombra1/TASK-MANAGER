import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import db from '../config/db.js';
import { uploadDir } from '../config/upload.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role, avatar_url: user.avatar_url }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { nom, email } = req.body;
  const userId = req.user.id;

  try {
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    const result = await db.query(
      `UPDATE users SET
        nom = COALESCE($1, nom),
        email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, nom, email, role, avatar_url, created_at`,
      [nom, email, userId]
    );

    res.json({ message: 'Profil mis à jour', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour profil', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur changement de mot de passe', error: error.message });
  }
};

// Mise à jour de la photo de profil
export const updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }

  const userId = req.user.id;
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    const oldAvatar = rows[0]?.avatar_url;

    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);

    if (oldAvatar) {
      const oldFilename = oldAvatar.split('/').pop();
      fs.unlink(path.join(uploadDir, oldFilename), () => {}); // best-effort, sans bloquer la réponse
    }

    res.json({ message: 'Photo de profil mise à jour', avatar_url: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour avatar', error: error.message });
  }
};