const Alert = require('../models/Alert');

// GET /api/alerts — toutes les alertes (filtrables)
exports.getAll = async (req, res) => {
  try {
    const query = { dismissed: false };

    // Filtre par catégorie si fourni (?category=health)
    if (req.query.category) {
      query.category = req.query.category;
    }
    // Filtre par sévérité si fourni (?severity=critical)
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    const alerts = await Alert.find(query)
      .populate('coop', 'name sector')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/alerts/:id — détail d'une alerte
exports.getById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('coop', 'name sector');
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable.' });
    }
    res.status(200).json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/alerts — créer une alerte
exports.create = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/alerts/:id — ignorer (dismiss) une alerte
exports.dismiss = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable.' });
    }
    alert.dismissed  = true;
    alert.dismissedAt = new Date();
    await alert.save();
    res.status(200).json({ success: true, message: 'Alerte ignoree.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};