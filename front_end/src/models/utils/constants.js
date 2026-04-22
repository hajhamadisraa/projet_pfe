// src/models/utils/constants.js

// ─────────────────────────────────────────
// 🎨 COULEURS
// ─────────────────────────────────────────
export const COLORS = {
  // Couleurs primaires (vert forêt)
  primary: '#012D1D',
  primaryDark: '#011A11',
  primaryLight: '#1B4332',
  primaryContainer: '#0A3D27',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#ECFDF5',

  // Couleurs secondaires (orange vif — actions, actif nav)
  secondary: '#FE6A34',
  secondaryDark: '#E5501A',
  secondaryLight: '#FF8A65',
  secondaryContainer: '#FF8A65',
  onSecondary: '#FFFFFF',

  // Surfaces et fonds
  surface: '#F8F9FA',
  surfaceContainer: '#F1F3F4',
  surfaceContainerLow: '#FFFFFF',
  surfaceContainerHigh: '#E8EAEB',
  surfaceContainerHighest: '#E0E3E4',

  // Textes
  onSurface: '#191C1D',
  onSurfaceVariant: '#44474F',
  onSurfaceLight: '#6B7280',

  // Bordures
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // États sémantiques
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onError: '#FFFFFF',
  onErrorContainer: '#410E0B',

  success: '#1B873A',
  successContainer: '#E6F4EA',
  onSuccess: '#FFFFFF',

  warning: '#F59E0B',
  warningContainer: '#FEF3C7',
  onWarning: '#FFFFFF',

  // Verts Emerald (palette étendue)
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald800: '#065F46',
  emerald900: '#022C22',
  emerald950: '#011A11',

  // Statuts coops
  statusHealthy: '#059669',
  statusHealthyBg: '#ECFDF5',
  statusWarning: '#FE6A34',
  statusWarningBg: '#FFF7ED',
  statusCritical: '#B3261E',
  statusCriticalBg: '#F9DEDC',

  // Transparences utiles
  overlay: 'rgba(1, 45, 29, 0.6)',
  overlayLight: 'rgba(1, 45, 29, 0.3)',
  white10: 'rgba(255, 255, 255, 0.10)',
  white20: 'rgba(255, 255, 255, 0.20)',
  white60: 'rgba(255, 255, 255, 0.60)',
  black20: 'rgba(0, 0, 0, 0.20)',
  black40: 'rgba(0, 0, 0, 0.40)',
  black80: 'rgba(0, 0, 0, 0.80)',

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

// ─────────────────────────────────────────
// 🔤 TYPOGRAPHIE
// ─────────────────────────────────────────
export const FONTS = {
  manrope: 'Manrope',
  manropeBold: 'Manrope-Bold',
  manropeExtraBold: 'Manrope-ExtraBold',
  inter: 'Inter',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

// ─────────────────────────────────────────
// 📐 ESPACEMENTS
// ─────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// ─────────────────────────────────────────
// 🔵 BORDER RADIUS
// ─────────────────────────────────────────
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ─────────────────────────────────────────
// 🌑 OMBRES
// ─────────────────────────────────────────
export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#012D1D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 12,
  },
  secondary: {
    shadowColor: '#FE6A34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─────────────────────────────────────────
// 📏 DIMENSIONS LAYOUT
// ─────────────────────────────────────────
export const LAYOUT = {
  topBarHeight: 64,
  bottomNavHeight: 80,
  bottomNavPaddingBottom: 24,
  fabSize: 56,
  fabBottom: 100,
  fabRight: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 56,
  avatarXl: 80,
  cardBorderWidth: 4,
  sensorCardHeight: 140,
  equipmentCardHeight: 176,
  tankWidth: 80,
  tankHeight: 128,
};

// ─────────────────────────────────────────
// 🌈 DÉGRADÉS (LinearGradient colors)
// ─────────────────────────────────────────
export const GRADIENTS = {
  primary: ['#012D1D', '#1B4332'],
  primaryReverse: ['#1B4332', '#012D1D'],
  darkOverlay: ['transparent', 'rgba(0,0,0,0.8)'],
  darkOverlayTop: ['rgba(0,0,0,0.6)', 'transparent'],
  emerald: ['#022C22', '#065F46'],
  orange: ['#FE6A34', '#FF8A65'],
};

// ─────────────────────────────────────────
// 📡 API CONFIGURATION
// ─────────────────────────────────────────
export const API = {
  BASE_URL: 'http://192.168.1.112:5000/api',
  TIMEOUT: 10000,
  USE_MOCK: true,              // ← mettre false quand le backend est prêt
};

// ─────────────────────────────────────────
// 🗺️ ROUTES DE NAVIGATION
// ─────────────────────────────────────────
export const ROUTES = {
  // Auth stack
  LOGIN: 'Login',
  REGISTER: 'Register',

  // Main tabs
  HOME: 'Home',
  COOPS: 'Coops',
  HEALTH: 'Health',
  ALERTS: 'Alerts',
  SETTINGS: 'Settings',

  // Stacks imbriqués
  COOP_LIST: 'CoopList',
  COOP_DETAIL: 'CoopDetail',
  FEEDING: 'Feeding',
  EQUIPMENT: 'Equipment',
  CAMERA: 'Camera',
  PROFILE: 'Profile',
  USER_MANAGEMENT: 'UserManagement',
};

// ─────────────────────────────────────────
// 📊 STATUTS COOPS
// ─────────────────────────────────────────
export const COOP_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

// ─────────────────────────────────────────
// 🔔 CATÉGORIES ALERTES
// ─────────────────────────────────────────
export const ALERT_CATEGORIES = {
  ALL: 'all',
  SECURITY: 'security',
  HEALTH: 'health',
  ENVIRONMENT: 'environment',
  SYSTEM: 'system',
};

export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
};

// ─────────────────────────────────────────
// ⚙️ MODES ÉQUIPEMENT
// ─────────────────────────────────────────
export const EQUIPMENT_MODE = {
  AUTO: 'AUTO',
  MANUAL: 'MANUEL',
  ALERT: 'ALERTE',
};

// ─────────────────────────────────────────
// 👤 RÔLES UTILISATEURS
// ─────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: 'Administrateur Régional',
  MANAGER: 'Gestionnaire de Ferme',
  ANALYST: 'Analyste de Données',
  TECHNICIAN: 'Technicien de Terrain',
  OPERATOR: 'Opérateur',
  READER: 'Lecteur',
};

// ─────────────────────────────────────────
// ⏱️ DURÉES ANIMATIONS (ms)
// ─────────────────────────────────────────
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  pulse: 1000,
};

// ─────────────────────────────────────────
// 🔑 CLÉS ASYNCSTORAGE
// ─────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: '@poulia_token',
  USER: '@poulia_user',
  SELECTED_COOP: '@poulia_selected_coop',
  NOTIFICATIONS_SETTINGS: '@poulia_notif_settings',
  THEME: '@poulia_theme',
};