import jwt from 'jsonwebtoken';
// Importe la librairie jsonwebtoken pour signer/vérifier des tokens JWT

export const authenticate = (req, res, next) => {
  // Middleware Express : vérifie qu'un token JWT valide est présent avant de laisser passer la requête
  const authHeader = req.headers.authorization;
  // Récupère l'en-tête HTTP "Authorization" de la requête (ex: "Bearer eyJhbGci...")
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Si l'en-tête est absent, ou s'il ne commence pas par le préfixe attendu "Bearer "
    return res.status(401).json({ message: 'Accès non autorisé : Token manquant' });
    // Renvoie une erreur 401 (non authentifié) et arrête l'exécution du middleware
  }

  const token = authHeader.split(' ')[1];
  // Découpe la chaîne "Bearer <token>" sur l'espace et récupère la deuxième partie : le token brut
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Vérifie la signature et l'expiration du token avec la clé secrète définie en variable d'environnement
    // Si valide, renvoie le payload décodé (ex: { id, role, ... })
    if (!decoded.organizationId) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.user = decoded;
    // Attache le payload décodé à l'objet req, pour que les middlewares/contrôleurs suivants y accèdent via req.user
    next();
    // Passe la main au middleware ou contrôleur suivant dans la chaîne
  } catch (err) {
    // Si jwt.verify échoue (signature invalide, token expiré, token malformé...)
    return res.status(401).json({ message: 'Token invalide ou expiré' });
    // Renvoie une erreur 401 et arrête l'exécution du middleware
  }
};

export const requireAdmin = (req, res, next) => {
  // Middleware Express : n'autorise le passage que si l'utilisateur a le rôle admin
  if (req.user && req.user.role === 'admin') {
    // Vérifie que req.user existe (donc que authenticate est passé avant) et que son rôle est 'admin'
    next();
    // Si c'est le cas, passe la main au middleware ou contrôleur suivant
  } else {
    // Sinon (pas d'utilisateur attaché, ou rôle différent de 'admin')
    return res.status(403).json({ message: 'Accès refusé : Droits administratifs requis' });
    // Renvoie une erreur 403 (accès interdit) et arrête l'exécution du middleware
  }
};