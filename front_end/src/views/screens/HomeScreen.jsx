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
import useRealtimeSensors from '../../controllers/hooks/useRealtimeSensors'; // ✅ NOUVEAU
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS, LAYOUT, RADIUS, ROUTES, SHADOWS, SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 SENSOR CARD
// ─────────────────────────────────────────
const SensorCard = ({ icon, label, value, unit, trend, alertActive }) => {
  const trendColor =
    alertActive      ? COLORS.error :
    trend === 'up'   ? COLORS.error :
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
// 🧩 WATER LEVEL CARD
// ─────────────────────────────────────────
const WaterLevelCard = ({
  level = 72, capacity = 5000,
  dailyConsumption = 320, lastRefill = '3 jours',
}) => {
  const currentVolume = Math.round((level / 100) * capacity);
  const autonomyDays  = Math.round(currentVolume / dailyConsumption);
  const isLow         = level < 30;
  const isWarn        = level < 50;

  const barColor   = isLow ? COLORS.error : isWarn ? COLORS.secondary : '#378ADD';
  const badgeLabel = isLow ? 'Critique' : isWarn ? 'Bas' : 'Optimal';
  const badgeBg    = isLow ? '#FCEBEB' : isWarn ? COLORS.statusWarningBg : COLORS.statusHealthyBg;
  const badgeColor = isLow ? COLORS.error : isWarn ? COLORS.secondary : COLORS.statusHealthy;

  return (
    <View style={styles.waterCard}>
      <View style={styles.waterCardHeader}>
        <View style={styles.waterTitleRow}>
          <View style={[styles.sensorIconBox, { backgroundColor: '#E6F1FB' }]}>
            <MaterialIcons name="water" size={18} color="#378ADD" />
          </View>
          <Text style={styles.waterTitle}>Réservoir principal</Text>
        </View>
        <View style={[styles.coopStatusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.coopStatusText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>
      <View style={styles.waterValueRow}>
        <Text style={styles.waterValue}>{level}</Text>
        <Text style={styles.waterUnit}>% — {currentVolume.toLocaleString('fr-FR')} L</Text>
      </View>
      <View style={styles.waterBarTrack}>
        <View style={[styles.waterBarFill, { width: `${level}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.waterBarLabels}>
        <Text style={styles.waterBarLabel}>0%</Text>
        <Text style={[styles.waterBarLabel, { color: barColor, fontWeight: FONT_WEIGHTS.bold }]}>{level}%</Text>
        <Text style={styles.waterBarLabel}>100%</Text>
      </View>
      <View style={styles.waterDivider} />
      <View style={styles.waterFooter}>
        <View style={styles.waterStat}>
          <Text style={styles.waterStatLabel}>Conso / jour</Text>
          <Text style={styles.waterStatValue}>~{dailyConsumption} L</Text>
        </View>
        <View style={styles.waterStat}>
          <Text style={styles.waterStatLabel}>Autonomie</Text>
          <Text style={styles.waterStatValue}>~{autonomyDays} jours</Text>
        </View>
        <View style={styles.waterStat}>
          <Text style={styles.waterStatLabel}>Remplissage</Text>
          <Text style={styles.waterStatValue}>il y a {lastRefill}</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 ENVIRONMENTAL OVERVIEW CARD
// ✅ Affiche les données temps réel + indicateur de connexion
// ─────────────────────────────────────────
const EnvOverviewCard = ({ temperature, humidity, luminosity, connected, lastUpdate }) => {
  const items = [
    {
      key: 'temp', label: 'Température',
      value: temperature?.value ?? '--', unit: '°C',
      alert: temperature?.alert ?? false, trend: temperature?.trend,
    },
    {
      key: 'hum', label: 'Humidité',
      value: humidity?.value ?? '--', unit: '%',
      alert: humidity?.alert ?? false, trend: humidity?.trend,
    },
    {
      key: 'lum', label: 'Éclairage',
      value: luminosity?.value ?? '--', unit: 'lux',
      alert: false, trend: luminosity?.trend,
    },
  ];

  const hasAlert = items.some((i) => i.alert);

  const subLabel = (item) => {
    if (item.alert)            return '↑ Élevée';
    if (item.trend === 'up')   return '↑ Hausse';
    if (item.trend === 'down') return '↓ Baisse';
    return '✓ Normal';
  };

  const subColor = (item) => {
    if (item.alert || item.trend === 'up') return COLORS.secondary;
    return COLORS.statusHealthy;
  };

  // Formater l'heure de dernière mise à jour
  const lastUpdateStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <View style={styles.envCard}>
      {/* Header */}
      <View style={styles.envCardHeader}>
        <View style={styles.envTitleRow}>
          <View style={[styles.sensorIconBox, { backgroundColor: COLORS.statusHealthyBg }]}>
            <MaterialIcons name="eco" size={18} color={COLORS.statusHealthy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.envTitle}>Conditions environnementales</Text>
            {/* ✅ Heure de dernière mise à jour */}
            {lastUpdateStr && (
              <Text style={styles.envLastUpdate}>
                Mis à jour à {lastUpdateStr}
              </Text>
            )}
          </View>
        </View>

        {/* ✅ Indicateur connexion temps réel */}
        <View style={styles.envStatusRow}>
          <View style={[
            styles.envDot,
            { backgroundColor: connected ? COLORS.statusHealthy : COLORS.outline },
            connected && styles.envDotLive,
          ]} />
          <Text style={[
            styles.envStatusText,
            { color: connected ? COLORS.statusHealthy : COLORS.outline },
          ]}>
            {connected ? 'Live' : hasAlert ? 'Attention' : 'Hors ligne'}
          </Text>
        </View>
      </View>

      {/* Grille 3 colonnes */}
      <View style={styles.envGrid}>
        {items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.envItem,
              item.alert && { backgroundColor: COLORS.statusWarningBg },
            ]}
          >
            <Text style={styles.envItemLabel}>{item.label}</Text>
            <Text style={[styles.envItemValue, item.alert && { color: COLORS.secondary }]}>
              {typeof item.value === 'number'
                ? item.value.toFixed(1)  // 1 décimale pour les vrais capteurs
                : item.value}
              <Text style={styles.envItemUnit}>{item.unit}</Text>
            </Text>
            <Text style={[styles.envItemSub, { color: subColor(item) }]}>
              {subLabel(item)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 HOME SCREEN
// ─────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const user         = useAppStore((s) => s.user);
  const farm         = useAppStore((s) => s.farm);
  const storeSensors = useAppStore((s) => s.sensors);
  const selectedCoop = useAppStore((s) => s.selectedCoop);
  const unreadCount  = useAppStore((s) => s.unreadAlertsCount);

  // ✅ Hook Socket.IO — données temps réel
  const { sensors: realtimeSensors, connected, lastUpdate } = useRealtimeSensors(
    selectedCoop?.id
  );

  // Fusionner : temps réel prioritaire, store comme fallback
  const sensors = realtimeSensors || storeSensors;

  const sensorItems = sensors ? [
    {
      id: 'temp', icon: 'thermostat', label: 'Température',
      value: typeof sensors.temperature.value === 'number'
        ? sensors.temperature.value.toFixed(1)
        : sensors.temperature.value,
      unit: '°C',
      trend: sensors.temperature.trend,
      alertActive: sensors.temperature.alert,
    },
    {
      id: 'hum', icon: 'water-drop', label: 'Humidité',
      value: typeof sensors.humidity.value === 'number'
        ? sensors.humidity.value.toFixed(1)
        : sensors.humidity.value,
      unit: '%',
      trend: sensors.humidity.trend,
      alertActive: false,
    },
    {
      id: 'lum', icon: 'wb-sunny', label: 'Luminosité',
      value: typeof sensors.luminosity.value === 'number'
        ? Math.round(sensors.luminosity.value)
        : sensors.luminosity.value,
      unit: 'lux',
      trend: sensors.luminosity.trend,
      alertActive: false,
    },
    {
      id: 'vent', icon: 'air', label: 'Ventilation',
      value: sensors.ventilation.value,
      unit: '%',
      trend: sensors.ventilation.trend,
      alertActive: false,
    },
  ] : [];

  const goBack        = () => navigation.goBack();
  const goToCamera    = () => navigation.navigate(ROUTES.CAMERA);
  const goToAlerts    = () => navigation.getParent()?.navigate(ROUTES.ALERTS);
  const goToProfile   = () => navigation.navigate(ROUTES.PROFILE);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {selectedCoop?.name || 'Dashboard'}
            </Text>
            {/* ✅ Indicateur temps réel dans la barre */}
            {connected && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Temps réel</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={goToAlerts} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarWrapper} onPress={goToProfile} activeOpacity={0.8}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Farm Header */}
        <View style={styles.farmHeader}>
          <View>
            <Text style={styles.farmName}>{farm?.name || 'Tableau de bord'}</Text>
          </View>
          <View style={[
            styles.coopStatusBadge,
            { backgroundColor: selectedCoop?.status === 'warning' ? COLORS.statusWarningBg : COLORS.statusHealthyBg },
          ]}>
            <MaterialIcons
              name={selectedCoop?.status === 'warning' ? 'warning' : 'check-circle'}
              size={14}
              color={selectedCoop?.status === 'warning' ? COLORS.secondary : COLORS.statusHealthy}
            />
            <Text style={[
              styles.coopStatusText,
              { color: selectedCoop?.status === 'warning' ? COLORS.secondary : COLORS.statusHealthy },
            ]}>
              {selectedCoop?.status === 'warning' ? 'Attention' : 'Sain'}
            </Text>
          </View>
        </View>

        {/* Population Card */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.populationCard}
        >
          <View style={styles.populationHeader}>
            <MaterialIcons name="analytics" size={14} color={COLORS.white60} />
            <Text style={styles.populationHeaderText}>Population Overview</Text>
          </View>
          <View style={styles.populationRow}>
            <Text style={styles.populationCount}>
              {selectedCoop?.population?.toLocaleString('fr-FR') || farm?.totalPopulation?.toLocaleString('fr-FR') || '12,450'}
            </Text>
            <View style={styles.populationTrend}>
              <MaterialIcons name="trending-up" size={14} color={COLORS.emerald400} />
              <Text style={styles.populationTrendText}>+{farm?.populationTrend || 2.4}%</Text>
            </View>
          </View>
          <View style={styles.populationFooter}>
            <Text style={styles.populationFooterLabel}>Total Chickens Count</Text>
            <MaterialIcons name="monitoring" size={20} color={COLORS.emerald400} style={{ opacity: 0.5 }} />
          </View>
          <View style={styles.populationDeco} />
        </LinearGradient>

        {/* Grille capteurs 2×2 */}
        <View style={styles.sensorGrid}>
          {sensorItems.map((s) => (
            <SensorCard key={s.id} {...s} />
          ))}
        </View>

        {/* Niveau d'eau */}
        <WaterLevelCard
          level={farm?.waterLevel ?? 72}
          capacity={farm?.waterCapacity ?? 5000}
          dailyConsumption={farm?.dailyWaterConsumption ?? 320}
          lastRefill={farm?.lastWaterRefill ?? '3 jours'}
        />

        {/* ✅ Conditions environnementales — TEMPS RÉEL */}
        <EnvOverviewCard
          temperature={sensors?.temperature}
          humidity={sensors?.humidity}
          luminosity={sensors?.luminosity}
          connected={connected}          // ← indicateur temps réel
          lastUpdate={lastUpdate}        // ← heure dernière mise à jour
        />

        {/* Live Feed */}
        <TouchableOpacity style={styles.liveFeedWrapper} activeOpacity={0.9} onPress={goToCamera}>
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
              <Text style={styles.liveFeedTitle}>{selectedCoop?.name || 'Automated Area 04'}</Text>
              <View style={styles.liveFeedSubRow}>
                <MaterialIcons name="videocam" size={14} color={COLORS.secondary} />
                <Text style={styles.liveFeedSubText}>Streaming en 4K — AI tracking active</Text>
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
  safe: { flex: 1, backgroundColor: COLORS.surface },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg, height: LAYOUT.topBarHeight,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  backBtn:     { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.white10 },
  topBarTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -0.3,
  },

  // ✅ Indicateur temps réel dans la barre
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  liveDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.emerald400 },
  liveText:      { fontSize: FONT_SIZES.xs, color: COLORS.emerald400, fontFamily: FONTS.inter, fontWeight: FONT_WEIGHTS.bold },

  topBarRight:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  notifBtn:        { position: 'relative', padding: SPACING.xs },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.error, borderRadius: RADIUS.full,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  notifBadgeText:  { fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  avatarWrapper:   { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.white10 },
  avatar:          { width: '100%', height: '100%' },
  avatarFallback:  { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], gap: SPACING.lg },

  farmHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  farmName: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, letterSpacing: -0.5,
  },
  coopStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  coopStatusText:  { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  populationCard:       { borderRadius: RADIUS.xl, padding: SPACING['2xl'], overflow: 'hidden' },
  populationHeader:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg, opacity: 0.8 },
  populationHeaderText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1.5 },
  populationRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md, marginBottom: SPACING['3xl'] },
  populationCount:      { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['6xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -2, lineHeight: 56 },
  populationTrend:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: SPACING.sm },
  populationTrendText:  { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.emerald400 },
  populationFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  populationFooterLabel:{ fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium, color: COLORS.white60, textTransform: 'uppercase', letterSpacing: 1.5 },
  populationDeco:       { position: 'absolute', right: -48, bottom: -48, width: 192, height: 192, borderRadius: 96, backgroundColor: 'rgba(52,211,153,0.08)' },

  sensorGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg },
  sensorCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.outlineVariant + '40',
  },
  sensorCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  sensorIconBox:    { padding: SPACING.sm, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.sm },
  sensorLabel:      { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  sensorValue:      { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary },
  sensorUnit:       { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, opacity: 0.6 },

  waterCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant + '40' },
  waterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  waterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  waterTitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },
  waterValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginBottom: SPACING.md },
  waterValue: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary },
  waterUnit: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant },
  waterBarTrack: { height: 10, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  waterBarFill: { height: '100%', borderRadius: RADIUS.full },
  waterBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  waterBarLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  waterDivider: { height: 1, backgroundColor: COLORS.outlineVariant + '40', marginVertical: SPACING.md },
  waterFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  waterStat: { gap: 2 },
  waterStatLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  waterStatValue: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // ✅ Env Card mis à jour
  envCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant + '40' },
  envCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  envTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, flex: 1 },
  envTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  envLastUpdate: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },
  envStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  envDot: { width: 6, height: 6, borderRadius: 3 },
  envDotLive: { shadowColor: COLORS.statusHealthy, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 2 },
  envStatusText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },
  envGrid: { flexDirection: 'row', gap: SPACING.md },
  envItem: { flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: 3 },
  envItemLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  envItemValue: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, textAlign: 'center' },
  envItemUnit: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.regular, color: COLORS.onSurfaceVariant },
  envItemSub: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, textAlign: 'center' },

  liveFeedWrapper: { borderRadius: RADIUS['2xl'], overflow: 'hidden', ...SHADOWS.md },
  liveFeed: { height: 180, width: '100%' },
  liveFeedImage: { borderRadius: RADIUS['2xl'] },
  liveFeedOverlay: { flex: 1, justifyContent: 'flex-end', padding: SPACING['2xl'] },
  liveFeedLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.emerald400, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  liveFeedTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  liveFeedSubRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  liveFeedSubText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.white60, fontWeight: FONT_WEIGHTS.medium },
});

export default HomeScreen;