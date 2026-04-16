const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  icon:   { type: String },
  mode:   { type: String, enum: ['AUTO','MANUEL','ALERTE'], default: 'AUTO' },
  isOn:   { type: Boolean, default: false },
  coop:   { type: mongoose.Schema.Types.ObjectId, ref: 'Coop' },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);