// models/Alert.js
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'USER_CREATED',
        'USER_DELETED',
        'INVITE_EXPIRED',
        'COOP_CREATED',
        'COOP_UPDATED',
        'COOP_DELETED',
        'USER_ASSIGNED',
        'USER_UNASSIGNED',
        'ESP32_OFFLINE',
        'COOP_NO_OWNER',
        
        // Alertes Éleveurs
        'TEMPERATURE_HIGH',
        'TEMPERATURE_LOW',
        'FAN_MANUAL_ACTIVATED',
        'FAN_MANUAL_DEACTIVATED',
        'RESERVOIR_LOW',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'info',
    },
    category: {
      type: String,
      enum: [
        'security',
        'health',
        'environment',
        'system',
        'temperature',
        'fan',
        'reservoir',
        'account',        // pour les demandes de compte
      ],
      default: 'system',
    },
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, default: 'Système' },

    coop: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Coop' 
    },

    isRead:      { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    
    targetRole:  { 
      type: String, 
      enum: ['admin', 'eleveur', 'all'], 
      default: 'eleveur'        // ← Changé en 'eleveur' par défaut (plus logique maintenant)
    },
    
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);