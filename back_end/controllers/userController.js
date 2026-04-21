const User = require('../models/User');

// GET /api/users — liste tous les utilisateurs (admin)
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id — détail d'un utilisateur
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users — créer un utilisateur (admin peut choisir le rôle)
exports.create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id — modifier le rôle ou statut
exports.update = async (req, res) => {
  try {
    const allowedFields = {
      name:         req.body.name,
      role:         req.body.role,
      isActive:     req.body.isActive,
      cooperatives: req.body.cooperatives,
    };
    // Supprimer les champs undefined
    Object.keys(allowedFields).forEach(
      k => allowedFields[k] === undefined && delete allowedFields[k]
    );

    const user = await User.findByIdAndUpdate(req.params.id, allowedFields, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id — supprimer un utilisateur
exports.remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      });
    }
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Utilisateur supprime.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};