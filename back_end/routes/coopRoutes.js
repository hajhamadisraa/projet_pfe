const express = require('express');
const router  = express.Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  receiveSensorData
} = require('../controllers/coopController');

const { protect } = require('../middlewares/authMiddleware');

// ✅ Route publique (ESP32 → sans JWT)
router.post('/sensors', receiveSensorData);

// ✅ Toutes les routes après sont protégées
router.use(protect);

// CRUD
router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

module.exports = router;