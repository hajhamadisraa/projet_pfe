const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/',        ctrl.getAll);
router.post('/',       ctrl.create);
router.delete('/:id',  ctrl.dismiss);

module.exports = router;