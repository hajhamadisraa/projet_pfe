const router      = require('express').Router();
const ctrl        = require('../controllers/equipmentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/',             protect, ctrl.getAll);
router.get('/:id',          protect, ctrl.getById);
router.post('/',            protect, ctrl.create);
router.put('/:id',          protect, ctrl.update);
router.put('/:id/toggle',   protect, ctrl.toggle);
router.put('/:id/mode',     protect, ctrl.setMode);  // ← AJOUT

module.exports = router;