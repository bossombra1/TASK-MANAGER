export const validate = (schema) => (req, res, next) => {
  // Fonction factory : reçoit un schéma de validation (Joi) et renvoie un middleware Express configuré pour ce schéma
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  // Valide le corps de la requête (req.body) contre le schéma fourni
  // abortEarly: false : collecte toutes les erreurs de validation, pas seulement la première
  // stripUnknown: true : retire du résultat les champs non définis dans le schéma
  // Retourne un objet { error, value } : error = détails des erreurs (ou undefined si valide), value = données validées/nettoyées

  if (error) {
    // Si la validation a échoué (error est défini)
    const errors = error.details.map((d) => d.message);
    // Transforme le tableau des détails d'erreurs Joi en un tableau de messages lisibles
    return res.status(400).json({ message: 'Données invalides', errors });
    // Renvoie une erreur 400 (requête invalide) avec la liste des messages, et arrête l'exécution du middleware
  }

  req.body = value;
  // Remplace req.body par la version validée et nettoyée (champs inconnus retirés grâce à stripUnknown)
  next();
  // Passe la main au middleware ou contrôleur suivant dans la chaîne
};