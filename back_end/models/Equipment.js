const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    icon: { type: String, default: 'settings' },
    mode: {
      type: String,
      enum: ['AUTO', 'MANUEL', 'ALERTE'],
      default: 'AUTO',
    },
    isOn: { type: Boolean, default: false },
    coop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coop',
      required: true,
    },
    lastToggledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', EquipmentSchema);