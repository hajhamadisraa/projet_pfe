// utils/createAlert.js
const Alert = require('../models/Alert');

const ALERT_TEMPLATES = {

  // ─────────────────────────────────────────
  // 👤 UTILISATEURS
  // ─────────────────────────────────────────
  USER_CREATED: (meta) => ({ /* ... ton code existant ... */ }),
  USER_DELETED: (meta) => ({ /* ... */ }),
  INVITE_EXPIRED: (meta) => ({ /* ... */ }),
  ACCOUNT_REQUEST: (meta) => ({ /* ... */ }),
  ACCOUNT_APPROVED: (meta) => ({ /* ... */ }),

  // ─────────────────────────────────────────
  // 🐔 POULAILLERS
  // ─────────────────────────────────────────
  COOP_CREATED: (meta) => ({ /* ... */ }),
  COOP_UPDATED: (meta) => ({ /* ... */ }),
  COOP_DELETED: (meta) => ({ /* ... */ }),

  // ─────────────────────────────────────────
  // 👥 AFFECTATIONS
  // ─────────────────────────────────────────
  USER_ASSIGNED: (meta) => ({ /* ... */ }),
  USER_UNASSIGNED: (meta) => ({ /* ... */ }),

  // ─────────────────────────────────────────
  // ⚙️ SYSTÈME
  // ─────────────────────────────────────────
  ESP32_OFFLINE: (meta) => ({ /* ... */ }),
  COOP_NO_OWNER: (meta) => ({ /* ... */ }),

  // ─────────────────────────────────────────
  // 🌡️ NOUVEAU : ALERTES TEMPÉRATURE (pour éleveurs)
  // ─────────────────────────────────────────
  TEMPERATURE_HIGH: (meta) => ({
    type:        'TEMPERATURE_HIGH',
    severity:    'critical',
    category:    'temperature',
    title:       '🌡️ Température trop élevée !',
    description: `La température a atteint ${meta.currentTemp}°C (seuil maximum : ${meta.threshold}°C)`,
    location:    meta.coopName || 'Poulailler',
    targetRole:  'eleveur',                    // Important : visible par l'éleveur
    coop:        meta.coopId,
    metadata: {
      sensorName:  meta.sensorName || 'Capteur principal',
      currentTemp: meta.currentTemp,
      threshold:   meta.threshold,
      direction:   'above',
    }
  }),

  TEMPERATURE_LOW: (meta) => ({
    type:        'TEMPERATURE_LOW',
    severity:    'critical',
    category:    'temperature',
    title:       '🌡️ Température trop basse !',
    description: `La température a chuté à ${meta.currentTemp}°C (seuil minimum : ${meta.threshold}°C)`,
    location:    meta.coopName || 'Poulailler',
    targetRole:  'eleveur',
    coop:        meta.coopId,
    metadata: {
      sensorName:  meta.sensorName || 'Capteur principal',
      currentTemp: meta.currentTemp,
      threshold:   meta.threshold,
      direction:   'below',
    }
  }),

  // ─────────────────────────────────────────
  // 💨 ALERTES VENTILATEUR (déjà présentes ou à ajouter)
  // ─────────────────────────────────────────
  FAN_MANUAL_ACTIVATED: (meta) => ({
    type:        'FAN_MANUAL_ACTIVATED',
    severity:    'warning',
    category:    'fan',
    title:       'Ventilateur activé manuellement',
    description: `Le ventilateur "${meta.fanName || 'principal'}" a été activé manuellement.`,
    location:    meta.coopName || 'Poulailler',
    targetRole:  'eleveur',
    coop:        meta.coopId,
    metadata: {
      fanName:  meta.fanName || 'Ventilateur principal',
      fanState: 'activated',
      changedBy: meta.changedBy || 'Éleveur',
    }
  }),

  FAN_MANUAL_DEACTIVATED: (meta) => ({
    type:        'FAN_MANUAL_DEACTIVATED',
    severity:    'warning',
    category:    'fan',
    title:       'Ventilateur désactivé manuellement',
    description: `Le ventilateur "${meta.fanName || 'principal'}" a été désactivé manuellement.`,
    location:    meta.coopName || 'Poulailler',
    targetRole:  'eleveur',
    coop:        meta.coopId,
    metadata: {
      fanName:  meta.fanName || 'Ventilateur principal',
      fanState: 'deactivated',
      changedBy: meta.changedBy || 'Éleveur',
    }
  }),
};

// ─────────────────────────────────────────
// Fonction principale
// ─────────────────────────────────────────
const createAlert = async (type, metadata = {}) => {
  try {
    const template = ALERT_TEMPLATES[type];
    if (!template) {
      console.warn(`[Alert] ⚠️ Type d'alerte inconnu: ${type}`);
      return null;
    }

    const alertData = template(metadata);
    const alert = await Alert.create(alertData);

    console.log(`[Alert] ✅ ${type} créée pour ${alertData.location} — id: ${alert._id}`);
    return alert;
  } catch (err) {
    console.error('[Alert] ❌ Erreur création alerte:', err.message);
    return null;
  }
};

module.exports = createAlert;