// controllers/alertController.js
const Alert = require('../models/Alert');

// GET /api/alerts — toutes les alertes (filtrables)
exports.getAll = async (req, res) => {
  try {
    const query = { 
      isDismissed: false,
      targetRole: { $in: [req.user.role, 'all'] }
    };

    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    const alerts = await Alert.find(query)
      .populate('coop', 'name sector')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ 
      success: true, 
      count: alerts.length, 
      data: alerts 
    });
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

// Autres méthodes (getById, dismiss, etc.) restent les mêmes
exports.getById = async (req, res) => { /* ... */ };
exports.dismiss = async (req, res) => { /* ... */ };