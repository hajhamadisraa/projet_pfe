const mongoose = require('mongoose');
const crypto = require('crypto');

const SensorSchema = new mongoose.Schema({
  value: { type: Number, default: 0 },
  min:   { type: Number, default: 0 },
  max:   { type: Number, default: 0 },
  trend: { type: String, enum: ['up', 'down', 'flat'], default: 'flat' },
  alert: { type: Boolean, default: false },
}, { _id: false });

const CoopSchema = new mongoose.Schema(
  {
    name:   { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
    sector: { type: String, required: true },

    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical'],
      default: 'healthy',
    },

    population: { type: Number, default: 0 },
    mortality:  { type: Number, default: 0 },

    sensors: {
      temperature: { type: SensorSchema, default: () => ({}) },
      humidity:    { type: SensorSchema, default: () => ({}) },
      luminosity:  { type: SensorSchema, default: () => ({}) },
      ventilation: { type: SensorSchema, default: () => ({}) },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],

    isActive: { type: Boolean, default: true },

    esp32Token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(20).toString('hex'),
    },

    isOnline:   { type: Boolean, default: false },
    lastSeenAt: { type: Date },
    espMac: { type: String, default: null },
    image:      { type: String, default: null },

    equipements: [
      {
        key:   String,
        label: String,
        icon:  String,
        qte:   { type: Number, default: 1 },
      }
    ],

    // ✅ AJOUT — état/mode des actionneurs piloté en AUTO (ex: éclairage via IA)
    actuators: {
      light: {
        on:   { type: Boolean, default: false },
        mode: { type: String, default: 'auto' },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coop', CoopSchema);