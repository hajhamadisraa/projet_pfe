const mongoose = require('mongoose');

const FeedingSchema = new mongoose.Schema({
  coop: { type: mongoose.Schema.Types.ObjectId, ref: 'Coop', required: true },
  plannings: [{
    time:   String,
    meal:   String,
    qty:    Number,
    done:   { type: Boolean, default: false },
  }],
  tanks: [{
    name:  String,
    level: Number,
    alert: { type: Boolean, default: false },
  }],
  distributed: Number,
  consumed:    Number,
}, { timestamps: true });

module.exports = mongoose.model('Feeding', FeedingSchema);