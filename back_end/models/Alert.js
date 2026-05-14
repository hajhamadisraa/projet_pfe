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
        'COOP_UPDATED',      // ✅ NOUVEAU
        'COOP_DELETED',
        'USER_ASSIGNED',     // ✅ NOUVEAU
        'USER_UNASSIGNED',   // ✅ NOUVEAU
        'ESP32_OFFLINE',
        'COOP_NO_OWNER',
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
      enum: ['security', 'health', 'environment', 'system'],
      default: 'system',
    },
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, default: 'Système' },
    isRead:      { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    targetRole:  { type: String, enum: ['admin', 'eleveur', 'all'], default: 'admin' },
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);