// controllers/userController.js
const crypto     = require('crypto');
const User       = require('../models/User');
const sendEmail  = require('../utils/sendEmail'); // ← voir utils/sendEmail.js

// ─────────────────────────────────────────
// GET /api/users
// ─────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/users — Créer + envoyer invitation
// ─────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, email, role, cooperatives, isActive } = req.body;

    // 1. Vérifier si l'email existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà.',
      });
    }

    // 2. Générer un token d'invitation sécurisé
    const inviteToken       = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    // 3. Créer l'utilisateur SANS mot de passe (inactif jusqu'à activation)
    const user = await User.create({
      name,
      email,
      role:               role || 'eleveur',
      cooperatives:       cooperatives || [],
      isActive:           false,          // sera true après set-password
      inviteToken,
      inviteTokenExpiry,
      createdBy:          req.user?.id,
    });

    // 4. Construire le lien d'activation
    // En production : remplacer par votre vrai domaine / deep link
    const activationLink = `${process.env.BACKEND_URL}/api/auth/activate?token=${inviteToken}`;


    // 5. Envoyer l'email d'invitation
    await sendEmail({
      to:      email,
      subject: '🐔 Bienvenue sur PoulIA — Activez votre compte',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
          <h2 style="color: #1B4332;">Bonjour ${name},</h2>
          <p>Votre compte éleveur a été créé sur <strong>PoulIA</strong>.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir votre mot de passe :</p>
          <a href="${activationLink}"
             style="display:inline-block; margin: 20px 0; padding: 14px 28px;
                    background:#FF6B35; color:#fff; border-radius:8px;
                    text-decoration:none; font-weight:bold;">
            Activer mon compte
          </a>
          <p style="color:#6B7A6E; font-size:13px;">
            Ce lien expire dans <strong>48 heures</strong>.<br>
            Si vous n'attendiez pas ce message, ignorez-le.
          </p>
        </div>
      `,
    });

    // 6. Réponse — pas de tempPassword, l'email a été envoyé
    res.status(201).json({
      success:       true,
      emailSent:     true,
      data: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error('[users/create]', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/verify-invite?token=xxx
// Vérifie que le token est valide avant d'afficher le formulaire
// ─────────────────────────────────────────
exports.verifyInvite = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      inviteToken:       token,
      inviteTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Lien invalide ou expiré.' });
    }

    res.json({ success: true, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/set-password
// L'éleveur choisit son mot de passe via le lien reçu
// ─────────────────────────────────────────
exports.setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mot de passe trop court (min. 6 caractères).' });
    }

    const user = await User.findOne({
      inviteToken:       token,
      inviteTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Lien invalide ou expiré.' });
    }

    // Activer le compte
    user.password          = password;   // hashé par le pre-save hook
    user.isActive          = true;
    user.inviteToken       = undefined;
    user.inviteTokenExpiry = undefined;
    await user.save();

    // Retourner un JWT pour connecter directement
    const jwtToken = user.getSignedToken();

    res.json({
      success: true,
      token:   jwtToken,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PUT /api/users/:id
// ─────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const allowed = {};
    if (req.body.name         !== undefined) allowed.name         = req.body.name;
    if (req.body.role         !== undefined) allowed.role         = req.body.role;
    if (req.body.isActive     !== undefined) allowed.isActive     = req.body.isActive;
    if (req.body.cooperatives !== undefined) allowed.cooperatives = req.body.cooperatives;

    const user = await User.findByIdAndUpdate(req.params.id, allowed, {
      new: true, runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PATCH /api/users/:id/toggle
// ─────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas suspendre votre propre compte.' });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// DELETE /api/users/:id
// ─────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};