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

    isActive: { type: Boolean, default: true },

    // ✅ AJOUT CORRECT ICI
    esp32Token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(20).toString('hex'),
    },

    isOnline:  { type: Boolean, default: false },
    lastSeenAt:{ type: Date },
    image:     { type: String, default: null },

    equipements: [
      {
        key:   String,
        label: String,
        icon:  String,
        qte:   { type: Number, default: 1 },
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coop', CoopSchema);