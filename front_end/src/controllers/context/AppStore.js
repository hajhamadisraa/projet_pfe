// src/controllers/context/AppStore.js
import { create } from 'zustand';
import storageHelper from '../../models/storage/storageHelper';
import { API } from '../../models/utils/constants';
import {
  MOCK_ALERTS,
  MOCK_COOPS,
  MOCK_FARM,
  MOCK_SENSORS
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

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  login: async (userData, token) => {
    await storageHelper.saveUser(userData);
    await storageHelper.saveToken(token);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: async () => {
    await storageHelper.clearAuth();
    await storageHelper.removeSelectedCoop();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      selectedCoop: null,
      sensors: null,
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
  coops: [],
  selectedCoop: null,
  coopsLoading: false,
  coopsError: null,

  setCoops: (coops) => set({ coops }),
  setSelectedCoop: async (coop) => {
    await storageHelper.saveSelectedCoop(coop);
    set({ selectedCoop: coop });
  },
  setCoopsLoading: (loading) => set({ coopsLoading: loading }),
  setCoopsError: (error) => set({ coopsError: error }),

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
  alerts: [],
  unreadAlertsCount: 0,
  alertsLoading: false,

  setAlerts: (alerts) => {
    const unread = alerts.filter((a) => !a.read).length;
    set({ alerts, unreadAlertsCount: unread });
  },
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadAlertsCount: state.unreadAlertsCount + 1,
    })),
  dismissAlert: (alertId) =>
    set((state) => {
      const updated = state.alerts.filter((a) => a.id !== alertId);
      return { alerts: updated, unreadAlertsCount: updated.filter((a) => !a.read).length };
    }),
  markAlertRead: (alertId) =>
    set((state) => {
      const updated = state.alerts.map((a) => a.id === alertId ? { ...a, read: true } : a);
      return { alerts: updated, unreadAlertsCount: updated.filter((a) => !a.read).length };
    }),
  markAllAlertsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadAlertsCount: 0,
    })),
  setAlertsLoading: (loading) => set({ alertsLoading: loading }),

  // ───────────────────────────────────────
  // 🔔 PARAMÈTRES NOTIFICATIONS
  // ───────────────────────────────────────
  notificationSettings: {
    emergencyOverride: true,
    security: true,
    health: true,
    environment: false,
    system: true,
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
  equipment: [],
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
        security: true,
        health: true,
        environment: false,
        system: true,
      };
      const theme = stored.theme || 'light';

      if (API.USE_MOCK) {
        set({
          // ✅ FIX : isAuthenticated: false → passe par LoginScreen
          // Les données mock sont prêtes, mais l'utilisateur doit se connecter
          user: null,
          token: null,
          isAuthenticated: false,
          farm: MOCK_FARM,
          coops: MOCK_COOPS,
          selectedCoop: stored.selectedCoop || MOCK_COOPS[0],
          sensors: MOCK_SENSORS,
          alerts: MOCK_ALERTS,
          unreadAlertsCount: MOCK_ALERTS.filter((a) => !a.read).length,
          notificationSettings,
          theme,
          isAppReady: true,
        });
        return;
      }

      // Production — restaure uniquement ce qui est persisté
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: !!stored.token,
        selectedCoop: stored.selectedCoop,
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
      user: null,
      token: null,
      isAuthenticated: false,
      farm: null,
      coops: [],
      selectedCoop: null,
      sensors: null,
      alerts: [],
      unreadAlertsCount: 0,
      equipment: [],
      coopsLoading: false,
      coopsError: null,
    }),
}));

export default useAppStore;