const router = require('express').Router();
const ctrl = require('../controllers/coopController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // toutes les routes nécessitent d'être connecté

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;