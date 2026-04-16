// src/views/screens/HealthScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import useAppStore from '../../controllers/context/AppStore';
import {
    COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
    GRADIENTS, LAYOUT,
    RADIUS, SHADOWS,
    SPACING,
} from '../../models/utils/constants';
import { MOCK_HEALTH } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 HEALTH SCORE CIRCLE (SVG)
// ─────────────────────────────────────────
const HealthScoreCircle = ({ score }) => {
  const size       = 112;
  const cx         = size / 2;
  const cy         = size / 2;
  const radius     = 46;
  const strokeW    = 8;
  const circumference = 2 * Math.PI * radius;
  const progress   = circumference - (score / 100) * circumference;

  return (
    <View style={scoreStyles.wrapper}>
      <Svg width={size} height={size}>
        {/* Piste de fond */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={COLORS.surfaceContainerHigh}
          strokeWidth={strokeW}
          fill="none"
        />
        {/* Arc de progression */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={COLORS.statusHealthy}
          strokeWidth={strokeW}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {/* Icône centrale */}
      <View style={scoreStyles.iconCenter}>
        <MaterialIcons name="favorite" size={32} color={COLORS.statusHealthy} />
      </View>
    </View>
  );
};

const scoreStyles = StyleSheet.create({
  wrapper: {
    width: 112,
    height: 112,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────
// 🧩 VACCINATION CARD
// ─────────────────────────────────────────
const VaccinationCard = ({ item }) => {
  const isDone     = item.status === 'done';
  const borderColor = isDone ? COLORS.statusHealthy : COLORS.secondary;
  const iconName    = isDone ? 'done-all' : 'vaccines';
  const iconColor   = isDone ? COLORS.statusHealthy : COLORS.secondary;
  const iconBg      = isDone ? COLORS.statusHealthyBg : COLORS.statusWarningBg;

  return (
    <View style={[styles.vaccinCard, { borderLeftColor: borderColor }]}>
      <View style={styles.vaccinCardHeader}>
        <View style={[styles.vaccinIconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.vaccinInfo}>
          <Text style={styles.vaccinDisease}>{item.disease}</Text>
          <Text style={styles.vaccinPhase}>{item.phase}</Text>
        </View>
      </View>
      <Text style={styles.vaccinDate}>
        {isDone ? 'Terminé le ' : 'Date cible : '}
        <Text style={[styles.vaccinDateValue, { color: isDone ? COLORS.statusHealthy : COLORS.secondary }]}>
          {item.date}
        </Text>
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 TREATMENT ROW
// ─────────────────────────────────────────
const TreatmentRow = ({ item }) => {
  const progressColor =
    item.statusType === 'healthy' ? COLORS.statusHealthy : COLORS.secondary;

  return (
    <View style={styles.treatmentRow}>
      <View style={styles.treatmentIconBox}>
        <MaterialIcons name={item.icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.treatmentInfo}>
        <View style={styles.treatmentHeader}>
          <Text style={styles.treatmentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[
            styles.treatmentStatus,
            { color: progressColor },
          ]}>
            {item.status}
          </Text>
        </View>
        {/* Barre de progression */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress * 100}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 HEALTH SCREEN
// ─────────────────────────────────────────
const HealthScreen = ({ navigation }) => {
  const selectedCoop = useAppStore((s) => s.selectedCoop);
  const unreadCount  = useAppStore((s) => s.unreadAlertsCount);

  const health = MOCK_HEALTH;
  const [selectedCoopLabel, setSelectedCoopLabel] = useState(
    selectedCoop?.name || 'Coop #04'
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={20} color={COLORS.emerald400} />
          </View>
          <Text style={styles.topBarTitle}>Agrarian Intel</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Alerts')}
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
        {/* ── Titre + sélecteur coop */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Sanitaire & Santé</Text>
            <Text style={styles.screenSubtitle}>
              Surveillance biométrique du cheptel
            </Text>
          </View>
          <TouchableOpacity style={styles.coopSelector} activeOpacity={0.8}>
            <MaterialIcons name="grid-view" size={16} color={COLORS.secondary} />
            <Text style={styles.coopSelectorText}>{selectedCoopLabel}</Text>
            <MaterialIcons name="expand-more" size={14} color={COLORS.outline} />
          </TouchableOpacity>
        </View>

        {/* ── Bento : Effectif + Health Score */}
        <View style={styles.bentoRow}>

          {/* Carte effectif */}
          <View style={styles.effectifCard}>
            <View style={styles.effectifHeader}>
              <View>
                <Text style={styles.effectifLabel}>Effectif Total</Text>
                <Text style={styles.effectifValue}>
                  {health.totalHeads.toLocaleString('fr-FR')}
                  <Text style={styles.effectifUnit}> têtes</Text>
                </Text>
              </View>
              <View style={styles.healthStatusBadge}>
                <MaterialIcons name="check-circle" size={14} color={COLORS.statusHealthy} />
                <Text style={styles.healthStatusText}>SANTÉ OPTIMALE</Text>
              </View>
            </View>
            <View style={styles.growthBar}>
              <MaterialIcons name="trending-up" size={18} color={COLORS.primary} />
              <Text style={styles.growthText}>
                Stabilité de croissance :{' '}
                <Text style={styles.growthValue}>+{health.growthStability}%</Text>
              </Text>
            </View>
          </View>

          {/* Health Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Health Score</Text>
              <Text style={styles.scoreValue}>
                {health.healthScore}
                <Text style={styles.scorePercent}>%</Text>
              </Text>
              <Text style={styles.scoreRisk}>
                Risque pathogène : {health.pathogenRisk}
              </Text>
            </View>
            <HealthScoreCircle score={health.healthScore} />
            {/* Déco blur */}
            <View style={styles.scoreDeco} />
          </View>
        </View>

        {/* ── Calendrier vaccinal */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="event-available" size={22} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Calendrier Vaccinal</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.seeAllBtn}>VOIR TOUT</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vaccinRow}
        >
          {health.vaccinations.map((v) => (
            <VaccinationCard key={v.id} item={v} />
          ))}
        </ScrollView>

        {/* ── Traitements actifs */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="medical-information" size={22} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Traitements Actifs</Text>
          </View>
        </View>

        <View style={styles.treatmentsList}>
          {health.treatments.map((t) => (
            <TreatmentRow key={t.id} item={t} />
          ))}
        </View>

        {/* ── IA Insight */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiInsightCard}
        >
          <View style={styles.aiInsightContent}>
            <View style={styles.aiInsightHeader}>
              <MaterialIcons name="smart-toy" size={14} color={COLORS.emerald400} />
              <Text style={styles.aiInsightLabel}>Agrarian AI Insight</Text>
            </View>
            <Text style={styles.aiInsightText}>{health.aiInsight}</Text>
          </View>
          {/* Icône décorative */}
          <MaterialIcons
            name="psychology"
            size={96}
            color={COLORS.white}
            style={styles.aiInsightDeco}
          />
        </LinearGradient>

        {/* Espace bottom nav */}
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  notifBtn: {
    position: 'relative',
    padding: SPACING.xs,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.emerald950,
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
    gap: SPACING.xl,
  },

  // ── Titre
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  screenTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 4,
  },
  coopSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  coopSelectorText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },

  // ── Bento Row
  bentoRow: {
    gap: SPACING.lg,
  },

  // Effectif Card
  effectifCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING['2xl'],
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  effectifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  effectifLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  effectifValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  effectifUnit: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.outline,
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.statusHealthyBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  healthStatusText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.statusHealthy,
    letterSpacing: 0.5,
  },
  growthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primary + '0A',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  growthText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },
  growthValue: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  // Score Card
  scoreCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['6xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -2,
    lineHeight: 56,
  },
  scorePercent: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.onSurfaceVariant,
  },
  scoreRisk: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 4,
  },
  scoreDeco: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.statusHealthy + '15',
  },

  // ── Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  seeAllBtn: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },

  // ── Vaccinations
  vaccinRow: {
    gap: SPACING.lg,
    paddingRight: SPACING['2xl'],
    paddingBottom: SPACING.sm,
  },
  vaccinCard: {
    width: 280,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderLeftWidth: 4,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  vaccinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  vaccinIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccinInfo: {
    flex: 1,
  },
  vaccinDisease: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vaccinPhase: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginTop: 2,
  },
  vaccinDate: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },
  vaccinDateValue: {
    fontWeight: FONT_WEIGHTS.extraBold,
  },

  // ── Traitements
  treatmentsList: {
    gap: SPACING.md,
  },
  treatmentRow: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },
  treatmentIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treatmentInfo: {
    flex: 1,
    gap: SPACING.sm,
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treatmentName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  treatmentStatus: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // ── AI Insight
  aiInsightCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING['2xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  aiInsightContent: {
    gap: SPACING.md,
    zIndex: 1,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiInsightLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.emerald400,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  aiInsightText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
    lineHeight: 24,
  },
  aiInsightDeco: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    opacity: 0.08,
    transform: [{ rotate: '12deg' }],
  },
});

export default HealthScreen;