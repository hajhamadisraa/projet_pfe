// src/models/utils/mockData.js
import { ALERT_CATEGORIES, ALERT_SEVERITY, COOP_STATUS, EQUIPMENT_MODE } from './constants';

// ─────────────────────────────────────────
// 👤 COMPTES TEST
// admin@poulia.com   / password → Administrateur
// eleveur@poulia.com / password → Éleveur
// ─────────────────────────────────────────
export const MOCK_ADMIN = {
  id:           'admin-1',
  name:         'Jean-Pierre Dupont',
  email:        'admin@poulia.com',
  role:         'Administrateur Régional',
  roleBadgeType:'ADMIN',
  subscription: 'Premium Enterprise',
  avatar:       'https://randomuser.me/api/portraits/men/32.jpg',
  cooperatives: [
    { id: 'c1', name: 'Coop Vallée Verte' },
    { id: 'c2', name: 'Sud-Est Avicole' },
    { id: 'c3', name: 'BioPlumes S.A.' },
  ],
};

export const MOCK_ELEVEUR = {
  id:           'eleveur-1',
  name:         'Marie Lefebvre',
  email:        'eleveur@poulia.com',
  role:         'Opérateur',
  roleBadgeType:'OPERATOR',
  subscription: 'Standard',
  avatar:       'https://randomuser.me/api/portraits/women/44.jpg',
  // Coops assignés à cet éleveur uniquement
  assignedCoops: ['coop1', 'coop3'],
  cooperatives: [{ id: 'c1', name: 'Coop Vallée Verte' }],
};

// Utilisateur par défaut (admin)
export const MOCK_USER = MOCK_ADMIN;

// ─────────────────────────────────────────
// 🏠 FERME
// ─────────────────────────────────────────
export const MOCK_FARM = {
  id:              'f1',
  name:            'PoulIA Green Farm',
  location:        'Normandie, France',
  totalPopulation: 12450,
  populationTrend: +2.4,
  totalCoops:      9,
  healthyCoops:    8,
  warningCoops:    1,
  criticalCoops:   0,
};

// ─────────────────────────────────────────
// 🐔 LISTE DES COOPS
// ─────────────────────────────────────────
export const MOCK_COOPS = [
  {
    id: 'coop1', name: 'Coop Delta-4', sector: 'Sector 01',
    status: COOP_STATUS.HEALTHY, population: 2500, mortality: 0.02,
    temperature: 24.5, humidity: 62, luminosity: 120, ventilation: 45,
    lastUpdated: '2 min ago',
  },
  {
    id: 'coop2', name: 'Coop Gamma-2', sector: 'Sector 02',
    status: COOP_STATUS.WARNING, population: 1820, mortality: 0.14,
    temperature: 28, humidity: 70, luminosity: 115, ventilation: 60,
    warningMessage: 'Critical: 28°C detected', lastUpdated: '5 min ago',
  },
  {
    id: 'coop3', name: 'Coop Sigma-9', sector: 'Sector 04',
    status: COOP_STATUS.HEALTHY, population: 3100, mortality: 0.01,
    temperature: 24.1, humidity: 60, luminosity: 118, ventilation: 42,
    lastUpdated: '1 min ago',
  },
  {
    id: 'coop4', name: 'Coop Alpha-01', sector: 'Sector 01',
    status: COOP_STATUS.HEALTHY, population: 2480, mortality: 0.03,
    temperature: 23.8, humidity: 61, luminosity: 122, ventilation: 48,
    lastUpdated: 'À l\'instant',
  },
  {
    id: 'coop5', name: 'Coop Beta-7', sector: 'Sector 03',
    status: COOP_STATUS.HEALTHY, population: 1950, mortality: 0.05,
    temperature: 25.0, humidity: 58, luminosity: 110, ventilation: 50,
    lastUpdated: '3 min ago',
  },
];

// ─────────────────────────────────────────
// 📡 CAPTEURS
// ─────────────────────────────────────────
export const MOCK_SENSORS = {
  temperature: { value: 28.5, unit: '°C', min: 22, max: 29, trend: 'up',   alert: true  },
  humidity:    { value: 62,   unit: '%',   min: 55, max: 65, trend: 'down', alert: false },
  luminosity:  { value: 120,  unit: 'lux', min: 0,  max: 150,trend: 'flat',alert: false },
  ventilation: { value: 45,   unit: '%',   min: 0,  max: 100,trend: 'up',  alert: false },
};

