// controllers/userController.js
const crypto      = require('crypto');
const User        = require('../models/User');
const sendEmail   = require('../utils/sendEmail');
const createAlert = require('../utils/createAlert');

// ─────────────────────────────────────────
// GET /api/users
// Retourne tous les utilisateurs (tous statuts)
// Query: ?status=PENDING pour filtrer
// ─────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const users = await User.find(filter)
      .select('-password')
      .populate('cooperatives', 'name sector');

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
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('cooperatives', 'name sector');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/users — Créer + envoyer invitation (ancien flux admin)
// Utilisé quand l'admin crée directement un compte
// ─────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, email, role, cooperatives, isActive } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà.',
      });
    }

    const inviteToken       = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      role:               role || 'eleveur',
      cooperatives:       cooperatives || [],
      status:             'ACTIVE',   // créé par admin = actif directement
      isActive:           true,
      inviteToken,
      inviteTokenExpiry,
      createdBy:          req.user?.id,
    });

    const activationLink = `${process.env.BACKEND_URL}/api/auth/activate?token=${inviteToken}`;

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

    await createAlert('USER_CREATED', { name: user.name, email: user.email, role: user.role });

    res.status(201).json({
      success:   true,
      emailSent: true,
      data: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        status:   user.status,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error('[users/create]', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PATCH /api/users/:id/approve
// Nouveau flux : l'admin approuve un compte PENDING
// Body: { cooperatives: ['coopId1', 'coopId2'] }
// ─────────────────────────────────────────
exports.approve = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Ce compte n'est pas en attente (statut actuel : ${user.status}).`,
      });
    }

    // Assigner les coops si fournies
    const cooperatives = req.body.cooperatives || [];

    user.status       = 'ACTIVE';
    user.isActive     = true;
    user.cooperatives = cooperatives;
    user.approvedBy   = req.user.id;
    user.approvedAt   = new Date();
    await user.save();

    // Envoyer un email de confirmation à l'éleveur
    try {
      await sendEmail({
        to:      user.email,
        subject: '✅ PoulIA — Votre compte a été approuvé',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
            <h2 style="color: #1B4332;">Bonjour ${user.name},</h2>
            <p>Bonne nouvelle ! Votre compte <strong>PoulIA</strong> a été validé par un administrateur.</p>
            <p>Vous pouvez maintenant vous connecter avec votre email et mot de passe.</p>
            <a href="${process.env.APP_URL}"
               style="display:inline-block; margin: 20px 0; padding: 14px 28px;
                      background:#012D1D; color:#fff; border-radius:8px;
                      text-decoration:none; font-weight:bold;">
              Se connecter à PoulIA
            </a>
            <p style="color:#6B7A6E; font-size:13px;">
              Si vous avez des questions, contactez votre administrateur.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn('[approve] Email non envoyé:', emailErr.message);
    }

    // Alerte confirmation approbation
    try {
      await createAlert('ACCOUNT_APPROVED', {
        userId:    user._id.toString(),
        userName:  user.name,
        userEmail: user.email,
        approvedBy: req.user.id,
      });
    } catch (alertErr) {
      console.warn('[approve] Alerte non créée:', alertErr.message);
    }

    const updated = await User.findById(user._id)
      .select('-password')
      .populate('cooperatives', 'name sector');

    res.status(200).json({
      success: true,
      message: `Le compte de ${user.name} a été approuvé.`,
      data:    updated,
    });
  } catch (err) {
    console.error('[users/approve]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// PATCH /api/users/:id/reject
// L'admin rejette une demande PENDING
// ─────────────────────────────────────────
exports.reject = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Ce compte n'est pas en attente.`,
      });
    }

    const reason = req.body.reason || 'Demande non acceptée par l\'administrateur.';

    // Envoyer un email de refus
    try {
      await sendEmail({
        to:      user.email,
        subject: 'PoulIA — Demande de compte refusée',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
            <h2 style="color: #B3261E;">Bonjour ${user.name},</h2>
            <p>Votre demande de compte sur <strong>PoulIA</strong> n'a pas pu être acceptée.</p>
            <p><strong>Raison :</strong> ${reason}</p>
            <p style="color:#6B7A6E; font-size:13px;">
              Pour plus d'informations, contactez votre administrateur.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn('[reject] Email non envoyé:', emailErr.message);
    }

    // Supprimer le compte PENDING
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `La demande de ${user.name} a été refusée et supprimée.`,
    });
  } catch (err) {
    console.error('[users/reject]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/verify-invite?token=xxx
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

    user.password          = password;
    user.status            = 'ACTIVE';
    user.isActive          = true;
    user.inviteToken       = undefined;
    user.inviteTokenExpiry = undefined;
    await user.save();

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
    if (req.body.isActive     !== undefined) {
      allowed.isActive = req.body.isActive;
      allowed.status   = req.body.isActive ? 'ACTIVE' : 'SUSPENDED';
    }
    if (req.body.cooperatives !== undefined) allowed.cooperatives = req.body.cooperatives;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowed,
      { returnDocument: 'after', runValidators: true }
    )
      .select('-password')
      .populate('cooperatives', 'name sector');

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

    if (user.status === 'PENDING') {
      return res.status(400).json({ success: false, message: 'Ce compte est en attente de validation, utilisez /approve.' });
    }

    user.status   = user.isActive ? 'SUSPENDED' : 'ACTIVE';
    user.isActive = !user.isActive;
    await user.save();

    const updated = await User.findById(user._id)
      .select('-password')
      .populate('cooperatives', 'name sector');

    res.status(200).json({ success: true, data: updated });
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

    await createAlert('USER_DELETED', { name: user.name, email: user.email, role: user.role });
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};