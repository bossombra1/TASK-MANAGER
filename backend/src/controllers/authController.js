// Permet de créer et vérifier des "tokens" (jetons de sécurité) pour maintenir la connexion de l'utilisateur.
import jwt from 'jsonwebtoken';
// Permet de comparer le mot de passe tapé avec celui haché dans la base de données.
import bcrypt from 'bcrypt';
// Modules natifs de Node.js pour manipuler les chemins de fichiers et le système de fichiers (disque dur).
import path from 'path';
import fs from 'fs';
// Ton fichier de connexion à la base de données.
import db from '../config/db.js';
// Le dossier de destination de tes uploads (probablement défini ailleurs).
import { uploadDir } from '../config/upload.js';

// --- INSCRIPTION (REGISTER) ---

export const register = async (req, res) => {
  const { organizationName, nom, email, password } = req.body;

  if (!organizationName || !nom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const slug = organizationName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const orgRes = await client.query(
      `INSERT INTO organizations (name, slug, plan, status)
       VALUES ($1, $2, 'free', 'active') RETURNING id`,
      [organizationName.trim(), slug]
    );
    const organizationId = orgRes.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = await client.query(
      `INSERT INTO users (nom, email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING id, nom, email, role, created_at`,
      [nom, email, passwordHash, organizationId]
    );
    const user = userRes.rows[0];

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Organisation et compte administrateur créés avec succès',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar_url: null,
        organizationName: organizationName.trim(),
        organizationSlug: slug
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: error.message });
  } finally {
    client.release();
  }
};




// --- CONNEXION (LOGIN) ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT
         users.id,
         users.nom,
         users.email,
         users.password_hash,
         users.role,
         users.avatar_url,
         users.organization_id,
         users.is_active,
         organizations.name AS organization_name,
         organizations.slug AS organization_slug,
         organizations.status AS organization_status
       FROM users
       LEFT JOIN organizations ON users.organization_id = organizations.id
       WHERE users.email = $1`,
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    // Bloque tous les utilisateurs d'une entreprise suspendue (sauf le super admin, qui n'a pas d'organization_id)
    if (user.organization_id && user.organization_status === 'suspended') {
      return res.status(403).json({ message: 'Votre entreprise a été suspendue. Contactez le support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        organizationName: user.organization_name,
        organizationSlug: user.organization_slug,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

// --- MISE À JOUR DU PROFIL ---
export const getMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT
         users.id,
         users.nom,
         users.email,
         users.role,
         users.avatar_url,
         organizations.name AS organization_name,
         organizations.slug AS organization_slug
       FROM users
       LEFT JOIN organizations ON users.organization_id = organizations.id
       WHERE users.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        organizationName: user.organization_name,
        organizationSlug: user.organization_slug
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { nom, email } = req.body;
  // ATTENTION : req.user.id vient forcément d'un middleware placé avant ce contrôleur !
  // Ce middleware a décodé le token JWT et a attaché l'utilisateur à la requête.
  const userId = req.user.id; 

  try {
    // Si l'utilisateur essaie de changer son email...
    if (email) {
      // On vérifie que le NOUVEL email n'est pas déjà pris par QUELQU'UN D'AUTRE (id != userId).
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    // Mise à jour classique avec COALESCE (garde l'ancienne valeur si la nouvelle est null).
    const result = await db.query(
      `UPDATE users SET
        nom = COALESCE($1, nom),
        email = COALESCE($2, email)
       WHERE id = $3 AND organization_id = $4
       RETURNING id, nom, email, role, avatar_url, created_at`,
      [nom, email, userId, req.user.organizationId]
    );

    res.json({ message: 'Profil mis à jour', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour profil', error: error.message });
  }
};





// --- CHANGEMENT DE MOT DE PASSE ---
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Vient du middleware

  // Validation de base : le nouveau mot de passe doit faire au moins 8 caractères.
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    // 1. Récupère l'ancien mot de passe crypté de l'utilisateur.
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1 AND organization_id = $2', [userId, req.user.organizationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // 2. SÉCURITÉ : Vérifie que l'utilisateur connait bien son mot de passe actuel avant de le changer.
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // 3. Hache le nouveau mot de passe.
    const newHash = await bcrypt.hash(newPassword, 10);
    // 4. Met à jour la base de données.
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2 AND organization_id = $3', [newHash, userId, req.user.organizationId]);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur changement de mot de passe', error: error.message });
  }
};

// --- MISE À JOUR DE LA PHOTO DE PROFIL ---
export const updateAvatar = async (req, res) => {
  // req.file est rempli par un middleware de gestion de fichiers (comme Multer).
  // S'il est vide, c'est que l'utilisateur n'a pas envoyé d'image.
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }

  const userId = req.user.id; // Vient du middleware d'authentification
  // Construit le chemin public de la nouvelle image pour l'enregistrer en BDD.
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    // 1. Récupère l'ancienne photo de profil avant de la remplacer.
    const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1 AND organization_id = $2', [userId, req.user.organizationId]);
    const oldAvatar = rows[0]?.avatar_url;

    // 2. Met à jour la BDD avec la nouvelle image.
    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2 AND organization_id = $3', [avatarUrl, userId, req.user.organizationId]);

    // 3. Nettoyage du serveur : supprime l'ancienne image du disque dur pour libérer de l'espace.
    if (oldAvatar) {
      // Extrait juste le nom du fichier depuis l'URL (ex: "photo.png").
      const oldFilename = oldAvatar.split('/').pop();
      // Supprime physiquement le fichier. 
      // Le callback vide "() => {}" permet de ne pas bloquer l'exécution ni faire planter l'application 
      // si le fichier a déjà été supprimé ou est introuvable (fire-and-forget).
      fs.unlink(path.join(uploadDir, oldFilename), () => {}); 
    }

    res.json({ message: 'Photo de profil mise à jour', avatar_url: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour avatar', error: error.message });
  }
};