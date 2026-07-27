export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  req.body = value;
  next();
};