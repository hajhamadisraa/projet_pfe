const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['admin', 'eleveur'], default: 'eleveur' },
  cooperatives: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hacher le mot de passe avant sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);