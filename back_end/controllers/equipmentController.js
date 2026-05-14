const Equipment = require('../models/Equipment');

// GET /api/equipment?coopId=xxx — équipements d'une coop
exports.getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.coopId) query.coop = req.query.coopId;

    const equipment = await Equipment.find(query).populate('coop', 'name sector');
    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/equipment/:id — détail d'un équipement
exports.getById = async (req, res) => {
  try {
    const equip = await Equipment.findById(req.params.id);
    if (!equip) {
      return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    }
    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/equipment — créer un équipement
exports.create = async (req, res) => {
  try {
    const equip = await Equipment.create(req.body);
    res.status(201).json({ success: true, data: equip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/equipment/:id/toggle — allumer ou éteindre
exports.toggle = async (req, res) => {
  try {
    const equip = await Equipment.findById(req.params.id);
    if (!equip) {
      return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    }
    if (equip.mode === 'ALERTE') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de toggler un equipement en mode ALERTE.',
      });
    }
    equip.isOn          = !equip.isOn;
    equip.lastToggledAt = new Date();
    await equip.save();
    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/equipment/:id — modifier un équipement
exports.update = async (req, res) => {
  try {
    const equip = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!equip) {
      return res.status(404).json({ success: false, message: 'Equipement introuvable.' });
    }
    res.status(200).json({ success: true, data: equip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};