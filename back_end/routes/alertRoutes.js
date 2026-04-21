const express = require('express');
const router  = express.Router();
const { getAll, getById, create, dismiss } = require('../controllers/alertController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .delete(dismiss);

module.exports = router;