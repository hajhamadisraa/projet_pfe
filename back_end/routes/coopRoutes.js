const express = require('express');
const router  = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/coopController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

module.exports = router;