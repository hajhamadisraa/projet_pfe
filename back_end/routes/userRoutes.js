const express = require('express');
const router  = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Toutes les routes : token requis + rôle admin obligatoire
router.use(protect, authorize('admin'));

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

module.exports = router;