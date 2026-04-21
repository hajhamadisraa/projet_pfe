const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── Middleware 1 : l'utilisateur est-il connecté ? ───────────────────
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acces refuse. Vous devez etre connecte.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable.',
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte suspendu. Contactez un administrateur.',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expire.',
    });
  }
};

// ─── Middleware 2 : l'utilisateur a-t-il le bon rôle ? ────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le role '${req.user.role}' n'a pas acces a cette ressource.`,
      });
    }
    next();
  };
};