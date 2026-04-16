const router = require('express').Router();
const ctrl = require('../controllers/equipmentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/',         ctrl.getAll);
router.patch('/:id',    ctrl.toggle);

module.exports = router;