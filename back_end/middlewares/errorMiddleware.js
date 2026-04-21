// Middleware pour les routes introuvables
exports.notFound = (req, res, next) => {
  const error = new Error(`Route introuvable : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware global de gestion des erreurs
exports.errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message    = err.message;

  // Erreur Mongoose : ID invalide
  if (err.name === 'CastError') {
    message    = 'Ressource introuvable.';
    statusCode = 404;
  }

  // Erreur Mongoose : champ unique dupliqué
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `La valeur du champ '${field}' est deja utilisee.`;
    statusCode = 400;
  }

  // Erreur Mongoose : validation
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};