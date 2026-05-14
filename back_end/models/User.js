// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Le nom est obligatoire'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, "L'email est obligatoire"],
      unique:    true,
      lowercase: true,
      match:     [/\S+@\S+\.\S+/, 'Email invalide'],
    },
    password: {
      type:      String,
      minlength: 6,
      select:    false,
      default:   null,
    },
    role: {
      type:    String,
      enum:    ['admin', 'eleveur'],
      default: 'eleveur',
    },

    // ── Statut du compte ──────────────────────────────────
    // PENDING   : l'éleveur vient de s'inscrire, en attente de validation admin
    // ACTIVE    : compte validé et actif
    // SUSPENDED : compte suspendu par l'admin
    //
    // ✅ Default ACTIVE — les anciens comptes sans ce champ
    //    sont traités comme actifs (compatibilité ascendante)
    status: {
      type:    String,
      enum:    ['PENDING', 'ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },

    // isActive est synchronisé avec status — gardé pour compatibilité
    isActive: {
      type:    Boolean,
      default: true,
    },

    cooperatives: [String],

    // ✅ Avatar stocké en base64
    avatar: {
      type:    String,
      default: null,
    },

    // ── Champs invitation (ancien flux admin) ─────────────
    inviteToken:       { type: String, default: null, select: false },
    inviteTokenExpiry: { type: Date,   default: null, select: false },
    createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Champs approbation (nouveau flux auto-inscription) ─
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Synchroniser isActive avec status avant save ──────────
UserSchema.pre('save', async function () {
  // Sync isActive depuis status (seulement si status est modifié)
  if (this.isModified('status')) {
    this.isActive = this.status === 'ACTIVE';
  }

  // Hacher le mot de passe si modifié
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

UserSchema.methods.getSignedToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = mongoose.model('User', UserSchema);