const mongoose = require('mongoose');

const CoopSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  sector:     { type: String, required: true },
  status:     { type: String, enum: ['healthy','warning','critical'], default: 'healthy' },
  population: { type: Number, default: 0 },
  mortality:  { type: Number, default: 0 },
  sensors: {
    temperature:  { value: Number, min: Number, max: Number },
    humidity:     { value: Number, min: Number, max: Number },
    luminosity:   { value: Number },
    ventilation:  { value: Number },
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Coop', CoopSchema);