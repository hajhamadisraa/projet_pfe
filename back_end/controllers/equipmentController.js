const Equipment   = require('../models/Equipment');
const Coop        = require('../models/Coop');
const { publishCommand } = require('../services/mqttService');

const TYPE_TO_TARGET = {
  fan:        'fan',
  heater:     'heater',
  waterPump:  'waterPump',
  light:      'light',
  padCooling: 'padCooling',
};

exports.getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.coopId) query.coop = req.query.coopId;
    const equipment = await Equipment.find(query).populate('coop', 'name sector espMac');
    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const equip = await Equipment.findById(req.params.id);
    if (!equip) return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const equip = await Equipment.create(req.body);
    res.status(201).json({ success: true, data: equip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/equipment/:id/toggle — ON/OFF + commande MQTT
exports.toggle = async (req, res) => {
  try {
    const equip = await Equipment.findById(req.params.id).populate('coop', 'espMac');
    if (!equip) return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    if (equip.mode === 'ALERTE') return res.status(400).json({ success: false, message: 'Impossible en mode ALERTE.' });

    equip.isOn          = !equip.isOn;
    equip.lastToggledAt = new Date();
    await equip.save();

    // Commande MQTT vers ESP32
    const target = TYPE_TO_TARGET[equip.type];
    if (target && equip.coop?.espMac) {
      publishCommand(equip.coop.espMac, {
        action: 'SET_RELAY',
        target,
        value: equip.isOn,
      });
    }

    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/equipment/:id/mode — AUTO ou MANUEL + commande MQTT
exports.setMode = async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['auto', 'manuel'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode invalide : auto | manuel' });
    }

    const equip = await Equipment.findById(req.params.id).populate('coop', 'espMac');
    if (!equip) return res.status(404).json({ success: false, message: 'Equipement introuvable.' });

    equip.mode = mode.toUpperCase();
    await equip.save();

    const target = TYPE_TO_TARGET[equip.type];
    if (target && equip.coop?.espMac) {
      publishCommand(equip.coop.espMac, {
        action: 'SET_MODE',
        target,
        value:  mode,
      });
    }

    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const equip = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equip) return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};