// src/models/services/apiService.js
import axios from 'axios';
import storageHelper from '../storage/storageHelper';
import { API } from '../utils/constants';

// ─────────────────────────────────────────
// 🏗️ INSTANCE AXIOS
// ─────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API.BASE_URL,
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─────────────────────────────────────────
// 📤 INTERCEPTEUR REQUEST
// Ajoute le token JWT à chaque requête
// ─────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storageHelper.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    console.error('[API] Erreur requête:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// 📥 INTERCEPTEUR RESPONSE
// Gère les erreurs globalement
// ─────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ✅ ${response.config.url}`, response.data);
    }
    return response.data;
  },
  async (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erreur réseau inconnue';

    if (__DEV__) {
      console.error(`[API] ❌ Erreur ${status}:`, message);
    }

    // 401 — token expiré → déconnexion automatique
    if (status === 401) {
      await storageHelper.clearAuth();
      // Le store Zustand sera notifié via useAuth
      // On émet un event global pour que AppNavigator réagisse
      apiEvents.emit('unauthorized');
    }

    // 403 — accès interdit
    if (status === 403) {
      console.warn('[API] Accès refusé');
    }

    // 500+ — erreur serveur
    if (status >= 500) {
      console.error('[API] Erreur serveur:', message);
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data || null,
    });
  }
);

// ─────────────────────────────────────────
// 📡 EVENT EMITTER LÉGER (pour le 401)
// Permet à AppNavigator d'écouter les déconnexions
// ─────────────────────────────────────────
const listeners = {};

const apiEvents = {
  on: (event, callback) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },
  off: (event, callback) => {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  },
  emit: (event, data) => {
    if (!listeners[event]) return;
    listeners[event].forEach((cb) => cb(data));
  },
};

// ─────────────────────────────────────────
// 🔧 MÉTHODES HTTP
// ─────────────────────────────────────────

const api = {
  /**
   * GET /endpoint
   */
  get: (url, params = {}) =>
    apiClient.get(url, { params }),

  /**
   * POST /endpoint avec body
   */
  post: (url, data = {}) =>
    apiClient.post(url, data),

  /**
   * PUT /endpoint avec body complet
   */
  put: (url, data = {}) =>
    apiClient.put(url, data),

  /**
   * PATCH /endpoint avec body partiel
   */
  patch: (url, data = {}) =>
    apiClient.patch(url, data),

  /**
   * DELETE /endpoint
   */
  delete: (url) =>
    apiClient.delete(url),

  /**
   * Upload multipart (images, fichiers)
   */
  upload: (url, formData) =>
    apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─────────────────────────────────────────
// 🎭 MOCK HELPER
// Simule un délai réseau en mode mock
// ─────────────────────────────────────────
/**
 * Simule un appel API avec délai
 * @param {any} data - Données à retourner
 * @param {number} delay - Délai en ms (défaut 600ms)
 * @param {boolean} shouldFail - Force une erreur (test)
 */
export const mockResponse = (data, delay = 600, shouldFail = false) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject({ status: 500, message: 'Erreur mock simulée' });
      } else {
        resolve(data);
      }
    }, delay);
  });

// ─────────────────────────────────────────
// 📤 EXPORTS
// ─────────────────────────────────────────
export { apiEvents };
export default api;