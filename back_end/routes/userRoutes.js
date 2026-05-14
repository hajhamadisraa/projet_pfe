const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ── Routes publiques ───────────────────────────────────────
router.get('/auth/verify-invite',  ctrl.verifyInvite);
router.post('/auth/set-password',  ctrl.setPassword);

// ── Routes protégées admin ─────────────────────────────────
router.use(protect);
router.use(authorize('admin'));

router.get('/',             ctrl.getAll);
router.get('/:id',          ctrl.getById);
router.post('/',            ctrl.create);
router.put('/:id',          ctrl.update);
router.patch('/:id/toggle', ctrl.toggleStatus);
router.delete('/:id',       ctrl.remove);

module.exports = router;