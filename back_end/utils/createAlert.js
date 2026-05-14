// utils/createAlert.js
const Alert = require('../models/Alert');

const ALERT_TEMPLATES = {

  // ─────────────────────────────────────────
  // 👤 UTILISATEURS
  // ─────────────────────────────────────────
  USER_CREATED: (meta) => ({
    type:        'USER_CREATED',
    severity:    'info',
    category:    'system',
    title:       'Nouvel éleveur créé',
    description: `Le compte de ${meta.name} (${meta.email}) a été créé avec succès. Un email d'activation a été envoyé.`,
    location:    'Gestion utilisateurs',
    targetRole:  'admin',
    metadata:    meta,
  }),

  USER_DELETED: (meta) => ({
    type:        'USER_DELETED',
    severity:    'warning',
    category:    'system',
    title:       'Éleveur supprimé',
    description: `Le compte de ${meta.name} (${meta.email}) a été supprimé définitivement.`,
    location:    'Gestion utilisateurs',
    targetRole:  'admin',
    metadata:    meta,
  }),

  INVITE_EXPIRED: (meta) => ({
    type:        'INVITE_EXPIRED',
    severity:    'warning',
    category:    'system',
    title:       "Lien d'activation expiré",
    description: `Le lien d'activation de ${meta.name} (${meta.email}) a expiré sans être utilisé.`,
    location:    'Gestion utilisateurs',
    targetRole:  'admin',
    metadata:    meta,
  }),

  // ✅ NOUVEAU — Demande de compte par auto-inscription
  ACCOUNT_REQUEST: (meta) => ({
    type:        'ACCOUNT_REQUEST',
    severity:    'warning',
    category:    'account',                      // ← catégorie dédiée visible dans AlertsScreen
    title:       'Nouvelle demande de compte',
    description: `${meta.userName} (${meta.userEmail}) souhaite créer un compte éleveur.`,
    location:    'Inscription',
    targetRole:  'admin',
    metadata: {
      userId:    meta.userId,
      userName:  meta.userName,
      userEmail: meta.userEmail,
    },
  }),

  // ✅ NOUVEAU — Compte approuvé par l'admin
  ACCOUNT_APPROVED: (meta) => ({
    type:        'ACCOUNT_APPROVED',
    severity:    'info',
    category:    'account',
    title:       'Compte éleveur approuvé',
    description: `Le compte de ${meta.userName} (${meta.userEmail}) a été validé et activé.`,
    location:    'Gestion utilisateurs',
    targetRole:  'admin',
    metadata:    meta,
  }),

  // ─────────────────────────────────────────
  // 🐔 POULAILLERS
  // ─────────────────────────────────────────
  COOP_CREATED: (meta) => ({
    type:        'COOP_CREATED',
    severity:    'info',
    category:    'system',
    title:       'Nouveau poulailler ajouté',
    description: `Le poulailler "${meta.name}" (secteur ${meta.sector}) a été ajouté avec succès.`,
    location:    meta.name,
    targetRole:  'admin',
    metadata:    meta,
  }),

  COOP_UPDATED: (meta) => ({
    type:        'COOP_UPDATED',
    severity:    'info',
    category:    'system',
    title:       'Poulailler modifié',
    description: `Le poulailler "${meta.name}" (secteur ${meta.sector}) a été mis à jour.`,
    location:    meta.name,
    targetRole:  'admin',
    metadata:    meta,
  }),

  COOP_DELETED: (meta) => ({
    type:        'COOP_DELETED',
    severity:    'warning',
    category:    'system',
    title:       'Poulailler supprimé',
    description: `Le poulailler "${meta.name}" a été supprimé.`,
    location:    meta.name,
    targetRole:  'admin',
    metadata:    meta,
  }),

  // ─────────────────────────────────────────
  // 👥 AFFECTATIONS
  // ─────────────────────────────────────────
  USER_ASSIGNED: (meta) => ({
    type:        'USER_ASSIGNED',
    severity:    'info',
    category:    'system',
    title:       'Éleveur affecté',
    description: `${meta.userName} a été affecté au poulailler "${meta.coopName}".`,
    location:    meta.coopName,
    targetRole:  'admin',
    metadata:    meta,
  }),

  USER_UNASSIGNED: (meta) => ({
    type:        'USER_UNASSIGNED',
    severity:    'info',
    category:    'system',
    title:       'Éleveur retiré',
    description: `Un éleveur a été retiré du poulailler "${meta.coopName}".`,
    location:    meta.coopName,
    targetRole:  'admin',
    metadata:    meta,
  }),

  // ─────────────────────────────────────────
  // ⚙️ SYSTÈME
  // ─────────────────────────────────────────
  ESP32_OFFLINE: (meta) => ({
    type:        'ESP32_OFFLINE',
    severity:    'critical',
    category:    'system',
    title:       'ESP32 hors ligne',
    description: `Le capteur du poulailler "${meta.name}" ne répond plus. Vérifiez la connexion.`,
    location:    meta.name,
    targetRole:  'admin',
    metadata:    meta,
  }),

  COOP_NO_OWNER: (meta) => ({
    type:        'COOP_NO_OWNER',
    severity:    'warning',
    category:    'system',
    title:       'Poulailler sans éleveur',
    description: `Le poulailler "${meta.name}" n'a aucun éleveur assigné.`,
    location:    meta.name,
    targetRole:  'admin',
    metadata:    meta,
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
    console.log(`[Alert] ✅ ${type} créée — id: ${alert._id}`);
    return alert;
  } catch (err) {
    console.error('[Alert] ❌ Erreur création alerte:', err.message);
    return null;
  }
};

module.exports = createAlert;