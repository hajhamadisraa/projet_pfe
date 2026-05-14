const mongoose = require('mongoose');

const chickenCountSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    chicken_count: { type: Number, required: true },
    abnormal_count: { type: Number, default: 0 },
    predator_alert: { type: Boolean, default: false },
    predators: [{ class: String, confidence: Number }],
    brightness: { type: Number, default: null },
    light_command: { type: String, default: null },
    camera_id: { type: String, default: "cam_01" }
});

module.exports = mongoose.model('ChickenCount', chickenCountSchema);