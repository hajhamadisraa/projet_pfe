// services/mqttService.js — VERSION ÉTAPE 5
// ✅ Gère l'état des actionneurs + auto-contrôle ventilateur
const mqtt        = require('mqtt');
const Coop        = require('../models/Coop');
const Esp32Device = require('../models/Esp32Device');
const Alert       = require('../models/Alert');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

// ─────────────────────────────────────────────────────────────
//  Normes avicoles — seuils automatiques
// ─────────────────────────────────────────────────────────────
const THRESHOLDS = {
  fan:    { on: 27, off: 25 },    // Hystérésis pour éviter oscillations
  heater: { on: 18, off: 20 },
};

let client   = null;
let socketIO = null;

const init = (io) => {
  socketIO = io;
  console.log(`[MQTT] Connexion au broker : ${BROKER_URL}`);

  client = mqtt.connect(BROKER_URL, {
    clientId: `backend_${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    console.log('[MQTT] ✅ Connecté au broker Mosquitto !');
    ['coop/+/data', 'coop/+/heartbeat', 'coop/+/status', 'coop/+/actuators'].forEach((topic) => {
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) console.log(`[MQTT] 📡 Abonné : ${topic}`);
      });
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      const mac     = topic.split('/')[1];
      if (!mac) return;

      if (topic.endsWith('/data'))      await handleData(mac, message);
      if (topic.endsWith('/heartbeat')) await handleHeartbeat(mac, message);
      if (topic.endsWith('/status'))    await handleStatus(mac, message);
      if (topic.endsWith('/actuators')) await handleActuators(mac, message); // ✅ NOUVEAU
    } catch (err) {
      console.error('[MQTT] ❌ Erreur message:', err.message);
    }
  });

  client.on('error',     (err) => console.error('[MQTT] ❌', err.message));
  client.on('reconnect', ()    => console.log('[MQTT] 🔄 Reconnexion...'));
  client.on('offline',   ()    => console.warn('[MQTT] ⚠️  Hors ligne'));
};

// ─────────────────────────────────────────────────────────────
//  Données capteurs → MongoDB + Socket.IO + Auto-contrôle
// ─────────────────────────────────────────────────────────────
const handleData = async (mac, data) => {
  const { token, temperature, humidity, luminosity, ventilation } = data;

  const coop = await Coop.findOne({ esp32Token: token });
  if (!coop) { console.warn(`[MQTT] Token invalide pour ${mac}`); return; }

  coop.sensors.temperature.value = temperature ?? coop.sensors.temperature.value;
  coop.sensors.humidity.value    = humidity    ?? coop.sensors.humidity.value;
  coop.sensors.luminosity.value  = luminosity  ?? coop.sensors.luminosity.value;
  coop.sensors.ventilation.value = ventilation ?? coop.sensors.ventilation.value;
  coop.isOnline   = true;
  coop.lastSeenAt = new Date();
  await coop.save();

  // Alerte température critique
  if (temperature > 35) {
    await Alert.create({
      title: '🔥 Température critique',
      description: `Température de ${temperature}°C — Intervention requise`,
      severity: 'critical', category: 'environment',
      location: coop.name, coop: coop._id,
    }).catch(() => {});
  } else if (temperature > 30) {
    await Alert.create({
      title: 'Température élevée',
      description: `Température de ${temperature}°C détectée.`,
      severity: 'warning', category: 'environment',
      location: coop.name, coop: coop._id,
    }).catch(() => {});
  }

  // ✅ Envoyer données temps réel à l'app
  if (socketIO) {
    socketIO.to(`coop_${coop._id}`).emit('sensor_update', {
      coopId: coop._id.toString(),
      temperature, humidity, luminosity, ventilation,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ Auto-contrôle ventilateur si ESP32 est en mode AUTO
  // L'ESP32 gère lui-même en local, mais le backend peut aussi envoyer
  // des commandes de confirmation ou d'override
  await autoControlFan(mac, temperature);

  console.log(`[MQTT] 📊 ${coop.name} : T=${temperature}°C H=${humidity}%`);
};

// ─────────────────────────────────────────────────────────────
//  Auto-contrôle ventilateur (confirmation backend)
// ─────────────────────────────────────────────────────────────
const autoControlFan = async (mac, temperature) => {
  if (temperature == null) return;

  // Récupérer l'ESP32 pour vérifier son mode
  const device = await Esp32Device.findOne({ mac: mac.toUpperCase() });
  if (!device || device.status !== 'assigned') return;

  // Le backend confirme la commande si température critique
  // (l'ESP32 gère aussi localement, double sécurité)
  if (temperature >= 35) {
    publishCommand(mac, { action: 'SET_RELAY', target: 'fan', value: true });
    console.log(`[AUTO] 🌀 Ventilateur FORCÉ ON — T critique: ${temperature}°C`);
  }
};

// ─────────────────────────────────────────────────────────────
//  ✅ NOUVEAU — État actionneurs reçu depuis l'ESP32
// ─────────────────────────────────────────────────────────────
const handleActuators = async (mac, data) => {
  // data = { fan, heater, light, padCooling, waterPump, mac }
  console.log(`[MQTT] 🔌 État actionneurs ${mac} :`, data);

  // Mettre à jour l'ESP32Device si nécessaire
  await Esp32Device.findOneAndUpdate(
    { mac: mac.toUpperCase() },
    { lastSeenAt: new Date() }
  );

  // ✅ Envoyer l'état réel des relais à l'app via Socket.IO
  if (socketIO) {
    socketIO.emit('actuator_state', { mac, ...data, timestamp: new Date().toISOString() });
  }
};

// ─────────────────────────────────────────────────────────────
//  Heartbeat + Status
// ─────────────────────────────────────────────────────────────
const handleHeartbeat = async (mac, data) => {
  await Esp32Device.findOneAndUpdate(
    { mac: mac.toUpperCase() },
    { lastSeenAt: new Date(), isOnline: true, ipAddress: data.ip || null }
  );
  if (socketIO) socketIO.emit('esp32_heartbeat', { mac, ...data });
};

const handleStatus = async (mac, data) => {
  const isOnline = data.online !== false;
  await Esp32Device.findOneAndUpdate(
    { mac: mac.toUpperCase() },
    { isOnline, lastSeenAt: new Date() }
  );
  console.log(`[MQTT] ${isOnline ? '🟢' : '🔴'} ESP32 ${mac} : ${isOnline ? 'en ligne' : 'hors ligne'}`);
};

// ─────────────────────────────────────────────────────────────
//  Publication commandes
// ─────────────────────────────────────────────────────────────
const publishCommand = (mac, command) => {
  if (!client?.connected) {
    console.error('[MQTT] ❌ Non connecté'); return false;
  }
  const topic   = `coop/${mac.toUpperCase()}/commands`;
  const payload = JSON.stringify({ ...command, timestamp: Date.now() });
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) console.error('[MQTT] ❌ Erreur publication:', err.message);
    else     console.log(`[MQTT] 📤 ${topic} :`, command);
  });
  return true;
};

const isConnected = () => client?.connected || false;

module.exports = { init, publishCommand, isConnected };