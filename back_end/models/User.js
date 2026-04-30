// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Email invalide'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      default: null, // null jusqu'à l'activation via set-password
    },
    role: {
      type: String,
      enum: ['admin', 'eleveur'],
      default: 'eleveur',
    },
    cooperatives: [String],
    isActive: {
      type: Boolean,
      default: false, // false jusqu'à activation
    },

    // ── Champs invitation ──────────────────
    inviteToken:       { type: String,  default: null, select: false },
    inviteTokenExpiry: { type: Date,    default: null, select: false },
    createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hacher le mot de passe avant save (seulement s'il est modifié et non null)
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Vérifier le mot de passe
UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Générer le JWT
UserSchema.methods.getSignedToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = mongoose.model('User', UserSchema);