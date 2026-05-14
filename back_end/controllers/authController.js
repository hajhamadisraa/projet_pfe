// controllers/authController.js
const User        = require('../models/User');
const createAlert = require('../utils/createAlert');

// ─────────────────────────────────────────
// Helper : réponse avec token JWT
// ─────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    status:  user.status || 'ACTIVE',
    token,
    user: {
      id:            user._id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      status:        user.status || 'ACTIVE',
      roleBadgeType: user.role === 'admin' ? 'ADMIN' : 'OPERATOR',
      cooperatives:  user.cooperatives,
      isActive:      user.isActive,
      avatar:        user.avatar || null,
    },
  });
};

// ─────────────────────────────────────────
// Helper : résoudre le statut effectif
// Compatibilité ascendante — les anciens comptes n'ont pas
// le champ "status", on le déduit de isActive
// ─────────────────────────────────────────
const resolveStatus = (user) => {
  // Si le champ status existe et est défini → l'utiliser
  if (user.status && user.status !== undefined) {
    return user.status;
  }
  // Ancien compte sans status → déduire depuis isActive
  return user.isActive ? 'ACTIVE' : 'SUSPENDED';
};

// ─────────────────────────────────────────
// POST /api/auth/register
// Nouveau flux : l'éleveur s'inscrit lui-même → compte PENDING
// L'admin reçoit une alerte et valide depuis UserManagement
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà.',
      });
    }

    // Créer le compte PENDING (jamais admin depuis l'inscription publique)
    const user = await User.create({
      name,
      email,
      password,
      role:     'eleveur',
      status:   'PENDING',
      isActive: false,
    });

    // Notifier tous les admins via une alerte système
    try {
      await createAlert('ACCOUNT_REQUEST', {
        userId:    user._id.toString(),
        userName:  user.name,
        userEmail: user.email,
      });
    } catch (alertErr) {
      // Non bloquant — l'inscription réussit même si l'alerte échoue
      console.warn('[register] Impossible de créer l\'alerte admin:', alertErr.message);
    }

    // Retourner le statut PENDING sans token (pas encore connecté)
    res.status(201).json({
      success: true,
      status:  'PENDING',
      message: 'Votre demande a été soumise. Un administrateur va valider votre compte.',
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('[authController/register]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ✅ Compatible avec les anciens comptes sans champ "status"
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    // ── Résoudre le statut effectif ───────────────────────
    // ✅ Gère les anciens comptes sans champ "status"
    const accountStatus = resolveStatus(user);

    if (accountStatus === 'PENDING') {
      return res.status(403).json({
        success: false,
        status:  'PENDING',
        message: 'Votre compte est en attente de validation par un administrateur.',
      });
    }

    if (accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        status:  'SUSPENDED',
        message: 'Votre compte a été suspendu. Contactez un administrateur.',
      });
    }

    // Vérification finale isActive (sécurité supplémentaire)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif. Contactez un administrateur.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('[authController/login]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PUT /api/auth/updateprofile
// Body: { name, email, avatar }
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name:  req.body.name,
      email: req.body.email,
    };

    if (req.body.avatar !== undefined) {
      fieldsToUpdate.avatar = req.body.avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PUT /api/auth/updatepassword
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect.',
      });
    }
    user.password = req.body.newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};