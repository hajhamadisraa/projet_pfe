const express = require('express');
const router  = express.Router();
const { getAll, getById, create, toggle, update } = require('../controllers/equipmentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update);

router.put('/:id/toggle', toggle);

module.exports = router;