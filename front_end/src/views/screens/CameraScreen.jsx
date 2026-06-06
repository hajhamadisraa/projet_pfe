// src/views/screens/CameraScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import useAppStore from '../../controllers/context/AppStore';
import api from '../../models/services/apiService';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  LAYOUT, RADIUS, SHADOWS, SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// CONFIG — IPs du réseau local
// ─────────────────────────────────────────
const CONFIG = {
  // ESP32-CAM : flux MJPEG brut (sans IA)
  ESP_CAM_IP:  '192.168.1.53',

  // Raspberry Pi : backend Flask + API IA
  BACKEND_URL: 'http://192.168.1.112:5000',
  AI_URL:      'http://192.168.1.112:8000',
};

// URL du flux MJPEG brut de l'ESP32-CAM
// L'ESP32-CAM WebServer expose /stream sur le port 81 par défaut
const ESP_STREAM_URL = `http://${CONFIG.ESP_CAM_IP}:81/stream`;

// URL du flux IA : Raspberry Pi reçoit l'URL de l'ESP32 et renvoie le MJPEG annoté
// On encode l'URL de l'ESP32 pour la passer en query param
const AI_STREAM_URL = `${CONFIG.AI_URL}/video/stream?camera_url=${encodeURIComponent(ESP_STREAM_URL)}`;

