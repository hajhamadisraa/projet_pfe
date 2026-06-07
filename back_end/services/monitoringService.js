// services/monitoringService.js
const cron                          = require('node-cron');
const axios                         = require('axios');
const { detectChickens,
        analyzeBrightness }         = require('./aiService');
const { publishCommand, isConnected } = require('./mqttService');
const ChickenCount                  = require('../models/ChickenCount');

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const ESP_CAM_IP      = process.env.ESP_CAM_IP  || '192.168.1.53';
const ESP_CAM_MAC     = process.env.ESP_CAM_MAC || 'EC626084195C'; // MAC visible dans les logs
const ESP_CAPTURE_URL = `http://${ESP_CAM_IP}/capture`;            // snapshot JPEG de l'ESP32-CAM

let io = null;

// ─────────────────────────────────────────────────────────────
// Capturer une frame JPEG depuis l'ESP32-CAM
// ─────────────────────────────────────────────────────────────
async function captureFrame() {
  try {
    // Réveiller le capteur avec 3 captures préliminaires
    for (let i = 0; i < 3; i++) {
      await axios.get(ESP_CAPTURE_URL, {
        responseType: 'arraybuffer',
        timeout: 5000,
      }).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }
    // Capture finale — image correcte
    const response = await axios.get(ESP_CAPTURE_URL, {
      responseType: 'arraybuffer',
      timeout:      8000,
    });
    const buffer = Buffer.from(response.data);
    console.log(`[MONITOR] 📸 Frame capturée : ${buffer.length} bytes`);
    return buffer;
  } catch (err) {
    console.error(`[MONITOR] ❌ Capture ESP32-CAM échouée :`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Analyse principale — lancée toutes les 30 secondes
// ─────────────────────────────────────────────────────────────
async function runAnalysis() {
  console.log(`[MONITOR] Analyse — ${new Date().toLocaleTimeString()}`);

  // 1. Capturer une frame live depuis l'ESP32-CAM
  const imageBuffer = await captureFrame();
  if (!imageBuffer) {
    console.warn('[MONITOR] ⚠️  Analyse annulée — pas de frame disponible');
    return;
  }

  // 2. Détecter les poules via l'API IA (Raspberry Pi)
  const result = await detectChickens(imageBuffer);
  if (!result) {
    console.warn('[MONITOR] ⚠️  Détection IA échouée');
    return;
  }

  // 3. Analyser la luminosité (même frame)
  const brightness = await analyzeBrightness(imageBuffer);

  // 4. Sauvegarder en MongoDB
  try {
    const count = new ChickenCount({
      chicken_count:  result.chicken_count,
      abnormal_count: result.abnormal_count,
      predator_alert: result.predator_alert,
      predators:      result.predators      || [],
      brightness:     brightness?.brightness  || null,
      light_command:  brightness?.light_command || null,
      camera_id:      'cam_01',
    });
    await count.save();
  } catch (dbErr) {
    console.error('[MONITOR] ❌ Erreur MongoDB :', dbErr.message);
  }

  console.log(`[MONITOR] Poules: ${result.chicken_count} | Anormales: ${result.abnormal_count}`);

  // 5. Envoyer en temps réel via Socket.IO
  if (io) {
    io.to('coop_cam_01').emit('chicken_update', {
      chicken_count:  result.chicken_count,
      abnormal_count: result.abnormal_count,
      predator_alert: result.predator_alert,
      brightness:     brightness?.brightness,
      light_command:  brightness?.light_command,
      timestamp:      new Date(),
    });
  }

  // 6. Alerte prédateur urgente
  if (result.predator_alert && io) {
    console.log('[MONITOR] 🚨 ALERTE PREDATEUR :', result.predators);
    io.to('coop_cam_01').emit('predator_alert', {
      predators: result.predators,
      timestamp: new Date(),
      message:   'Prédateur détecté dans le poulailler !',
    });
  }

  // 7. Commande éclairage via MQTT ✅ (publishCommand, pas publish)
  if (brightness?.light_command) {
    if (isConnected()) {
      publishCommand(ESP_CAM_MAC, {
        relay: 'light',
        state: brightness.light_command, // 'ON' ou 'OFF'
      });
      console.log(`[MONITOR] 💡 Eclairage → ${brightness.light_command}`);
    } else {
      console.warn('[MONITOR] ⚠️  MQTT non connecté — commande éclairage ignorée');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Démarrer la surveillance
// ─────────────────────────────────────────────────────────────
function startMonitoring(socketIo) {
  io = socketIo;
  console.log('[MONITOR] Surveillance démarrée — toutes les 30 secondes');
  cron.schedule('*/30 * * * * *', runAnalysis);
}

module.exports = { startMonitoring };