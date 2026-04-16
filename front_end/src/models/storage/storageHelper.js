// src/models/storage/storageHelper.js
// ⚠️ Import corrigé — on importe le module directement, pas via .default
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// ─────────────────────────────────────────
// 🔧 OPÉRATIONS DE BASE
// ─────────────────────────────────────────

const set = async (key, value) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[Storage] Erreur set("${key}"):`, error);
    return false;
  }
};

const get = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    try { return JSON.parse(value); } catch { return value; }
  } catch (error) {
    console.error(`[Storage] Erreur get("${key}"):`, error);
    return null;
  }
};

const remove = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Erreur remove("${key}"):`, error);
    return false;
  }
};

const has = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    console.error(`[Storage] Erreur has("${key}"):`, error);
    return false;
  }
};

const clear = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Erreur clear():', error);
    return false;
  }
};

const removeMultiple = async (keys) => {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('[Storage] Erreur removeMultiple():', error);
    return false;
  }
};

// ─────────────────────────────────────────
// 🔑 AUTHENTIFICATION
// ─────────────────────────────────────────

const saveToken   = (token) => set(STORAGE_KEYS.TOKEN, token);
const getToken    = ()      => get(STORAGE_KEYS.TOKEN);
const removeToken = ()      => remove(STORAGE_KEYS.TOKEN);
const saveUser    = (user)  => set(STORAGE_KEYS.USER, user);
const getUser     = ()      => get(STORAGE_KEYS.USER);
const removeUser  = ()      => remove(STORAGE_KEYS.USER);
const clearAuth   = ()      => removeMultiple([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
const isAuthenticated = ()  => has(STORAGE_KEYS.TOKEN);

// ─────────────────────────────────────────
// 🏠 COOP SÉLECTIONNÉ
// ─────────────────────────────────────────

const saveSelectedCoop   = (coop) => set(STORAGE_KEYS.SELECTED_COOP, coop);
const getSelectedCoop    = ()     => get(STORAGE_KEYS.SELECTED_COOP);
const removeSelectedCoop = ()     => remove(STORAGE_KEYS.SELECTED_COOP);

// ─────────────────────────────────────────
// 🔔 NOTIFICATIONS
// ─────────────────────────────────────────

const saveNotificationSettings = (s) => set(STORAGE_KEYS.NOTIFICATIONS_SETTINGS, s);
const getNotificationSettings  = ()  => get(STORAGE_KEYS.NOTIFICATIONS_SETTINGS);

// ─────────────────────────────────────────
// 🎨 THÈME
// ─────────────────────────────────────────

const saveTheme = (theme) => set(STORAGE_KEYS.THEME, theme);
const getTheme  = ()      => get(STORAGE_KEYS.THEME);

// ─────────────────────────────────────────
// 🚀 INITIALISATION AU DÉMARRAGE
// ─────────────────────────────────────────

/**
 * Charge toutes les données persistées en une seule passe.
 * Retourne : { token, user, selectedCoop, notificationSettings, theme }
 *
 * FIX : multiGet retourne un tableau de paires [key, value].
 * On destructure proprement pour éviter l'erreur "multiGet is not a function"
 * qui survenait quand AsyncStorage était importé via .default.
 */
const loadAppData = async () => {
  try {
    const pairs = await AsyncStorage.multiGet([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SELECTED_COOP,
      STORAGE_KEYS.NOTIFICATIONS_SETTINGS,
      STORAGE_KEYS.THEME,
    ]);

    const parse = ([, value]) => {
      if (!value) return null;
      try { return JSON.parse(value); } catch { return value; }
    };

    const [tokenPair, userPair, coopPair, notifPair, themePair] = pairs;

    return {
      token:                tokenPair[1] || null,
      user:                 parse(userPair),
      selectedCoop:         parse(coopPair),
      notificationSettings: parse(notifPair),
      theme:                themePair[1] || 'light',
    };
  } catch (error) {
    console.error('[Storage] Erreur loadAppData():', error);
    return { token: null, user: null, selectedCoop: null, notificationSettings: null, theme: 'light' };
  }
};

// ─────────────────────────────────────────
// 📤 EXPORT
// ─────────────────────────────────────────

const storageHelper = {
  set, get, remove, has, clear, removeMultiple,
  saveToken, getToken, removeToken,
  saveUser, getUser, removeUser,
  clearAuth, isAuthenticated,
  saveSelectedCoop, getSelectedCoop, removeSelectedCoop,
  saveNotificationSettings, getNotificationSettings,
  saveTheme, getTheme,
  loadAppData,
};

export default storageHelper;