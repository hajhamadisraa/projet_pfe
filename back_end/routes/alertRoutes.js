// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAll,
  getById,
  create,
  dismiss,
} = require('../controllers/alertController');

// GET /api/alerts
router.get('/', protect, getAll);

// POST /api/alerts (créer une alerte)
router.post('/', protect, create);

// PATCH /api/alerts/read-all
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Alert.updateMany(
      { 
        targetRole: { $in: [req.user.role, 'all'] }, 
        isRead: false 
      },
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
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', protect, dismiss);

module.exports = router;