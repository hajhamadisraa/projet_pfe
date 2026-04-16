// src/views/screens/HomeScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  ImageBackground,
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
  GRADIENTS,
  LAYOUT,
  RADIUS,
  ROUTES,
  SHADOWS,
  SPACING,
} from '../../models/utils/constants';
import { MOCK_FLOCK } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 SENSOR CARD
// ─────────────────────────────────────────
const SensorCard = ({ icon, label, value, unit, trend, alertActive }) => {
  const trendColor =
    alertActive    ? COLORS.error :
    trend === 'up' ? COLORS.error :
    trend === 'down' ? COLORS.statusHealthy : COLORS.outline;

  const trendIcon =
    trend === 'up'   ? 'trending-up' :
    trend === 'down' ? 'trending-down' : 'trending-flat';

  return (
    <View style={styles.sensorCard}>
      <View style={styles.sensorCardHeader}>
        <View style={styles.sensorIconBox}>
          <MaterialIcons name={icon} size={20} color={COLORS.primary} />
        </View>
        <MaterialIcons name={trendIcon} size={18} color={trendColor} />
      </View>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorValue}>
        {value}
        <Text style={styles.sensorUnit}> {unit}</Text>
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 HOME SCREEN
// ─────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const user         = useAppStore((s) => s.user);
  const farm         = useAppStore((s) => s.farm);
  const sensors      = useAppStore((s) => s.sensors);
  const selectedCoop = useAppStore((s) => s.selectedCoop);
  const unreadCount  = useAppStore((s) => s.unreadAlertsCount);

  const sensorItems = sensors ? [
    {
      id: 'temp', icon: 'thermostat', label: 'Température',
      value: sensors.temperature.value, unit: '°C',
      trend: sensors.temperature.trend, alertActive: sensors.temperature.alert,
    },
    {
      id: 'hum', icon: 'water-drop', label: 'Humidité',
      value: sensors.humidity.value, unit: '%',
      trend: sensors.humidity.trend, alertActive: false,
    },
    {
      id: 'lum', icon: 'wb-sunny', label: 'Luminosité',
      value: sensors.luminosity.value, unit: 'lux',
      trend: sensors.luminosity.trend, alertActive: false,
    },
    {
      id: 'vent', icon: 'air', label: 'Ventilation',
      value: sensors.ventilation.value, unit: '%',
      trend: sensors.ventilation.trend, alertActive: false,
    },
  ] : [];

  // ── Navigations correctes depuis un Stack imbriqué dans un Tab
  const goToProfile      = () => navigation.navigate(ROUTES.PROFILE);
  const goToAlerts       = () => navigation.getParent()?.navigate(ROUTES.ALERTS);
  const goToHealth       = () => navigation.getParent()?.navigate(ROUTES.HEALTH);
  const goToCamera       = () => navigation.navigate(ROUTES.CAMERA);
  const goToFeeding      = () => navigation.navigate(ROUTES.FEEDING);
  const goToUserMgmt     = () => navigation.navigate(ROUTES.USER_MANAGEMENT);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={goToProfile}
            activeOpacity={0.8}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>PoulIA</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={goToAlerts}
          activeOpacity={0.8}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nom ferme + sélecteur coop */}
        <View style={styles.farmHeader}>
          <View>
            <Text style={styles.farmLabel}>Estate Dashboard</Text>
            <Text style={styles.farmName}>{farm?.name || 'PoulIA Green Farm'}</Text>
          </View>
          <TouchableOpacity style={styles.coopSelector} activeOpacity={0.8}>
            <MaterialIcons name="location-on" size={14} color={COLORS.primary} />
            <Text style={styles.coopSelectorText}>
              {selectedCoop?.name?.split('-')[1]?.trim() || 'Delta-4'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color={COLORS.outline} />
          </TouchableOpacity>
        </View>

        {/* ── Carte Population */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.populationCard}
        >
          <View style={styles.populationHeader}>
            <MaterialIcons name="analytics" size={14} color={COLORS.white60} />
            <Text style={styles.populationHeaderText}>Population Overview</Text>
          </View>
          <View style={styles.populationRow}>
            <Text style={styles.populationCount}>
              {farm?.totalPopulation?.toLocaleString('fr-FR') || '12,450'}
            </Text>
            <View style={styles.populationTrend}>
              <MaterialIcons name="trending-up" size={14} color={COLORS.emerald400} />
              <Text style={styles.populationTrendText}>
                +{farm?.populationTrend || 2.4}%
              </Text>
            </View>
          </View>
          <View style={styles.populationFooter}>
            <Text style={styles.populationFooterLabel}>Total Chickens Count</Text>
            <MaterialIcons name="monitoring" size={20} color={COLORS.emerald400} style={{ opacity: 0.5 }} />
          </View>
          <View style={styles.populationDeco} />
        </LinearGradient>

        {/* ── Grille capteurs 2×2 */}
        <View style={styles.sensorGrid}>
          {sensorItems.map((s) => (
            <SensorCard key={s.id} {...s} />
          ))}
        </View>

        {/* ── Raccourcis rapides */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={goToFeeding}
            activeOpacity={0.8}
          >
            <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
            <Text style={styles.shortcutLabel}>Alimentation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={goToCamera}
            activeOpacity={0.8}
          >
            <MaterialIcons name="videocam" size={20} color={COLORS.primary} />
            <Text style={styles.shortcutLabel}>Caméra IA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={goToUserMgmt}
            activeOpacity={0.8}
          >
            <MaterialIcons name="group" size={20} color={COLORS.primary} />
            <Text style={styles.shortcutLabel}>Équipe</Text>
          </TouchableOpacity>
        </View>

        {/* ── Carte Effectif */}
        <TouchableOpacity
          style={styles.flockCard}
          activeOpacity={0.85}
          onPress={goToHealth}
        >
          <View style={styles.flockLeft}>
            <View style={styles.flockAvatar}>
              <Text style={styles.flockAvatarText}>{MOCK_FLOCK.coopLabel}</Text>
            </View>
            <View>
              <Text style={styles.flockTitle}>Effectif</Text>
              <View style={styles.flockCountRow}>
                <Text style={styles.flockCount}>
                  {MOCK_FLOCK.total.toLocaleString('fr-FR')}
                </Text>
                <Text style={styles.flockUnit}> {MOCK_FLOCK.unit}</Text>
              </View>
            </View>
          </View>
          <View style={styles.flockRight}>
            <View>
              <Text style={styles.flockMortalityLabel}>Mortalité :</Text>
              <Text style={styles.flockMortalityValue}>{MOCK_FLOCK.mortality}%</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.outline} />
          </View>
          <View style={styles.flockDeco} />
        </TouchableOpacity>

        {/* ── Carte Alertes IA */}
        <TouchableOpacity activeOpacity={0.85} onPress={goToAlerts}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.alertsCard}
          >
            <View style={styles.alertsLeft}>
              <View style={styles.alertsIconBox}>
                <MaterialIcons name="smart-toy" size={24} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.alertsTitle}>Alertes actives</Text>
                <View style={styles.alertsSubRow}>
                  <Text style={styles.alertsSubText}>{unreadCount} alertes IA</Text>
                  {unreadCount > 0 && (
                    <View style={styles.alertsBadge}>
                      <Text style={styles.alertsBadgeText}>NOUVEAU</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Live Feed */}
        <TouchableOpacity
          style={styles.liveFeedWrapper}
          activeOpacity={0.9}
          onPress={goToCamera}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800' }}
            style={styles.liveFeed}
            imageStyle={styles.liveFeedImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.liveFeedOverlay}
            >
              <Text style={styles.liveFeedLabel}>Live Feed</Text>
              <Text style={styles.liveFeedTitle}>Automated Area 04</Text>
              <View style={styles.liveFeedSubRow}>
                <MaterialIcons name="videocam" size={14} color={COLORS.secondary} />
                <Text style={styles.liveFeedSubText}>
                  Streaming en 4K — AI tracking active
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarWrapper: {
    width: LAYOUT.avatarMd,
    height: LAYOUT.avatarMd,
    borderRadius: LAYOUT.avatarMd / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.white10,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  notifBtn: {
    position: 'relative',
    padding: SPACING.xs,
  },
  notifBadge: {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 16, height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.lg,
  },

  // ── Farm header
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  farmName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  coopSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '50',
  },
  coopSelectorText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },

  // ── Population Card
  populationCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    overflow: 'hidden',
  },
  populationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  populationHeaderText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  populationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    marginBottom: SPACING['3xl'],
  },
  populationCount: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['6xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -2,
    lineHeight: 56,
  },
  populationTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: SPACING.sm,
  },
  populationTrendText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.emerald400,
  },
  populationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  populationFooterLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white60,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  populationDeco: {
    position: 'absolute',
    right: -48, bottom: -48,
    width: 192, height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(52,211,153,0.08)',
  },

  // ── Sensor Grid
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  sensorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
  },
  sensorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  sensorIconBox: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.sm,
  },
  sensorLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sensorValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },
  sensorUnit: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },

  // ── Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
    ...SHADOWS.sm,
  },
  shortcutLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },

  // ── Flock Card
  flockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '30',
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  flockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  flockAvatar: {
    width: LAYOUT.avatarLg,
    height: LAYOUT.avatarLg,
    borderRadius: LAYOUT.avatarLg / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  flockAvatarText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  flockTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  flockCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  flockCount: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },
  flockUnit: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },
  flockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  flockMortalityLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flockMortalityValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.error,
  },
  flockDeco: {
    position: 'absolute',
    right: -16, top: -16,
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainerHigh,
    opacity: 0.5,
  },

  // ── Alerts Card
  alertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  alertsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  alertsIconBox: {
    width: 48, height: 48,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.secondary,
  },
  alertsTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  alertsSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  alertsSubText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white60,
  },
  alertsBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 3,
  },
  alertsBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // ── Live Feed
  liveFeedWrapper: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  liveFeed: {
    height: 200,
    width: '100%',
  },
  liveFeedImage: {
    borderRadius: RADIUS['2xl'],
  },
  liveFeedOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING['2xl'],
  },
  liveFeedLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.emerald400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  liveFeedTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  liveFeedSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveFeedSubText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white60,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default HomeScreen;