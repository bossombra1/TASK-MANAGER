export const requireSuperAdmin = (req, res, next) => {
  // Suppose que le middleware d'authentification JWT (verifyToken) a déjà tourné avant celui-ci
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Accès réservé au super administrateur' });
  }
  next();
};