// ─────────────────────────────────────────
// HTML injecté dans WebView pour afficher
// un flux MJPEG (img src= suffit pour MJPEG)
// ─────────────────────────────────────────
const getMjpegHtml = (streamUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    img#stream {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    #error {
      display: none;
      color: #ff4444;
      font-family: sans-serif;
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <img
    id="stream"
    src="${streamUrl}"
    onerror="document.getElementById('stream').style.display='none';
             document.getElementById('error').style.display='block';"
  />
  <div id="error">
    ❌ Impossible de charger le flux.<br/>
    Vérifiez que la caméra est connectée au même réseau WiFi.
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────
// 🧩 LIVE BADGE
// ─────────────────────────────────────────
const LiveBadge = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 BOUNDING BOX
// ─────────────────────────────────────────
const BoundingBox = ({ top, left, width, height, color }) => (
  <View style={[styles.boundingBox, { top, left, width, height, borderColor: color }]} />
);

// ─────────────────────────────────────────
// 🧩 ACTIVITY CHART
// ─────────────────────────────────────────
const ActivityChart = ({ data }) => {
  const maxH = 80;
  return (
    <View style={styles.activityChart}>
      {data.map((item, index) => {
        const isHighest = item.height === Math.max(...data.map((d) => d.height));
        return (
          <View key={index} style={styles.activityBarCol}>
            <View style={[styles.activityBar, { height: maxH }]}>
              <View
                style={[
                  styles.activityBarFill,
                  {
                    height: (item.height / 100) * maxH,
                    backgroundColor: isHighest
                      ? COLORS.secondaryContainer + 'CC'
                      : COLORS.white20,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 BEHAVIOR ALERT CARD
// ─────────────────────────────────────────
const BehaviorAlertCard = ({ alert }) => {
  const isHigh     = alert.severity === 'high';
  const iconBg     = isHigh ? COLORS.secondary + '25' : COLORS.primary + '18';
  const iconColor  = isHigh ? COLORS.secondary : COLORS.primary;
  const badgeBg    = isHigh ? COLORS.secondary + '20' : COLORS.primary + '15';
  const badgeColor = isHigh ? COLORS.secondary : COLORS.primary;
  const badgeLabel = isHigh ? 'High' : 'Normal';

  return (
    <View style={styles.behaviorCard}>
      <View style={[styles.behaviorIconBox, { backgroundColor: iconBg }]}>
        <MaterialIcons name={alert.icon} size={22} color={iconColor} />
      </View>
      <View style={styles.behaviorInfo}>
        <Text style={styles.behaviorTitle}>{alert.title}</Text>
        <Text style={styles.behaviorDesc}>{alert.description}</Text>
      </View>
      <View style={[styles.behaviorBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.behaviorBadgeText, { color: badgeColor }]}>
          {badgeLabel}
        </Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 CAMERA SCREEN
// ─────────────────────────────────────────
const CameraScreen = ({ navigation }) => {
  const selectedCoop = useAppStore((s) => s.selectedCoop);

  // 'static' = image placeholder | 'raw' = ESP32 direct | 'ai' = Raspberry Pi IA
  const [viewMode, setViewMode]           = useState('static');
  const [activeTab, setActiveTab]         = useState('live');
  const [chickenCount, setChickenCount]   = useState(0);
  const [abnormalCount, setAbnormalCount] = useState(0);
  const [predatorAlert, setPredatorAlert] = useState(false);
  const [brightness, setBrightness]       = useState(null);
  const [lightCommand, setLightCommand]   = useState(null);
  const [confidence, setConfidence]       = useState(0);
  const [loading, setLoading]             = useState(false);
  const [history, setHistory]             = useState([]);
  const [streamError, setStreamError]     = useState(false);

  const activityData = [
    { height: 40 }, { height: 65 }, { height: 50 },
    { height: 80 }, { height: 60 }, { height: 90 },
    { height: 70 }, { height: 55 }, { height: 75 },
    { height: 85 }, { height: 60 }, { height: 45 },
  ];

  useEffect(() => {
    loadCurrentData();
    loadHistory();
    const interval = setInterval(loadCurrentData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentData = async () => {
    try {
      const data = await api.get('/chicken/current');
      if (data) {
        setChickenCount(data.chicken_count   || 0);
        setAbnormalCount(data.abnormal_count || 0);
        setPredatorAlert(data.predator_alert || false);
        setBrightness(data.brightness        || null);
        setLightCommand(data.light_command   || null);
        if (data.chicken_count > 0) setConfidence(87);
      }
    } catch (err) {
      console.log('[Camera] Erreur chargement:', err.message);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.get('/chicken/history?limit=5&days=7');
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('[Camera] Erreur historique:', err.message);
    }
  };

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      const data = await api.post('/chicken/analyze');
      setChickenCount(data.chicken_count   || 0);
      setAbnormalCount(data.abnormal_count || 0);
      setPredatorAlert(data.predator_alert || false);
      setBrightness(data.brightness        || null);
      setLightCommand(data.light_command   || null);
      if (data.chicken_count > 0) setConfidence(87);
      loadHistory();
    } catch (err) {
      console.log('[Camera] Erreur analyse:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = chickenCount > 0
    ? `${Math.min((chickenCount / 20) * 100, 100)}%`
    : '0%';

  const cameraTabs = [
    { key: 'live',      label: 'Live',      icon: 'videocam'    },
    { key: 'heatmap',   label: 'Heatmap',   icon: 'thermostat'  },
    { key: 'analytics', label: 'Analytics', icon: 'query-stats' },
    { key: 'settings',  label: 'Settings',  icon: 'settings'    },
  ];

  // ── Sélectionner l'URL et le label selon le mode
  const streamUrl  = viewMode === 'ai' ? AI_STREAM_URL : ESP_STREAM_URL;
  const isStreaming = viewMode === 'raw' || viewMode === 'ai';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <MaterialIcons name="grid-view" size={22} color={COLORS.white} />
          <Text style={styles.topBarTitle}>
            {selectedCoop?.name || 'Poulailler'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.analyzeBtn}
          onPress={triggerAnalysis}
          disabled={loading}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={loading ? 'hourglass-empty' : 'refresh'}
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Alerte prédateur */}
        {predatorAlert && (
          <View style={styles.predatorAlert}>
            <MaterialIcons name="warning" size={20} color={COLORS.white} />
            <Text style={styles.predatorAlertText}>
              🚨 ALERTE PRÉDATEUR DÉTECTÉ !
            </Text>
          </View>
        )}

        {/* ════════════════════════════════
            HERO : FEED CAMÉRA
        ════════════════════════════════ */}
        <View style={styles.cameraHero}>

          {/* ── Flux MJPEG via WebView (raw ESP32 ou AI Raspberry Pi) */}
          {isStreaming ? (
            <View style={{ flex: 1 }}>
              <WebView
                key={streamUrl}                       // force remount si URL change
                originWhitelist={['*']}
                source={{ html: getMjpegHtml(streamUrl) }}
                style={{ flex: 1, backgroundColor: '#000' }}
                scrollEnabled={false}
                javaScriptEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                // Permet les requêtes HTTP en clair (réseau local)
                mixedContentMode="always"
                onError={() => setStreamError(true)}
              />
              {/* Badge mode actif */}
              <View style={styles.cameraTopOverlay}>
                <LiveBadge />
                <View style={styles.aiCountingBadge}>
                  <Text style={styles.aiCountingText}>
                    {viewMode === 'ai' ? 'AI Stream : ACTIVE' : 'ESP32 Direct'}
                  </Text>
                </View>
              </View>
              {/* Toggle en bas */}
              <View style={styles.modeToggleWrapper}>
                <ModeToggle viewMode={viewMode} setViewMode={setViewMode} setStreamError={setStreamError} />
              </View>
            </View>
          ) : (
            /* ── Image placeholder avec bounding boxes simulées */
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800' }}
              style={styles.cameraFeed}
              imageStyle={styles.cameraFeedImage}
            >
              <View style={styles.overlayContainer}>
                <BoundingBox top="25%" left="33%" width={80} height={64} color={COLORS.emerald400} />
                <BoundingBox top="50%" left="52%" width={64} height={80} color={COLORS.secondary} />
                <BoundingBox top="60%" left="68%" width={72} height={60} color={COLORS.emerald400} />
              </View>
              <View style={styles.cameraTopOverlay}>
                <View style={styles.aiCountingBadge}>
                  <Text style={styles.aiCountingText}>PREVIEW</Text>
                </View>
              </View>
              <View style={styles.modeToggleWrapper}>
                <ModeToggle viewMode={viewMode} setViewMode={setViewMode} setStreamError={setStreamError} />
              </View>
            </ImageBackground>
          )}
        </View>

        {/* ════════════════════════════════
            BENTO : STATS
        ════════════════════════════════ */}
        <View style={styles.bentoGrid}>

          {/* Carte comptage */}
          <View style={styles.countCard}>
            <View style={styles.countCardHeader}>
              <Text style={styles.countCardLabel}>Poulets détectés</Text>
              <MaterialIcons name="analytics" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.countRow}>
              <Text style={styles.countValue}>{chickenCount}</Text>
              {abnormalCount > 0 && (
                <Text style={[styles.countTotal, { color: '#FF9800' }]}>
                  {' '}⚠️{abnormalCount}
                </Text>
              )}
            </View>
            <View style={styles.countProgressTrack}>
              <View style={[styles.countProgressFill, { width: progressWidth }]} />
            </View>
            <View style={styles.countFooter}>
              <Text style={styles.countConfidence}>
                Confiance IA : {confidence}%
              </Text>
              <Text style={[
                styles.countOptimal,
                { color: predatorAlert ? COLORS.error : COLORS.statusHealthy }
              ]}>
                {predatorAlert ? '🚨 Alerte' : '✅ Normal'}
              </Text>
            </View>
          </View>

          {/* Carte éclairage */}
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Éclairage</Text>
            <ActivityChart data={activityData} />
            <View style={styles.lightRow}>
              <MaterialIcons
                name={lightCommand === 'ON' ? 'lightbulb' : 'lightbulb-outline'}
                size={28}
                color={lightCommand === 'ON' ? '#FFD700' : COLORS.white60}
              />
              <View>
                <Text style={styles.lightCommand}>
                  {lightCommand || '---'}
                </Text>
                {brightness && (
                  <Text style={styles.lightBrightness}>
                    {brightness.toFixed(0)} lux
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════
            BEHAVIOR ALERTS
        ════════════════════════════════ */}
        <View style={styles.behaviorSection}>
          <Text style={styles.behaviorSectionTitle}>Behavior Alerts</Text>
          <View style={styles.behaviorList}>
            <BehaviorAlertCard alert={{
              id: 1,
              icon: predatorAlert ? 'warning' : 'security',
              title: predatorAlert ? 'Prédateur détecté !' : 'Aucun prédateur',
              description: predatorAlert
                ? 'Un animal dangereux a été détecté dans le poulailler !'
                : 'Le poulailler est sécurisé, aucune intrusion.',
              severity: predatorAlert ? 'high' : 'normal',
            }} />
            <BehaviorAlertCard alert={{
              id: 2,
              icon: abnormalCount > 0 ? 'sick' : 'favorite',
              title: abnormalCount > 0
                ? `${abnormalCount} poule(s) anormale(s)`
                : 'Toutes les poules sont normales',
              description: abnormalCount > 0
                ? "Vérifiez l'état de santé du troupeau immédiatement."
                : 'État de santé général excellent.',
              severity: abnormalCount > 0 ? 'high' : 'normal',
            }} />
          </View>
        </View>

        {/* ════════════════════════════════
            HISTORIQUE
        ════════════════════════════════ */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.behaviorSectionTitle}>Historique récent</Text>
            {history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <MaterialIcons name="history" size={16} color={COLORS.outline} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.historyCount}>
                    🐔 {item.chicken_count} normales
                    {item.abnormal_count > 0 ? ` · ⚠️ ${item.abnormal_count} anormales` : ''}
                    {item.predator_alert ? ' · 🚨 Prédateur' : ''}
                  </Text>
                </View>
                <Text style={styles.historyLight}>
                  💡 {item.light_command || '---'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ════════════════════════════════
          BOTTOM NAV CAMÉRA
      ════════════════════════════════ */}
      <View style={styles.cameraNav}>
        {cameraTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.cameraNavItem, isActive && styles.cameraNavItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? COLORS.secondary : COLORS.white60}
              />
              <Text style={[styles.cameraNavLabel, isActive && styles.cameraNavLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🧩 MODE TOGGLE — extrait pour clarté
// ─────────────────────────────────────────
const ModeToggle = ({ viewMode, setViewMode, setStreamError }) => (
  <View style={styles.modeToggle}>
    {[
      { key: 'static', label: 'Preview' },
      { key: 'raw',    label: 'Live Cam' },
      { key: 'ai',     label: 'AI Stream' },
    ].map(({ key, label }) => (
      <TouchableOpacity
        key={key}
        style={[styles.modeBtn, viewMode === key && styles.modeBtnActive]}
        onPress={() => { setViewMode(key); setStreamError(false); }}
        activeOpacity={0.8}
      >
        <Text style={[styles.modeBtnText, viewMode === key && styles.modeBtnTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: COLORS.emerald950,
    paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  topBarTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -0.3,
  },
  analyzeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.emerald800,
    alignItems: 'center', justifyContent: 'center',
  },

  predatorAlert: {
    backgroundColor: '#ff4444', flexDirection: 'row',
    alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.lg, margin: SPACING.lg, borderRadius: RADIUS.lg,
  },
  predatorAlertText: {
    color: COLORS.white, fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold, flex: 1,
  },

  scroll: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { paddingBottom: SPACING.xl },

  cameraHero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  cameraFeed: { flex: 1, width: '100%' },
  cameraFeedImage: { opacity: 0.82 },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  boundingBox: {
    position: 'absolute', borderWidth: 2, borderRadius: 2,
    shadowColor: COLORS.emerald400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6,
  },

  cameraTopOverlay: {
    position: 'absolute', top: SPACING.lg, left: SPACING.lg,
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(27, 67, 50, 0.7)',
    paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  liveBadgeText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  aiCountingBadge: {
    backgroundColor: 'rgba(27, 67, 50, 0.7)',
    paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  aiCountingText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  modeToggleWrapper: {
    position: 'absolute', bottom: SPACING.lg,
    left: 0, right: 0, alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 67, 50, 0.85)',
    borderRadius: RADIUS.lg, padding: 4,
  },
  modeBtn: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white60,
    textTransform: 'uppercase',
  },
  modeBtnTextActive: { color: COLORS.white },

  bentoGrid: {
    flexDirection: 'row', gap: SPACING.lg,
    padding: SPACING['2xl'], marginTop: -SPACING['2xl'], zIndex: 10,
  },

  countCard: {
    flex: 1, backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg, padding: SPACING.xl,
    gap: SPACING.sm, ...SHADOWS.sm,
  },
  countCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countCardLabel: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.outline,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  countRow: { flexDirection: 'row', alignItems: 'baseline' },
  countValue: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, letterSpacing: -1,
  },
  countTotal: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.outline,
  },
  countProgressTrack: {
    height: 6, backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.sm,
  },
  countProgressFill: {
    height: '100%', backgroundColor: COLORS.secondary, borderRadius: RADIUS.full,
  },
  countFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  countConfidence: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.outline, textTransform: 'uppercase',
  },
  countOptimal: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },

  activityCard: {
    flex: 1, backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg, padding: SPACING.xl,
    gap: SPACING.md, overflow: 'hidden', ...SHADOWS.sm,
  },
  activityTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white,
    textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8,
  },
  activityChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flex: 1 },
  activityBarCol: { flex: 1, alignItems: 'center' },
  activityBar: { width: '100%', justifyContent: 'flex-end' },
  activityBarFill: { width: '100%', borderRadius: 2 },
  lightRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginTop: SPACING.sm,
  },
  lightCommand: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white,
  },
  lightBrightness: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.white60 },

  behaviorSection: { paddingHorizontal: SPACING['2xl'], gap: SPACING.lg },
  behaviorSectionTitle: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.outline,
    textTransform: 'uppercase', letterSpacing: 3,
  },
  behaviorList: { gap: SPACING.md },
  behaviorCard: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg,
    padding: SPACING.lg, flexDirection: 'row',
    alignItems: 'center', gap: SPACING.lg, ...SHADOWS.sm,
  },
  behaviorIconBox: {
    width: 48, height: 48, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  behaviorInfo: { flex: 1 },
  behaviorTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, marginBottom: 2,
  },
  behaviorDesc: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    color: COLORS.outlineVariant, fontWeight: FONT_WEIGHTS.medium, lineHeight: 16,
  },
  behaviorBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  behaviorBadgeText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  historySection: {
    paddingHorizontal: SPACING['2xl'], gap: SPACING.md, marginTop: SPACING.xl,
  },
  historyItem: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg,
    padding: SPACING.lg, flexDirection: 'row',
    alignItems: 'center', gap: SPACING.md, ...SHADOWS.sm,
  },
  historyInfo: { flex: 1 },
  historyTime: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.outline },
  historyCount: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2,
  },
  historyLight: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.outline },

  cameraNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING['2xl'] : SPACING.lg,
    backgroundColor: 'rgba(27, 67, 50, 0.92)',
    borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'],
    ...SHADOWS.lg,
  },
  cameraNavItem: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, gap: 3,
  },
  cameraNavItemActive: { backgroundColor: COLORS.emerald900 + '60' },
  cameraNavLabel: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white60,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  cameraNavLabelActive: { color: COLORS.secondary },
});

export default CameraScreen;