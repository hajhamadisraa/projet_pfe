const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
    },
    description: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['security', 'health', 'environment', 'system'],
      required: true,
    },
    location:  { type: String, default: '' },
    coop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coop',
    },
    dismissed: { type: Boolean, default: false },
    dismissedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);