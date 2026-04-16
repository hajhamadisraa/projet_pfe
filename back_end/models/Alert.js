const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  severity:    { type: String, enum: ['critical','warning','info'], default: 'info' },
  category:    { type: String, enum: ['security','health','environment','system'] },
  location:    { type: String },
  coop:        { type: mongoose.Schema.Types.ObjectId, ref: 'Coop' },
  dismissed:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);