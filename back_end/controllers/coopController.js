const Coop = require('../models/Coop');

// GET /api/coops — liste des coops de l'utilisateur
exports.getAll = async (req, res) => {
  try {
    const coops = await Coop.find({ owner: req.user.id });
    res.status(200).json({ success: true, count: coops.length, data: coops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/coops/:id — détail d'une coop
exports.getById = async (req, res) => {
  try {
    const coop = await Coop.findById(req.params.id).populate('owner', 'name email');
    if (!coop) {
      return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    }
    if (coop.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }
    res.status(200).json({ success: true, data: coop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/coops — créer une coop
// Remplace la fonction create existante
exports.create = async (req, res) => {
  try {
    req.body.owner = req.user.id;
    const coop = await Coop.create(req.body);

    // Retourne le esp32Token uniquement à la création
    res.status(201).json({
      success: true,
      data: coop,
      esp32Token: coop.esp32Token, // ← affiché dans l'app pour le flasher
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Ajouter cette nouvelle route — reçoit les données de l'ESP32
exports.receiveSensorData = async (req, res) => {
  try {
    const { esp32Token, temperature, humidity, luminosity, ventilation } = req.body;

    const coop = await Coop.findOne({ esp32Token });
    if (!coop) {
      return res.status(404).json({ success: false, message: 'Token ESP32 invalide.' });
    }

    // Mise à jour des capteurs
    coop.sensors.temperature.value = temperature ?? coop.sensors.temperature.value;
    coop.sensors.humidity.value    = humidity    ?? coop.sensors.humidity.value;
    coop.sensors.luminosity.value  = luminosity  ?? coop.sensors.luminosity.value;
    coop.sensors.ventilation.value = ventilation ?? coop.sensors.ventilation.value;
    coop.isOnline  = true;
    coop.lastSeenAt = new Date();

    // Alerte auto si température > 30°C
    if (temperature > 30) {
      const Alert = require('../models/Alert');
      await Alert.create({
        title:       'Température critique',
        description: `Température de ${temperature}°C détectée.`,
        severity:    'critical',
        category:    'environment',
        location:    coop.name,
        coop:        coop._id,
      });
    }

    await coop.save();
    res.status(200).json({ success: true, message: 'Données reçues.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// PUT /api/coops/:id — modifier une coop
exports.update = async (req, res) => {
  try {
    let coop = await Coop.findById(req.params.id);
    if (!coop) {
      return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    }
    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }
    coop = await Coop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: coop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/coops/:id — supprimer une coop
exports.remove = async (req, res) => {
  try {
    const coop = await Coop.findById(req.params.id);
    if (!coop) {
      return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    }
    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }
    await coop.deleteOne();
    res.status(200).json({ success: true, message: 'Poulailler supprime.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};