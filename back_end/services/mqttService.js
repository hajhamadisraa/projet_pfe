// services/mqttService.js
const mqtt        = require('mqtt');
const Coop        = require('../models/Coop');
const Esp32Device = require('../models/Esp32Device');
const createAlert = require('../utils/createAlert');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://192.168.1.112';

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
      const mac = topic.split('/')[1];
      if (!mac) return;

      if (topic.endsWith('/data'))      await handleData(mac, message);
      if (topic.endsWith('/heartbeat')) await handleHeartbeat(mac, message);
      if (topic.endsWith('/status'))    await handleStatus(mac, message);
      if (topic.endsWith('/actuators')) await handleActuators(mac, message);
    } catch (err) {
      console.error('[MQTT] ❌ Erreur message:', err.message);
    }
  });

  client.on('error',     (err) => console.error('[MQTT] ❌', err.message));
  client.on('reconnect', ()    => console.log('[MQTT] 🔄 Reconnexion...'));
  client.on('offline',   ()    => console.warn('[MQTT] ⚠️  Hors ligne'));
};

// ─────────────────────────────────────────────────────────────
//  handleData — reçoit les données capteurs de l'ESP32
// ─────────────────────────────────────────────────────────────
const handleData = async (mac, data) => {
  const { token, temperature, humidity, luminosity, ventilation,
          waterLevel, pumpOn } = data;  // ✅ extraire waterLevel et pumpOn

  const coop = await Coop.findOne({ esp32Token: token });
  if (!coop) {
    console.warn(`[MQTT] Token invalide pour ${mac}`);
    return;
  }

  // Mise à jour MongoDB
  coop.sensors = coop.sensors || {};
  if (temperature !== undefined) coop.sensors.temperature = { value: parseFloat(temperature) };
  if (humidity    !== undefined) coop.sensors.humidity    = { value: parseFloat(humidity) };
  if (luminosity  !== undefined) coop.sensors.luminosity  = { value: parseFloat(luminosity) };
  if (ventilation !== undefined) coop.sensors.ventilation = { value: parseFloat(ventilation) };
  coop.isOnline   = true;
  coop.lastSeenAt = new Date();
  await coop.save();

  console.log(`[MQTT] 📊 ${coop.name} → T=${temperature}°C H=${humidity}% Eau=${waterLevel ?? 0}% Pompe=${pumpOn ? 'ON' : 'OFF'}`);

  // Alertes température
  if (temperature !== undefined) {
    if (temperature > (coop.tempMax || 28)) {
      await createAlert('TEMPERATURE_HIGH', {
        coopId: coop._id, coopName: coop.name,
        currentTemp: parseFloat(temperature), threshold: coop.tempMax || 28,
      }).catch(() => {});
    } else if (temperature < (coop.tempMin || 20)) {
      await createAlert('TEMPERATURE_LOW', {
        coopId: coop._id, coopName: coop.name,
        currentTemp: parseFloat(temperature), threshold: coop.tempMin || 20,
      }).catch(() => {});
    }
  }

  // ✅ Envoi Socket.IO avec waterLevel et pumpOn
  if (socketIO) {
    socketIO.to(`coop_${coop._id}`).emit('sensor_update', {
      coopId:      coop._id.toString(),
      temperature,
      humidity,
      luminosity,
      ventilation,
      waterLevel:  waterLevel ?? 0,    // ✅ niveau eau en %
      pumpOn:      pumpOn    ?? false, // ✅ état pompe
      timestamp:   new Date().toISOString(),
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  handleActuators — état relais reçu depuis l'ESP32
// ─────────────────────────────────────────────────────────────
const handleActuators = async (mac, data) => {
  console.log(`[MQTT] 🔌 Actionneurs ${mac} :`, data);

  await Esp32Device.findOneAndUpdate(
    { mac: mac.toUpperCase() },
    { lastSeenAt: new Date() }
  );

  // Émettre l'état réel des relais à l'app
  if (socketIO) {
    socketIO.emit('actuator_state', {
      mac, ...data, timestamp: new Date().toISOString(),
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  handleHeartbeat + handleStatus
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
//  publishCommand
// ─────────────────────────────────────────────────────────────
const publishCommand = (mac, command) => {
  if (!client?.connected) {
    console.error('[MQTT] ❌ Broker non connecté');
    return false;
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