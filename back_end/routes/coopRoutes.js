const express = require('express');
const router  = express.Router();

const {
  getAll,
  getMy,         // ✅ éleveur : ses poulaillers assignés
  getById,
  create,
  update,
  remove,
  receiveSensorData,
  assignUser,
  unassignUser,
} = require('../controllers/coopController');

const { protect } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────
// Route publique — ESP32 (pas de JWT)
// ─────────────────────────────────────────
router.post('/sensors', receiveSensorData);

// ─────────────────────────────────────────
// Toutes les routes suivantes sont protégées
// ─────────────────────────────────────────
router.use(protect);

// ✅ IMPORTANT : /my doit être déclaré AVANT /:id
// sinon Express interprète "my" comme un ObjectId et plante
router.get('/my', getMy);

// CRUD principal
router.route('/')
  .get(getAll)
  .post(create);

// Affecter / retirer un éleveur
router.post('/:id/assign',           assignUser);
router.delete('/:id/assign/:userId', unassignUser);

// Opérations sur un poulailler précis
router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

module.exports = router;