// ─────────────────────────────────────────
// 🌾 ALIMENTATION & ABREUVEMENT
// ─────────────────────────────────────────
export const MOCK_FEEDING = {
  distributed: 250, consumed: 210, remaining: 40, unit: 'kg',
  weeklyData: [
    { day: 'L', value: 200, height: 60 },
    { day: 'M', value: 220, height: 75 },
    { day: 'M', value: 240, height: 85 },
    { day: 'J', value: 250, height: 100 },
    { day: 'V', value: 0,   height: 30 },
    { day: 'S', value: 0,   height: 20 },
    { day: 'D', value: 0,   height: 10 },
  ],
  schedule: [
    { id: 'meal1', time: '08:00', label: 'Mélange Croissance', quantity: 50, unit: 'kg', status: 'done'    },
    { id: 'meal2', time: '12:00', label: 'Mélange Croissance', quantity: 50, unit: 'kg', status: 'done'    },
    { id: 'meal3', time: '18:00', label: 'Mélange Soir',       quantity: 50, unit: 'kg', status: 'pending' },
  ],
};

export const MOCK_HYDRATION = {
  tanks: [
    { id: 'tankA', name: 'Réservoir A', level: 75, status: 'normal', statusLabel: 'Normal' },
    { id: 'tankB', name: 'Réservoir B', level: 15, status: 'low',    statusLabel: 'Faible' },
  ],
  alertThreshold: 20,
  alertEnabled:   true,
};

// ─────────────────────────────────────────
// 🏥 SANTÉ
// ─────────────────────────────────────────
export const MOCK_HEALTH = {
  totalHeads: 12450, healthScore: 98, growthStability: +2.4,
  status: 'SANTÉ OPTIMALE', pathogenRisk: 'Négligeable',
  vaccinations: [
    { id: 'vac1', disease: 'Grippe Aviaire',        phase: 'Phase Terminale', status: 'done',     date: '12 Mars', borderColor: 'healthy' },
    { id: 'vac2', disease: 'Maladie de Newcastle',  phase: 'Rappel Prévu',    status: 'upcoming', date: '25 Avril',borderColor: 'warning' },
  ],
  treatments: [
    { id: 'tr1', name: 'Antibiotiques (Spectre Large)', icon: 'pill',       progress: 0.6, status: 'JOUR 3/5', statusType: 'warning' },
    { id: 'tr2', name: 'Supplément Vitaminé (H2O)',     icon: 'water-drop', progress: 0.8, status: 'EN COURS', statusType: 'healthy' },
  ],
  aiInsight: "L'humidité du Coop #04 a augmenté de 5%. Augmentez la ventilation pour prévenir les risques respiratoires.",
};

// ─────────────────────────────────────────
// ⚙️ ÉQUIPEMENTS
// ─────────────────────────────────────────
export const MOCK_EQUIPMENT = [
  { id: 'eq1', name: 'Ventilateurs', icon: 'air',        mode: EQUIPMENT_MODE.AUTO,   isOn: true  },
  { id: 'eq2', name: 'Pad Cooling',  icon: 'ac-unit',    mode: EQUIPMENT_MODE.MANUAL, isOn: false },
  { id: 'eq3', name: 'Éclairage',    icon: 'lightbulb',  mode: EQUIPMENT_MODE.AUTO,   isOn: true  },
  { id: 'eq4', name: 'Stores',       icon: 'blinds',     mode: EQUIPMENT_MODE.MANUAL, isOn: true  },
  { id: 'eq5', name: 'Chauffage',    icon: 'thermostat', mode: EQUIPMENT_MODE.ALERT,  isOn: false },
  { id: 'eq6', name: 'Abreuvoirs',   icon: 'water-drop', mode: EQUIPMENT_MODE.AUTO,   isOn: true  },
];

