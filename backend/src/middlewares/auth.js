import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé : Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.organizationId && decoded.role !== 'super_admin') {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    // Vérification temps réel du statut de l'entreprise (sauf super admin)
    if (decoded.organizationId) {
      const org = await db.query('SELECT status FROM organizations WHERE id = $1', [decoded.organizationId]);
      if (org.rows[0]?.status === 'suspended') {
        return res.status(403).json({ message: 'Votre entreprise a été suspendue. Contactez le support.' });
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Accès refusé : Droits administratifs requis' });
  }
};