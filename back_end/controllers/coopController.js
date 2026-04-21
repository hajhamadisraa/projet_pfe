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
exports.create = async (req, res) => {
  try {
    req.body.owner = req.user.id;
    const coop = await Coop.create(req.body);
    res.status(201).json({ success: true, data: coop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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