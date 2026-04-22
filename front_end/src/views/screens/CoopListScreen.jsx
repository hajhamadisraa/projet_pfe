// src/views/screens/CoopListScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
    ? COLORS.error : isWarning
    ? COLORS.secondary : COLORS.statusHealthy;

  return (
    <TouchableOpacity
      style={[styles.coopCard, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.coopCardHeader}>
        <View>
          <Text style={styles.coopSector}>{coop.sector}</Text>
          <Text style={styles.coopName}>{coop.name}</Text>
        </View>
        {isHealthy && (
          <View style={styles.badgeSafe}>
            <Text style={styles.badgeSafeText}>Sain</Text>
          </View>
        )}
        {isWarning && (
          <View style={styles.badgeWarning}>
            <View style={styles.badgePulse} />
            <Text style={styles.badgeWarningText}>Attention</Text>
          </View>
        )}
        {isCritical && (
          <View style={styles.badgeCritical}>
            <Text style={styles.badgeCriticalText}>Critique</Text>
          </View>
        )}
      </View>

      {/* Stats */}
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
            isWarning  && { color: COLORS.secondary },
            isCritical && { color: COLORS.error },
          ]}>
            {coop.mortality}%
          </Text>
        </View>
      </View>

      {/* Footer */}
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
        {(isWarning || isCritical) && (
          <View style={styles.warningRow}>
            <MaterialIcons
              name={isCritical ? 'error' : 'warning'}
              size={18}
              color={isCritical ? COLORS.error : COLORS.secondary}
            />
            <Text style={[
              styles.warningText,
              { color: isCritical ? COLORS.error : COLORS.secondary },
            ]}>
              {coop.warningMessage || `Temp: ${coop.temperature}°C`}
            </Text>
          </View>
        )}
        <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────
// 🧩 FILTER CHIP
// ─────────────────────────────────────────
const FilterChip = ({ label, active, color, onPress }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      active && { backgroundColor: color + '20', borderColor: color },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {active && <View style={[styles.filterDot, { backgroundColor: color }]} />}
    <Text style={[styles.filterChipText, active && { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// 🧩 USER MENU MODAL (déconnexion)
// ─────────────────────────────────────────
const UserMenuModal = ({ visible, user, onClose, onLogout, onProfile }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.userMenu}>
        {/* En-tête utilisateur */}
        <View style={styles.userMenuHeader}>
          <View style={styles.userMenuAvatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.userMenuAvatarImg} />
            ) : (
              <View style={[styles.userMenuAvatarImg, styles.userMenuAvatarFallback]}>
                <Text style={styles.userMenuAvatarInitials}>
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userMenuInfo}>
            <Text style={styles.userMenuName} numberOfLines={1}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userMenuRole} numberOfLines={1}>{user?.role || ''}</Text>
          </View>
        </View>

        <View style={styles.userMenuDivider} />

        {/* Option : Mon profil */}
        <TouchableOpacity
          style={styles.userMenuItem}
          onPress={onProfile}
          activeOpacity={0.8}
        >
          <View style={[styles.userMenuItemIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <MaterialIcons name="person" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.userMenuItemText}>Mon profil</Text>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.outline} />
        </TouchableOpacity>

        <View style={styles.userMenuDivider} />

        {/* Option : Déconnexion */}
        <TouchableOpacity
          style={styles.userMenuItem}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.userMenuItemIcon, { backgroundColor: COLORS.errorContainer }]}>
            <MaterialIcons name="logout" size={18} color={COLORS.error} />
          </View>
          <Text style={[styles.userMenuItemText, { color: COLORS.error }]}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─────────────────────────────────────────
