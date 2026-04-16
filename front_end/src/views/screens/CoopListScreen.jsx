// src/views/screens/CoopListScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import {
    COLORS,
    COOP_STATUS,
    FONTS, FONT_SIZES, FONT_WEIGHTS,
    LAYOUT,
    RADIUS,
    ROUTES,
    SHADOWS,
    SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 COOP CARD
// ─────────────────────────────────────────
const CoopCard = ({ coop, onPress }) => {
  const isWarning  = coop.status === COOP_STATUS.WARNING;
  const isCritical = coop.status === COOP_STATUS.CRITICAL;
  const isHealthy  = coop.status === COOP_STATUS.HEALTHY;

  const borderColor = isCritical
    ? COLORS.error
    : isWarning
    ? COLORS.secondary
    : COLORS.statusHealthy;

  return (
    <TouchableOpacity
      style={[styles.coopCard, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* ── En-tête carte */}
      <View style={styles.coopCardHeader}>
        <View>
          <Text style={styles.coopSector}>{coop.sector}</Text>
          <Text style={styles.coopName}>{coop.name}</Text>
        </View>

        {/* Badge statut */}
        {isHealthy && (
          <View style={styles.badgeSafe}>
            <Text style={styles.badgeSafeText}>Safe</Text>
          </View>
        )}
        {isWarning && (
          <View style={styles.badgeWarning}>
            <View style={styles.badgePulse} />
            <Text style={styles.badgeWarningText}>High Temp</Text>
          </View>
        )}
        {isCritical && (
          <View style={styles.badgeCritical}>
            <Text style={styles.badgeCriticalText}>Critical</Text>
          </View>
        )}
      </View>

      {/* ── Stats population + mortalité */}
      <View style={styles.coopStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Population</Text>
          <Text style={styles.statValue}>
            {coop.population.toLocaleString('fr-FR')}
            <Text style={styles.statUnit}> oiseaux</Text>
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mortalité</Text>
          <Text style={[
            styles.statValue,
            isWarning && styles.statValueWarning,
            isCritical && styles.statValueCritical,
          ]}>
            {coop.mortality}%
          </Text>
        </View>
      </View>

      {/* ── Footer : capteurs ou alerte */}
      <View style={styles.coopFooter}>
        {isHealthy && (
          <View style={styles.coopSensors}>
            <View style={styles.sensorChip}>
              <MaterialIcons name="thermostat" size={16} color={COLORS.statusHealthy} />
              <Text style={styles.sensorChipText}>{coop.temperature}°C</Text>
            </View>
            <View style={styles.sensorChip}>
              <MaterialIcons name="water-drop" size={16} color={COLORS.statusHealthy} />
              <Text style={styles.sensorChipText}>{coop.humidity}%</Text>
            </View>
          </View>
        )}
        {isWarning && (
          <View style={styles.warningRow}>
            <MaterialIcons name="warning" size={18} color={COLORS.secondary} />
            <Text style={styles.warningText}>
              {coop.warningMessage || `Temp: ${coop.temperature}°C détectée`}
            </Text>
          </View>
        )}
        {isCritical && (
          <View style={styles.warningRow}>
            <MaterialIcons name="error" size={18} color={COLORS.error} />
            <Text style={[styles.warningText, { color: COLORS.error }]}>
              {coop.warningMessage || 'Situation critique'}
            </Text>
          </View>
        )}
        <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────
// 🧩 CHIP FILTRE
// ─────────────────────────────────────────
const FilterChip = ({ label, count, active, color, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && { backgroundColor: color + '20', borderColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {active && <View style={[styles.filterDot, { backgroundColor: color }]} />}
    <Text style={[styles.filterChipText, active && { color }]}>{label}</Text>
    {count !== undefined && (
      <Text style={[styles.filterCount, active && { color }]}>{count}</Text>
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// 📱 COOP LIST SCREEN
// ─────────────────────────────────────────
const CoopListScreen = ({ navigation }) => {
  const coops         = useAppStore((s) => s.coops);
  const unreadCount   = useAppStore((s) => s.unreadAlertsCount);
  const { setSelectedCoop } = useAppStore();

  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  // ── Compteurs par statut
  const healthyCount  = coops.filter((c) => c.status === COOP_STATUS.HEALTHY).length;
  const warningCount  = coops.filter((c) => c.status === COOP_STATUS.WARNING).length;
  const criticalCount = coops.filter((c) => c.status === COOP_STATUS.CRITICAL).length;

  // ── Filtrage combiné recherche + filtre
  const filteredCoops = useMemo(() => {
    let result = coops;
    if (search.trim()) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.sector.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter !== 'all') {
      result = result.filter((c) => c.status === filter);
    }
    return result;
  }, [coops, search, filter]);

  // ── Navigation vers détail coop
  const handleCoopPress = (coop) => {
    setSelectedCoop(coop);
    navigation.navigate(ROUTES.CAMERA);
  };

  // ─────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarTitle}>PoulIA</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate(ROUTES.ALERTS)}
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Titre + Sous-titre */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>Estate Management</Text>
          <Text style={styles.screenTitle}>My Coops</Text>
        </View>

        {/* ── Barre de recherche */}
        <View style={styles.searchWrapper}>
          <MaterialIcons
            name="search"
            size={22}
            color={COLORS.outline}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coops..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Chips de filtre */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterChip
            label="Tous"
            count={coops.length}
            active={filter === 'all'}
            color={COLORS.primary}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={`${healthyCount} Healthy`}
            active={filter === COOP_STATUS.HEALTHY}
            color={COLORS.statusHealthy}
            onPress={() => setFilter(COOP_STATUS.HEALTHY)}
          />
          <FilterChip
            label={`${warningCount} Warning`}
            active={filter === COOP_STATUS.WARNING}
            color={COLORS.secondary}
            onPress={() => setFilter(COOP_STATUS.WARNING)}
          />
          <FilterChip
            label={`${criticalCount} Critical`}
            active={filter === COOP_STATUS.CRITICAL}
            color={COLORS.error}
            onPress={() => setFilter(COOP_STATUS.CRITICAL)}
          />
        </ScrollView>

        {/* ── Liste des coops */}
        {filteredCoops.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySubtitle}>
              Essayez un autre terme ou réinitialisez le filtre.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => { setSearch(''); setFilter('all'); }}
            >
              <Text style={styles.emptyResetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.coopList}>
            {filteredCoops.map((coop) => (
              <CoopCard
                key={coop.id}
                coop={coop}
                onPress={() => handleCoopPress(coop)}
              />
            ))}
          </View>
        )}

        {/* Espace bottom nav */}
        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── FAB Ajouter coop */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {}}
      >
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
  },

  // ── Titre
  titleSection: { marginBottom: SPACING.lg },
  sectionLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  screenTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // ── Recherche
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  searchIcon: { marginRight: SPACING.md },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.md,
    color: COLORS.onSurface,
    paddingVertical: SPACING.lg,
  },

  // ── Filtres
  filtersRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
    paddingRight: SPACING['2xl'],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '50',
    ...SHADOWS.sm,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  filterCount: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },

  // ── Liste coops
  coopList: { gap: SPACING.lg },

  // ── Coop Card
  coopCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING['2xl'],
    borderLeftWidth: 4,
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },
  coopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coopSector: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  coopName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },

  // Badges
  badgeSafe: {
    backgroundColor: COLORS.statusHealthyBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeSafeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.statusHealthy,
    textTransform: 'uppercase',
  },
  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  badgeWarningText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  badgeCritical: {
    backgroundColor: COLORS.errorContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeCriticalText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
    textTransform: 'uppercase',
  },

  // Stats
  coopStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },
  statValueWarning: { color: COLORS.secondary },
  statValueCritical: { color: COLORS.error },
  statUnit: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },

  // Footer
  coopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant + '30',
  },
  coopSensors: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  sensorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sensorChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  warningText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    flex: 1,
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyResetBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
  },
  emptyResetText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ── FAB
  fab: {
    position: 'absolute',
    bottom: LAYOUT.bottomNavHeight + SPACING.lg,
    right: SPACING['2xl'],
    width: LAYOUT.fabSize,
    height: LAYOUT.fabSize,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});

export default CoopListScreen;