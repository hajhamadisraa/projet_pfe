// models/Esp32Device.js
// ═══════════════════════════════════════════════════════════════
//  Représente un ESP32 physique enregistré dans le système
// ═══════════════════════════════════════════════════════════════
const mongoose = require('mongoose');

const Esp32DeviceSchema = new mongoose.Schema(
  {
    // Identifiant unique gravé en usine — ne change jamais
    mac: {
      type:     String,
      required: true,
      unique:   true,
      uppercase: true,
      trim:     true,
    },

    // Nom donné par l'utilisateur (optionnel)
    label: {
      type:    String,
      default: '',
      trim:    true,
    },

    // Statut de l'appareil
    status: {
      type:    String,
      enum:    ['available', 'assigned', 'offline'],
      default: 'available',
    },

    // Poulailler auquel il est assigné (null = disponible)
    assignedCoop: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Coop',
      default: null,
    },

    // Token envoyé à l'ESP32 après assignation
    token: {
      type:    String,
      default: null,
    },

    // true = l'ESP32 a récupéré son token et est opérationnel
    tokenAcknowledged: {
      type:    Boolean,
      default: false,
    },

    // Infos réseau
    ipAddress:  { type: String, default: null },
    firmwareVersion: { type: String, default: null },
    lastSeenAt: { type: Date, default: null },
    isOnline:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Esp32Device', Esp32DeviceSchema);