export const MOCK_DISTRIBUTORS = {
  nextCycle: '14h30', mode: EQUIPMENT_MODE.AUTO,
  units: [
    { id: 'd1', label: 'D1', active: true },
    { id: 'd2', label: 'D2', active: true },
    { id: 'd3', label: 'D3', active: true },
    { id: 'd4', label: '+2', active: false },
  ],
};

// ─────────────────────────────────────────
// 📹 CAMÉRA
// ─────────────────────────────────────────
export const MOCK_CAMERA = {
  coopName: 'Coop Alpha-01', isLive: true, aiCountingActive: true,
  detected: 248, total: 250, confidence: 96, mode: 'live',
  activityData: [
    { time: '06:00',     height: 40 }, { time: '09:00', height: 60 },
    { time: '12:00',     height: 30 }, { time: '15:00', height: 85 },
    { time: '18:00',     height: 55 }, { time: '21:00', height: 45 },
    { time: 'Maintenant',height: 70 },
  ],
  behaviorAlerts: [
    { id: 'ba1', title: 'Abnormal clustering in Zone B', description: 'Potential temperature fluctuation detected.', severity: 'high',   icon: 'warning', iconType: 'warning' },
    { id: 'ba2', title: 'Low mobility detected',         description: 'Zone D shows 15% lower activity than average.', severity: 'normal', icon: 'sensors', iconType: 'info' },
  ],
};

// ─────────────────────────────────────────
// 🔔 ALERTES
// ─────────────────────────────────────────
export const MOCK_ALERTS = [
  { id: 'al1', title: 'Critical Heat Stress',  location: 'Coop Delta-4', description: 'Internal temperature reached 34°C. Ventilation fans failing.', severity: ALERT_SEVERITY.CRITICAL, category: ALERT_CATEGORIES.ENVIRONMENT, timestamp: '2m ago',  read: false },
  { id: 'al2', title: 'Reduced Water Flow',    location: 'North Wing',   description: 'Water intake dropped by 15% in the last 2 hours.',            severity: ALERT_SEVERITY.WARNING,  category: ALERT_CATEGORIES.HEALTH,       timestamp: '14m ago', read: false },
  { id: 'al3', title: 'Daily Feed Report',     location: 'Main Silo',    description: 'Silo levels at 68%.',                                         severity: ALERT_SEVERITY.INFO,     category: ALERT_CATEGORIES.SYSTEM,       timestamp: '1h ago',  read: true  },
  { id: 'al4', title: 'Heater Malfunction',    location: 'Coop Beta-7',  description: 'Heating unit reported FAIL status.',                          severity: ALERT_SEVERITY.CRITICAL, category: ALERT_CATEGORIES.SYSTEM,       timestamp: '3h ago',  read: true  },
];

export const MOCK_NOTIFICATION_SETTINGS = {
  emergencyOverride: true, security: true, health: true, environment: false, system: true,
};

// ─────────────────────────────────────────
// 👥 UTILISATEURS (gestion admin)
// ─────────────────────────────────────────
export const MOCK_USERS = [
  { id: 'u1', name: 'Jean-Pierre Dupont', email: 'admin@poulia.com',   role: 'ADMIN',    roleBadgeType: 'ADMIN',    sector: null,              lastSeen: 'Dernière connexion: 2h', isOnline: true,  isActive: true  },
  { id: 'u2', name: 'Marie Lefebvre',    email: 'eleveur@poulia.com', role: 'OPÉRATEUR', roleBadgeType: 'OPERATOR', sector: 'Poulailler Secteur B', lastSeen: 'Secteur B',         isOnline: true,  isActive: true  },
  { id: 'u3', name: 'Antoine Dubois',    email: 'lecteur@poulia.com', role: 'LECTEUR',   roleBadgeType: 'READER',   sector: null,              lastSeen: 'Audit trimestriel',     isOnline: false, isActive: false },
  { id: 'u4', name: 'Sarah Bernard',     email: 'sarah@poulia.com',   role: 'ADMIN',     roleBadgeType: 'ADMIN',    sector: null,              lastSeen: 'Maintenance IA',        isOnline: true,  isActive: true  },
];

// ─────────────────────────────────────────
// 🗓️ EFFECTIF
// ─────────────────────────────────────────
export const MOCK_FLOCK = {
  total: 1247, unit: 'volailles', mortality: 0.8, coopLabel: 'ST',
};