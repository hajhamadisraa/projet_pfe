const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },

    // ← AJOUT
    type: {
      type: String,
      enum: ['fan', 'heater', 'waterPump', 'light', 'padCooling'],
      required: [true, 'Le type est obligatoire'],
    },

    icon: { type: String, default: 'settings' },
    mode: {
      type: String,
      enum: ['AUTO', 'MANUEL', 'ALERTE'],
      default: 'AUTO',
    },
    isOn:          { type: Boolean, default: false },
    coop:          { type: mongoose.Schema.Types.ObjectId, ref: 'Coop', required: true },
    lastToggledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', EquipmentSchema);