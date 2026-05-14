// src/controllers/context/AppStore.js
import { create } from 'zustand';
import api from '../../models/services/apiService';
import storageHelper from '../../models/storage/storageHelper';
import { API } from '../../models/utils/constants';
import {
  MOCK_ALERTS,
  MOCK_COOPS,
  MOCK_FARM,
  MOCK_SENSORS,
} from '../../models/utils/mockData';

const useAppStore = create((set, get) => ({

  // ───────────────────────────────────────
  // 🔄 ÉTAT DE CHARGEMENT INITIAL
  // ───────────────────────────────────────
  isAppReady: false,
  setAppReady: (ready) => set({ isAppReady: ready }),

  // ───────────────────────────────────────
  // 👤 AUTHENTIFICATION
  // ───────────────────────────────────────
  user: null,
  token: null,
  isAuthenticated: false,

  setUser:  (user)  => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  login: async (userData, token) => {
    // ✅ Normaliser l'id — le backend renvoie _id, on le mappe en id
    const normalizedUser = {
      ...userData,
      id: userData.id || userData._id,
    };
    await storageHelper.saveUser(normalizedUser);
    await storageHelper.saveToken(token);
    set({ user: normalizedUser, token, isAuthenticated: true });
  },

  logout: async () => {
    await storageHelper.clearAuth();
    await storageHelper.removeSelectedCoop();
    set({
      user:              null,
      token:             null,
      isAuthenticated:   false,
      selectedCoop:      null,
      coops:             [],
      sensors:           null,
      alerts:            [],
      unreadAlertsCount: 0,
    });
  },

  // ───────────────────────────────────────
  // 🏠 FERME
  // ───────────────────────────────────────
  farm: null,
  setFarm: (farm) => set({ farm }),

  // ───────────────────────────────────────
  // 🐔 COOPS
  // ───────────────────────────────────────
  coops:        [],
  selectedCoop: null,
  coopsLoading: false,
  coopsError:   null,

  setCoops:        (coops)   => set({ coops }),
  setCoopsLoading: (loading) => set({ coopsLoading: loading }),
  setCoopsError:   (error)   => set({ coopsError: error }),

  setSelectedCoop: async (coop) => {
    await storageHelper.saveSelectedCoop(coop);
    set({ selectedCoop: coop });
  },

  fetchCoops: async () => {
    try {
      set({ coopsLoading: true, coopsError: null });
      const res = await api.get('/coops/my');
      // Remplace la fonction map dans fetchCoops par :
const coops = (res.data || []).map((c) => ({
  id:             c._id,
  name:           c.name,
  sector:         c.sector,
  status:         c.status === 'healthy' ? 'healthy'
                : c.status === 'warning' ? 'warning' : 'critical',
  population:     c.population || 0,
  mortality:      c.mortality  || 0,
  temperature:    c.sensors?.temperature?.value || 24,
  humidity:       c.sensors?.humidity?.value    || 60,
  warningMessage: c.warningMessage || null,
  espMac:         c.espMac || null,    // ← AJOUTER
}));
      set({ coops, coopsLoading: false });
    } catch (err) {
      console.error('[AppStore] fetchCoops erreur:', err);
      set({ coopsError: err.message, coopsLoading: false });
    }
  },

  // ───────────────────────────────────────
  // 📡 CAPTEURS
  // ───────────────────────────────────────
  sensors: null,
  setSensors: (sensors) => set({ sensors }),
  updateSensor: (key, value) =>
    set((state) => ({
      sensors: state.sensors
        ? { ...state.sensors, [key]: { ...state.sensors[key], value } }
        : state.sensors,
    })),

  // ───────────────────────────────────────
  // 🔔 ALERTES
  // ───────────────────────────────────────
  alerts:            [],
  unreadAlertsCount: 0,
  alertsLoading:     false,

  fetchAlerts: async () => {
    try {
      set({ alertsLoading: true });
      const res = await api.get('/alerts');
      const alerts = (res.data || []).map((a) => ({
        id:          a._id,
        type:        a.type,
        severity:    a.severity,
        category:    a.category,
        title:       a.title,
        description: a.description,
        location:    a.location,
        timestamp:   new Date(a.createdAt).toLocaleString('fr-FR', {
                       day:    '2-digit',
                       month:  '2-digit',
                       hour:   '2-digit',
                       minute: '2-digit',
                     }),
        isRead: a.isRead,

        // ✅ Mapper metadata → meta pour les alertes de type account
        // AlertsScreen utilise alert.meta.userId, alert.meta.userName, etc.
        meta: a.metadata || null,
      }));
      set({
        alerts,
        unreadAlertsCount: alerts.filter((a) => !a.isRead).length,
        alertsLoading:     false,
      });
    } catch (err) {
      console.error('[AppStore] fetchAlerts erreur:', err);
      set({ alertsLoading: false });
    }
  },

  setAlerts: (alerts) => {
    const unread = alerts.filter((a) => !a.isRead).length;
    set({ alerts, unreadAlertsCount: unread });
  },

  addAlert: (alert) =>
    set((state) => ({
      alerts:            [alert, ...state.alerts],
      unreadAlertsCount: state.unreadAlertsCount + 1,
    })),

  dismissAlert: async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/dismiss`);
      set((state) => {
        const updated = state.alerts.filter((a) => a.id !== alertId);
        return {
          alerts:            updated,
          unreadAlertsCount: updated.filter((a) => !a.isRead).length,
        };
      });
    } catch (err) {
      console.error('[AppStore] dismissAlert erreur:', err);
    }
  },

  dismissAllAlerts: async () => {
    try {
      await api.delete('/alerts');
      set({ alerts: [], unreadAlertsCount: 0 });
    } catch (err) {
      console.error('[AppStore] dismissAllAlerts erreur:', err);
      set({ alerts: [], unreadAlertsCount: 0 });
    }
  },

  markAlertRead: async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      set((state) => {
        const updated = state.alerts.map((a) =>
          a.id === alertId ? { ...a, isRead: true } : a
        );
        return {
          alerts:            updated,
          unreadAlertsCount: updated.filter((a) => !a.isRead).length,
        };
      });
    } catch (err) {
      console.error('[AppStore] markAlertRead erreur:', err);
    }
  },

  markAllAlertsRead: async () => {
    try {
      await api.patch('/alerts/read-all');
      set((state) => ({
        alerts:            state.alerts.map((a) => ({ ...a, isRead: true })),
        unreadAlertsCount: 0,
      }));
    } catch (err) {
      console.error('[AppStore] markAllAlertsRead erreur:', err);
    }
  },

  setAlertsLoading: (loading) => set({ alertsLoading: loading }),

  // ───────────────────────────────────────
  // 🔔 PARAMÈTRES NOTIFICATIONS
  // ───────────────────────────────────────
  notificationSettings: {
    emergencyOverride: true,
    security:          true,
    health:            true,
    environment:       false,
    system:            true,
  },

  setNotificationSettings: async (settings) => {
    await storageHelper.saveNotificationSettings(settings);
    set({ notificationSettings: settings });
  },

  toggleNotificationSetting: async (key) => {
    const current = get().notificationSettings;
    const updated = { ...current, [key]: !current[key] };
    await storageHelper.saveNotificationSettings(updated);
    set({ notificationSettings: updated });
  },

  // ───────────────────────────────────────
  // ⚙️ ÉQUIPEMENTS
  // ───────────────────────────────────────
  equipment:       [],
  equipmentFilter: 'all',

  setEquipment: (equipment) => set({ equipment }),
  toggleEquipment: (equipmentId) =>
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === equipmentId ? { ...eq, isOn: !eq.isOn } : eq
      ),
    })),
  setEquipmentFilter: (filter) => set({ equipmentFilter: filter }),

  // ───────────────────────────────────────
  // 🎨 THÈME
  // ───────────────────────────────────────
  theme: 'light',

  setTheme: async (theme) => {
    await storageHelper.saveTheme(theme);
    set({ theme });
  },

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    await storageHelper.saveTheme(next);
    set({ theme: next });
  },

  // ───────────────────────────────────────
  // 🚀 INITIALISATION AU DÉMARRAGE
  // ───────────────────────────────────────
  initializeApp: async () => {
    try {
      const stored = await storageHelper.loadAppData();

      const notificationSettings = stored.notificationSettings || {
        emergencyOverride: true,
        security:          true,
        health:            true,
        environment:       false,
        system:            true,
      };
      const theme = stored.theme || 'light';

      if (API.USE_MOCK) {
        set({
          user:              null,
          token:             null,
          isAuthenticated:   false,
          farm:              MOCK_FARM,
          coops:             MOCK_COOPS,
          selectedCoop:      stored.selectedCoop || MOCK_COOPS[0],
          sensors:           MOCK_SENSORS,
          alerts:            MOCK_ALERTS,
          unreadAlertsCount: MOCK_ALERTS.filter((a) => !a.read).length,
          notificationSettings,
          theme,
          isAppReady: true,
        });
        return;
      }

      // ✅ Normaliser l'user stocké — s'assurer que id est défini
      const storedUser = stored.user
        ? { ...stored.user, id: stored.user.id || stored.user._id }
        : null;

      set({
        user:             storedUser,
        token:            stored.token,
        isAuthenticated:  !!stored.token,
        selectedCoop:     stored.selectedCoop,
        notificationSettings,
        theme,
        isAppReady: true,
      });
    } catch (error) {
      console.error('[AppStore] Erreur initializeApp:', error);
      set({ isAppReady: true });
    }
  },

  // ───────────────────────────────────────
  // 🔁 RESET COMPLET
  // ───────────────────────────────────────
  resetStore: () =>
    set({
      user:              null,
      token:             null,
      isAuthenticated:   false,
      farm:              null,
      coops:             [],
      selectedCoop:      null,
      sensors:           null,
      alerts:            [],
      unreadAlertsCount: 0,
      equipment:         [],
      coopsLoading:      false,
      coopsError:        null,
    }),
}));

export default useAppStore;