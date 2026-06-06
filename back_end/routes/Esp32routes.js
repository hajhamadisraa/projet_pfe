// routes/esp32Routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const mqttService = require('../services/mqttService');
const Alert = require('../models/Alert');
const Coop = require('../models/Coop');

const {
  register,
  poll,
  getAvailable,
  getAll,
  assign,
  unassign,
} = require('../controllers/esp32Controller');

// ─────────────────────────────────────────
// Routes PUBLIQUES (ESP32)
// ─────────────────────────────────────────
router.post('/register', register);
router.get('/poll/:mac', poll);

// ─────────────────────────────────────────
// Routes PROTÉGÉES (App mobile)
// ─────────────────────────────────────────
router.use(protect);

router.get('/available', getAvailable);
router.get('/all', getAll);
router.post('/assign', assign);
router.post('/unassign/:mac', unassign);

// ─────────────────────────────────────────
// POST /api/esp32/command/:mac  ← MODIFIÉE
// ─────────────────────────────────────────
router.post('/command/:mac', async (req, res) => {
  const { mac } = req.params;
  const { action, target, value } = req.body;

  if (!action) {
    return res.status(400).json({ success: false, message: 'action est requis.' });
  }

  // ──────────────────────────────
  // CRÉATION D'ALERTE POUR VENTILATEUR
  // ──────────────────────────────
  if (target === 'fan') {
    try {
      const coop = await Coop.findOne({ espMac: mac.toUpperCase() });

      let alertData = null;

      if (action === 'SET_MODE' && value === 'manuel') {
        alertData = {
          type: 'FAN_MODE_MANUAL',
          category: 'fan',
          severity: 'info',
          title: 'Mode manuel activé',
          description: 'Le système de ventilation a été passé en mode manuel.',
          location: coop ? coop.name : 'Poulailler',
          targetRole: 'eleveur',
          coop: coop ? coop._id : null,
          metadata: {
            fanName: 'Ventilateur principal',
            fanState: 'manual_mode',
            mac: mac.toUpperCase(),
            changedBy: req.user?.name || req.user?.email || 'Éleveur',
          }
        };
      }
      else if (action === 'SET_RELAY') {
        const isActivated = value === true || value === 'true';

        alertData = {
          type: isActivated ? 'FAN_MANUAL_ACTIVATED' : 'FAN_MANUAL_DEACTIVATED',
          category: 'fan',
          severity: 'warning',
          title: isActivated 
            ? 'Ventilateur activé manuellement' 
            : 'Ventilateur désactivé manuellement',
          description: `Le ventilateur a été ${isActivated ? 'activé' : 'désactivé'} manuellement.`,
          location: coop ? coop.name : 'Poulailler',
          targetRole: 'eleveur',
          coop: coop ? coop._id : null,
          metadata: {
            fanName: 'Ventilateur principal',
            fanState: isActivated ? 'activated' : 'deactivated',
            mac: mac.toUpperCase(),
            changedBy: req.user?.name || req.user?.email || 'Éleveur',
          }
        };
      }

      if (alertData) {
        await Alert.create(alertData);
        console.log(`[ALERT] ✅ Alerte ventilateur créée pour ${mac}`);
      }
    } catch (err) {
      console.error('[ALERT] Erreur création alerte ventilateur:', err.message);
      // On ne bloque pas l'envoi de la commande si l'alerte échoue
    }
  }

  // ──────────────────────────────
  // Envoi de la commande via MQTT
  // ──────────────────────────────
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
      message: 'Broker MQTT non connecté.',
    });
  }
});

module.exports = router;