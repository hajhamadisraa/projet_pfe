const cron                          = require('node-cron');
const axios                         = require('axios');
const { detectChickens,
        analyzeBrightness }         = require('./aiService');
const { publishCommand, isConnected } = require('./mqttService');
const ChickenCount                  = require('../models/ChickenCount');
const Coop                          = require('../models/Coop');

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const ESP_CAM_IP      = process.env.ESP_CAM_IP     || '192.168.1.53';
const ESP_CAM_MAC     = process.env.ESP_CAM_MAC    || 'EC626084195C';
const ESP_CAPTURE_URL = `http://${ESP_CAM_IP}/capture`;
const RELAY_ESP_MAC   = process.env.RELAY_ESP_MAC; // ⚠️ MAC du contrôleur fan/heater/light/pompe — à ajouter dans .env

let io = null;

// dernier état lumière envoyé avec succès en mode AUTO (anti-spam MQTT)
const lastSentLightState = new Map();

// ─────────────────────────────────────────────────────────────
// Capturer une frame JPEG depuis l'ESP32-CAM
// ─────────────────────────────────────────────────────────────
async function captureFrame() {
  try {
    for (let i = 0; i < 3; i++) {
      await axios.get(ESP_CAPTURE_URL, {
        responseType: 'arraybuffer',
        timeout: 5000,
      }).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }
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
// Envoie la commande lumière au bon format, en respectant le
// mode AUTO/MANUEL choisi par l'utilisateur depuis l'app
// ─────────────────────────────────────────────────────────────
async function maybeSendLightCommand(lightCommand) {
  if (!lightCommand) return;

  if (!RELAY_ESP_MAC) {
    console.error('[MONITOR] ❌ RELAY_ESP_MAC non défini dans .env — commande lumière impossible');
    return;
  }

  // ⚠️ Un seul poulailler pour l'instant → on prend le seul document Coop
  // existant plutôt que de chercher par MAC. À revoir si plusieurs
  // poulaillers sont ajoutés un jour.
  const coop = await Coop.findOne({});
  if (!coop) {
    console.warn('[MONITOR] ⚠️  Aucun document Coop trouvé en base');
    return;
  }

  if (coop.actuators?.light?.mode !== 'auto') {
    lastSentLightState.delete(RELAY_ESP_MAC); // forcer un resync au retour en AUTO
    return;
  }

  const wantOn = lightCommand === 'ON';
  if (lastSentLightState.get(RELAY_ESP_MAC) === wantOn) return;

  if (!isConnected()) {
    console.warn('[MONITOR] ⚠️  MQTT non connecté — commande éclairage ignorée');
    return;
  }

  publishCommand(RELAY_ESP_MAC, { action: 'AUTO_LIGHT_STATE', target: 'light', value: wantOn });
  lastSentLightState.set(RELAY_ESP_MAC, wantOn);
  console.log(`[MONITOR] 💡 Eclairage → ${wantOn ? 'ON' : 'OFF'}`);
}

// ─────────────────────────────────────────────────────────────
// Analyse principale — lancée toutes les 30 secondes
// ─────────────────────────────────────────────────────────────
async function runAnalysis() {
  console.log(`[MONITOR] Analyse — ${new Date().toLocaleTimeString()}`);

  const imageBuffer = await captureFrame();
  if (!imageBuffer) {
    console.warn('[MONITOR] ⚠️  Analyse annulée — pas de frame disponible');
    return;
  }

  const result = await detectChickens(imageBuffer);
  if (!result) {
    console.warn('[MONITOR] ⚠️  Détection IA échouée');
    return;
  }

  const brightness = await analyzeBrightness(imageBuffer);

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

  if (result.predator_alert && io) {
    console.log('[MONITOR] 🚨 ALERTE PREDATEUR :', result.predators);
    io.to('coop_cam_01').emit('predator_alert', {
      predators: result.predators,
      timestamp: new Date(),
      message:   'Prédateur détecté dans le poulailler !',
    });
  }

  await maybeSendLightCommand(brightness?.light_command);
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