// 📱 COOP LIST SCREEN
// ─────────────────────────────────────────
const CoopListScreen = ({ navigation }) => {
  const coops       = useAppStore((s) => s.coops);
  const unreadCount = useAppStore((s) => s.unreadAlertsCount);
  const user        = useAppStore((s) => s.user);
  const { setSelectedCoop, logout } = useAppStore();

  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const healthyCount  = coops.filter((c) => c.status === COOP_STATUS.HEALTHY).length;
  const warningCount  = coops.filter((c) => c.status === COOP_STATUS.WARNING).length;
  const criticalCount = coops.filter((c) => c.status === COOP_STATUS.CRITICAL).length;

  const filteredCoops = useMemo(() => {
    let result = coops;
    if (search.trim()) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.sector.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter !== 'all') result = result.filter((c) => c.status === filter);
    return result;
  }, [coops, search, filter]);

  // ── Tap sur une coop
  const handleCoopPress = async (coop) => {
    await setSelectedCoop(coop);
    navigation.navigate(ROUTES.HOME);
  };

  // ── Déconnexion avec confirmation
  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // ── Aller au profil
  const handleProfile = () => {
    setMenuVisible(false);
    navigation.navigate(ROUTES.PROFILE);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {/* Avatar → ouvre le menu utilisateur */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setMenuVisible(true)}
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

        <View style={styles.topBarRight}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.getParent()?.navigate(ROUTES.ALERTS)}
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

          {/* Bouton déconnexion rapide */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color={COLORS.emerald400} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Menu utilisateur modal */}
      <UserMenuModal
        visible={menuVisible}
        user={user}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
        onProfile={handleProfile}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Mes Poulaillers</Text>
        </View>

        {/* ── Résumé rapide */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: COLORS.statusHealthyBg }]}>
            <MaterialIcons name="check-circle" size={12} color={COLORS.statusHealthy} />
            <Text style={[styles.summaryChipText, { color: COLORS.statusHealthy }]}>
              {healthyCount} Sains
            </Text>
          </View>
          {warningCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: COLORS.statusWarningBg }]}>
              <MaterialIcons name="warning" size={12} color={COLORS.secondary} />
              <Text style={[styles.summaryChipText, { color: COLORS.secondary }]}>
                {warningCount} Attention
              </Text>
            </View>
          )}
          {criticalCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: COLORS.errorContainer }]}>
              <MaterialIcons name="error" size={12} color={COLORS.error} />
              <Text style={[styles.summaryChipText, { color: COLORS.error }]}>
                {criticalCount} Critique
              </Text>
            </View>
          )}
        </View>

        {/* ── Barre de recherche */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={22} color={COLORS.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un poulailler..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterChip
            label="Tous" active={filter === 'all'}
            color={COLORS.primary} onPress={() => setFilter('all')}
          />
          <FilterChip
            label={`${healthyCount} Sains`}
            active={filter === COOP_STATUS.HEALTHY}
            color={COLORS.statusHealthy}
            onPress={() => setFilter(COOP_STATUS.HEALTHY)}
          />
          <FilterChip
            label={`${warningCount} Attention`}
            active={filter === COOP_STATUS.WARNING}
            color={COLORS.secondary}
            onPress={() => setFilter(COOP_STATUS.WARNING)}
          />
          <FilterChip
            label={`${criticalCount} Critique`}
            active={filter === COOP_STATUS.CRITICAL}
            color={COLORS.error}
            onPress={() => setFilter(COOP_STATUS.CRITICAL)}
          />
        </ScrollView>

        {/* ── Liste coops */}
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

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── FAB ajouter coop */}
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
  safe: { flex: 1, backgroundColor: COLORS.surface },

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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarWrapper: {
    width: 40, height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.emerald400 + '60',
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
  notifBtn: { position: 'relative', padding: SPACING.xs },
  notifBadge: {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.emerald950,
  },
  notifBadgeText: {
    fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white,
  },
  logoutBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white10,
  },

  // ── Modal menu utilisateur
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: LAYOUT.topBarHeight + 60,
    paddingLeft: SPACING['2xl'],
  },
  userMenu: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    width: 260,
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  userMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    backgroundColor: COLORS.primary,
  },
  userMenuAvatar: {
    width: 44, height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.white20,
  },
  userMenuAvatarImg: { width: '100%', height: '100%' },
  userMenuAvatarFallback: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMenuAvatarInitials: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  userMenuInfo: { flex: 1 },
  userMenuName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  userMenuRole: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white60,
    marginTop: 2,
  },
  userMenuDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  userMenuItemIcon: {
    width: 36, height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMenuItemText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurface,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.lg,
  },

  // ── Titre
  titleSection: { gap: 2 },
  sectionLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  screenTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // ── Résumé
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  summaryChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // ── Recherche
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
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
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },

  // ── Coop Cards
  coopList: { gap: SPACING.lg },
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
    width: 8, height: 8, borderRadius: 4,
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
  coopStats: { flexDirection: 'row', gap: SPACING.lg },
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
  statUnit: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },
  coopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant + '30',
  },
  coopSensors: { flexDirection: 'row', gap: SPACING.lg },
  sensorChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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