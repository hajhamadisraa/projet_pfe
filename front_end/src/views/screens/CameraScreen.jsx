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
import useAppStore from '../../controllers/context/AppStore';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  LAYOUT,
  RADIUS, SHADOWS,
  SPACING,
} from '../../models/utils/constants';
import { MOCK_CAMERA } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 LIVE BADGE (pastille rouge animée)
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
// 🧩 BOUNDING BOX IA (overlay caméra)
// ─────────────────────────────────────────
const BoundingBox = ({ top, left, width, height, color }) => (
  <View
    style={[
      styles.boundingBox,
      { top, left, width, height, borderColor: color },
    ]}
  />
);

// ─────────────────────────────────────────
// 🧩 ACTIVITY BAR CHART
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
  const isHigh   = alert.severity === 'high';
  const iconBg   = isHigh ? COLORS.secondary + '25' : COLORS.primary + '18';
  const iconColor= isHigh ? COLORS.secondary : COLORS.primary;
  const badgeBg  = isHigh ? COLORS.secondary + '20' : COLORS.primary + '15';
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
  const camera       = MOCK_CAMERA;

  const [viewMode, setViewMode] = useState('live'); // 'live' | 'heatmap'
  const [activeTab, setActiveTab] = useState('live');

  // Progress barre comptage
  const progressWidth = `${(camera.detected / camera.total) * 100}%`;

  // Tabs de la bottom nav caméra
  const cameraTabs = [
    { key: 'live',      label: 'Live',      icon: 'videocam' },
    { key: 'heatmap',   label: 'Heatmap',   icon: 'thermostat' },
    { key: 'analytics', label: 'Analytics', icon: 'query-stats' },
    { key: 'settings',  label: 'Settings',  icon: 'settings' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <MaterialIcons name="grid-view" size={22} color={COLORS.white} />
          <Text style={styles.topBarTitle}>
            {selectedCoop?.name || camera.coopName}
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarWrapper} activeOpacity={0.8}>
          <View style={styles.avatarFallback}>
            <MaterialIcons name="person" size={18} color={COLORS.emerald400} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ════════════════════════════════
            HERO : FEED CAMÉRA
        ════════════════════════════════ */}
        <View style={styles.cameraHero}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800' }}
            style={styles.cameraFeed}
            imageStyle={styles.cameraFeedImage}
          >
            {/* ── Bounding boxes IA */}
            <View style={styles.overlayContainer}>
              <BoundingBox
                top="25%" left="33%"
                width={80} height={64}
                color={COLORS.emerald400}
              />
              <BoundingBox
                top="50%" left="52%"
                width={64} height={80}
                color={COLORS.secondary}
              />
              <BoundingBox
                top="60%" left="68%"
                width={72} height={60}
                color={COLORS.emerald400}
              />
            </View>

            {/* ── Badges haut */}
            <View style={styles.cameraTopOverlay}>
              <LiveBadge />
              <View style={styles.aiCountingBadge}>
                <Text style={styles.aiCountingText}>AI Counting: ACTIVE</Text>
              </View>
            </View>

            {/* ── Toggle mode bas */}
            <View style={styles.modeToggleWrapper}>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    viewMode === 'live' && styles.modeBtnActive,
                  ]}
                  onPress={() => setViewMode('live')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.modeBtnText,
                    viewMode === 'live' && styles.modeBtnTextActive,
                  ]}>
                    Live Feed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    viewMode === 'heatmap' && styles.modeBtnActive,
                  ]}
                  onPress={() => setViewMode('heatmap')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.modeBtnText,
                    viewMode === 'heatmap' && styles.modeBtnTextActive,
                  ]}>
                    Heatmap
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ════════════════════════════════
            BENTO : STATS + ACTIVITÉ
        ════════════════════════════════ */}
        <View style={styles.bentoGrid}>

          {/* ── Carte comptage */}
          <View style={styles.countCard}>
            <View style={styles.countCardHeader}>
              <Text style={styles.countCardLabel}>Poulets détectés</Text>
              <MaterialIcons name="analytics" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.countRow}>
              <Text style={styles.countValue}>{camera.detected}</Text>
              <Text style={styles.countTotal}> / {camera.total}</Text>
            </View>
            {/* Barre progression */}
            <View style={styles.countProgressTrack}>
              <View style={[styles.countProgressFill, { width: progressWidth }]} />
            </View>
            <View style={styles.countFooter}>
              <Text style={styles.countConfidence}>
                Confiance IA : {camera.confidence}%
              </Text>
              <Text style={styles.countOptimal}>Optimal</Text>
            </View>
          </View>

          {/* ── Carte activité 24h */}
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Activité (24h)</Text>
            <ActivityChart data={camera.activityData} />
            <View style={styles.activityFooter}>
              <Text style={styles.activityTimeStart}>06:00</Text>
              <Text style={styles.activityTimeEnd}>MAINTENANT</Text>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════
            BEHAVIOR ALERTS
        ════════════════════════════════ */}
        <View style={styles.behaviorSection}>
          <Text style={styles.behaviorSectionTitle}>Behavior Alerts</Text>
          <View style={styles.behaviorList}>
            {camera.behaviorAlerts.map((alert) => (
              <BehaviorAlertCard key={alert.id} alert={alert} />
            ))}
          </View>
        </View>

        {/* Espace bottom nav caméra */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ════════════════════════════════
          BOTTOM NAV CAMÉRA (spécifique)
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
              <Text style={[
                styles.cameraNavLabel,
                isActive && styles.cameraNavLabelActive,
              ]}>
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
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  // ── Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.emerald950,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.emerald800,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { paddingBottom: SPACING.xl },

  // ── Camera Hero
  cameraHero: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.primary,
  },
  cameraFeed: {
    flex: 1,
    width: '100%',
  },
  cameraFeedImage: {
    opacity: 0.82,
  },

  // Overlay bounding boxes
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 2,
    // Ombre colorée simulée
    shadowColor: COLORS.emerald400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },

  // Badges haut caméra
  cameraTopOverlay: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(27, 67, 50, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  liveBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  aiCountingBadge: {
    backgroundColor: 'rgba(27, 67, 50, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  aiCountingText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Toggle mode
  modeToggleWrapper: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 67, 50, 0.75)',
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  modeBtn: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white60,
    textTransform: 'uppercase',
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },

  // ── Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    gap: SPACING.lg,
    padding: SPACING['2xl'],
    marginTop: -SPACING['2xl'],
    zIndex: 10,
  },

  // Carte comptage
  countCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  countCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countCardLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.outline,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  countTotal: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.outline,
  },
  countProgressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  countProgressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
  },
  countFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countConfidence: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.outline,
    textTransform: 'uppercase',
  },
  countOptimal: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.statusHealthy,
  },

  // Carte activité
  activityCard: {
    flex: 1,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  activityTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  activityChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
  },
  activityBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  activityBar: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  activityBarFill: {
    width: '100%',
    borderRadius: 2,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityTimeStart: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white60,
  },
  activityTimeEnd: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white60,
  },

  // ── Behavior Alerts
  behaviorSection: {
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.lg,
  },
  behaviorSectionTitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.outline,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  behaviorList: {
    gap: SPACING.md,
  },
  behaviorCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },
  behaviorIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  behaviorInfo: {
    flex: 1,
  },
  behaviorTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  behaviorDesc: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.outlineVariant,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 16,
  },
  behaviorBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  behaviorBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Bottom Nav Caméra
  cameraNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING['2xl'] : SPACING.lg,
    backgroundColor: 'rgba(27, 67, 50, 0.92)',
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    ...SHADOWS.lg,
  },
  cameraNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  cameraNavItemActive: {
    backgroundColor: COLORS.emerald900 + '60',
  },
  cameraNavLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white60,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cameraNavLabelActive: {
    color: COLORS.secondary,
  },
});

export default CameraScreen;