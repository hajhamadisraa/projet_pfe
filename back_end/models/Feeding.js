const mongoose = require('mongoose');

const PlanningSchema = new mongoose.Schema({
  time:  { type: String, required: true },
  meal:  { type: String, required: true },
  qty:   { type: Number, required: true },
  unit:  { type: String, default: 'kg' },
  done:  { type: Boolean, default: false },
  doneAt: { type: Date },
}, { _id: false });

const TankSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  level:   { type: Number, min: 0, max: 100, default: 100 },
  alertAt: { type: Number, default: 20 },
  alert:   { type: Boolean, default: false },
}, { _id: false });

const FeedingSchema = new mongoose.Schema(
  {
    coop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coop',
      required: true,
    },
    plannings:   [PlanningSchema],
    tanks:       [TankSchema],
    distributed: { type: Number, default: 0 },
    consumed:    { type: Number, default: 0 },
    remaining:   { type: Number, default: 0 },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feeding', FeedingSchema);