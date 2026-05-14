// routes/esp32Routes.js
const express     = require('express');
const router      = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const mqttService = require('../services/mqttService');

const {
  register,
  poll,
  getAvailable,
  getAll,
  assign,
  unassign,
} = require('../controllers/esp32Controller');

// ─────────────────────────────────────────
// Routes PUBLIQUES — appelées par l'ESP32
// ─────────────────────────────────────────
router.post('/register',   register);
router.get('/poll/:mac',   poll);

// ─────────────────────────────────────────
// Routes PROTÉGÉES — appelées par l'app
// ─────────────────────────────────────────
router.use(protect);

router.get('/available',       getAvailable);
router.get('/all',             getAll);
router.post('/assign',         assign);
router.post('/unassign/:mac',  unassign);

// ─────────────────────────────────────────
// POST /api/esp32/command/:mac
// Envoyer une commande à un ESP32 via MQTT
// Body: { action, target, value }
//
// Exemples :
//   { action: "SET_RELAY", target: "fan",    value: true  }
//   { action: "SET_RELAY", target: "heater", value: false }
//   { action: "SET_RELAY", target: "light",  value: true  }
//   { action: "SET_MODE",  target: "all",    value: "auto"}
//   { action: "RESET" }
// ─────────────────────────────────────────
router.post('/command/:mac', async (req, res) => {
  const { mac }    = req.params;
  const { action, target, value } = req.body;

  if (!action) {
    return res.status(400).json({ success: false, message: 'action est requis.' });
  }

  const sent = mqttService.publishCommand(mac, { action, target, value });

  if (sent) {
    res.status(200).json({
      success: true,
      message: `Commande "${action}" envoyée à l'ESP32 ${mac}`,
      command: { action, target, value },
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Broker MQTT non connecté — commande non envoyée.',
    });
  }
});

module.exports = router;