// routes/alertRoutes.js
const express      = require('express');
const router       = express.Router();
const Alert        = require('../models/Alert');
const { protect }  = require('../middlewares/authMiddleware');

// GET /api/alerts — alertes selon le rôle de l'utilisateur
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({
      targetRole:  { $in: [req.user.role, 'all'] },
      isDismissed: false,
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ PATCH /api/alerts/read-all — DOIT être avant /:id pour éviter le conflit de route
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Alert.updateMany(
      { targetRole: { $in: [req.user.role, 'all'] }, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isDismissed: true, isRead: true },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;