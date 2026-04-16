// src/views/screens/FeedingScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS, LAYOUT,
  RADIUS, SHADOWS,
  SPACING,
} from '../../models/utils/constants';
import { MOCK_FEEDING, MOCK_HYDRATION } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 STAT CHIP (Distribué / Consommé / Restant)
// ─────────────────────────────────────────
const StatChip = ({ label, value, unit }) => (
  <View style={styles.statChip}>
    <Text style={styles.statChipLabel}>{label}</Text>
    <Text style={styles.statChipValue}>
      {value}
      <Text style={styles.statChipUnit}> {unit}</Text>
    </Text>
  </View>
);

// ─────────────────────────────────────────
// 🧩 WEEKLY BAR CHART
// ─────────────────────────────────────────
const WeeklyBarChart = ({ data, activeIndex }) => {
  const maxHeight = 100;

  return (
    <View style={styles.chartWrapper}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const isActive = index === activeIndex;
          const barH     = (item.height / 100) * maxHeight;

          return (
            <View key={index} style={styles.chartBarCol}>
              <View style={[styles.chartBar, { height: maxHeight }]}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: barH,
                      backgroundColor: isActive
                        ? COLORS.primary
                        : item.height > 0
                        ? COLORS.surfaceContainerHigh
                        : COLORS.surfaceContainerHigh + '80',
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.chartDayLabel,
                isActive && styles.chartDayLabelActive,
              ]}>
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 SCHEDULE ITEM
// ─────────────────────────────────────────
const ScheduleItem = ({ item }) => {
  const isDone    = item.status === 'done';
  const isPending = item.status === 'pending';

  if (isPending) {
    return (
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scheduleItemPending}
      >
        <View style={styles.scheduleTimeBadgeDark}>
          <Text style={styles.scheduleTimeDark}>{item.time}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleNameLight}>{item.label}</Text>
          <Text style={styles.scheduleQtyLight}>
            {item.quantity}{item.unit} prévu
          </Text>
        </View>
        <MaterialIcons name="schedule" size={22} color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.scheduleItemDone}>
      <View style={styles.scheduleTimeBadge}>
        <Text style={styles.scheduleTime}>{item.time}</Text>
      </View>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleName}>{item.label}</Text>
        <Text style={styles.scheduleQty}>
          {item.quantity}{item.unit} distribués
        </Text>
      </View>
      <MaterialIcons name="check-circle" size={22} color={COLORS.statusHealthy} />
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 TANK VISUAL
// ─────────────────────────────────────────
const TankVisual = ({ tank }) => {
  const isLow      = tank.status === 'low';
  const fillColor  = isLow ? COLORS.secondary : COLORS.emerald400 + 'CC';
  const fillH      = `${tank.level}%`;
  const badgeColor = isLow ? COLORS.statusWarningBg : COLORS.statusHealthyBg;
  const badgeTxt   = isLow ? COLORS.secondary : COLORS.statusHealthy;

  return (
    <View style={styles.tankWrapper}>
      {/* Visuel réservoir */}
      <View style={styles.tank}>
        {/* Ligne danger si bas */}
        {isLow && (
          <View style={styles.tankDangerLine} />
        )}
        {/* Remplissage */}
        <View style={[styles.tankFill, { height: fillH, backgroundColor: fillColor }]}>
          <Text style={[
            styles.tankFillLabel,
            { color: isLow ? COLORS.white : COLORS.primary },
          ]}>
            {tank.level}%
          </Text>
        </View>
      </View>
      {/* Nom */}
      <Text style={styles.tankName}>{tank.name}</Text>
      {/* Badge statut */}
      <View style={[styles.tankBadge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.tankBadgeText, { color: badgeTxt }]}>
          {tank.statusLabel}
        </Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 FEEDING SCREEN
// ─────────────────────────────────────────
const FeedingScreen = ({ navigation }) => {
  const feeding   = MOCK_FEEDING;
  const hydration = MOCK_HYDRATION;

  const [alertEnabled, setAlertEnabled] = useState(hydration.alertEnabled);
  const [selectedCoop, setSelectedCoop] = useState('Poulailler 2');

  // Index du jour actif dans le graphe (Jeudi = index 3)
  const activeBarIndex = feeding.weeklyData.findIndex((d) => d.height === 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.coopDropdown} activeOpacity={0.8}>
          <MaterialIcons name="expand-more" size={18} color={COLORS.white} />
          <Text style={styles.coopDropdownText}>{selectedCoop.toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Alerts')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════════
            SECTION ALIMENTATION
        ════════════════════════════════ */}
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionLabel}>Overview</Text>
            <Text style={styles.sectionTitle}>ALIMENTATION</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>En Direct</Text>
          </View>
        </View>

        {/* ── Stats rapides */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statChipsRow}
        >
          <StatChip label="Distribué"  value={feeding.distributed} unit={feeding.unit} />
          <StatChip label="Consommé"   value={feeding.consumed}    unit={feeding.unit} />
          <StatChip label="Restant"    value={feeding.remaining}   unit={feeding.unit} />
        </ScrollView>

        {/* ── Graphe hebdomadaire */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartCardTitle}>Consommation Hebdomadaire</Text>
            <Text style={styles.chartCardRange}>Lun - Dim</Text>
          </View>
          <WeeklyBarChart
            data={feeding.weeklyData}
            activeIndex={activeBarIndex >= 0 ? activeBarIndex : 3}
          />
        </View>

        {/* ── Planning de distribution */}
        <Text style={styles.planningTitle}>Planning de distribution</Text>
        <View style={styles.scheduleList}>
          {feeding.schedule.map((item) => (
            <ScheduleItem key={item.id} item={item} />
          ))}
        </View>

        {/* ════════════════════════════════
            SECTION ABREUVEMENT
        ════════════════════════════════ */}
        <View style={styles.hydrationSection}>
          <Text style={styles.sectionLabel}>Hydratation</Text>
          <Text style={styles.sectionTitle}>ABREUVEMENT</Text>
        </View>

        {/* ── Tanks */}
        <View style={styles.tanksRow}>
          {hydration.tanks.map((tank) => (
            <TankVisual key={tank.id} tank={tank} />
          ))}
        </View>

        {/* ── Toggle alerte */}
        <View style={styles.alertToggleCard}>
          <View style={styles.alertToggleLeft}>
            <View style={styles.alertToggleIconBox}>
              <MaterialIcons name="notifications-active" size={22} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.alertToggleTitle}>
                Alerter si &lt; {hydration.alertThreshold}%
              </Text>
              <Text style={styles.alertToggleSubtitle}>Niveau Critique</Text>
            </View>
          </View>
          <Switch
            value={alertEnabled}
            onValueChange={setAlertEnabled}
            trackColor={{
              false: COLORS.surfaceContainerHigh,
              true: COLORS.secondary,
            }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.surfaceContainerHigh}
          />
        </View>

        {/* Espace bottom nav */}
        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  coopDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  coopDropdownText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  notifBtn: {
    position: 'relative',
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.xl,
  },

  // ── Section header
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  liveBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  liveBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Stat Chips
  statChipsRow: {
    gap: SPACING.lg,
    paddingRight: SPACING['2xl'],
  },
  statChip: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    minWidth: 130,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
  },
  statChipLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statChipValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },
  statChipUnit: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },

  // ── Chart
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING['2xl'],
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '30',
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  chartCardTitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  chartCardRange: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartWrapper: {
    gap: SPACING.sm,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chartBar: {
    width: 6,
    justifyContent: 'flex-end',
    borderRadius: RADIUS.full,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: RADIUS.full,
  },
  chartDayLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  chartDayLabelActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.extraBold,
  },

  // ── Planning
  planningTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  scheduleList: {
    gap: SPACING.md,
  },
  scheduleItemDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surfaceContainer + '80',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '30',
    ...SHADOWS.sm,
  },
  scheduleItemPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  scheduleTimeBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
    ...SHADOWS.sm,
  },
  scheduleTimeBadgeDark: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.white10,
  },
  scheduleTime: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  scheduleTimeDark: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  scheduleNameLight: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  scheduleQty: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  scheduleQtyLight: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white60,
    marginTop: 2,
  },

  // ── Hydration
  hydrationSection: {
    marginTop: SPACING.xl,
    gap: 2,
  },

  // ── Tanks
  tanksRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  tankWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
  },
  tank: {
    width: LAYOUT.tankWidth,
    height: LAYOUT.tankHeight,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '50',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tankDangerLine: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderColor: COLORS.secondary + '60',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  tankFill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tankFillLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  tankName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  tankBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tankBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Alert Toggle
  alertToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.statusWarningBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
    ...SHADOWS.sm,
  },
  alertToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  alertToggleIconBox: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.secondary,
  },
  alertToggleTitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  alertToggleSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },

  // ── FAB
  fab: {
    position: 'absolute',
    bottom: LAYOUT.bottomNavHeight + SPACING.lg,
    right: SPACING['2xl'],
    width: LAYOUT.fabSize,
    height: LAYOUT.fabSize,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.secondary,
  },
});

export default FeedingScreen;