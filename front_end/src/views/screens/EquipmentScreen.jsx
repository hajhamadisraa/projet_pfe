// src/views/screens/EquipmentScreen.jsx
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
import useAppStore from '../../controllers/context/AppStore';
import {
  COLORS,
  EQUIPMENT_MODE,
  FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS,
  LAYOUT,
  RADIUS, SHADOWS,
  SPACING,
} from '../../models/utils/constants';
import { MOCK_DISTRIBUTORS } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 EQUIPMENT CARD
// ─────────────────────────────────────────
const EquipmentCard = ({ item, onToggle }) => {
  const isAlert  = item.mode === EQUIPMENT_MODE.ALERT;
  const isAuto   = item.mode === EQUIPMENT_MODE.AUTO;
  const isManual = item.mode === EQUIPMENT_MODE.MANUAL;

  const cardBg     = isAlert ? COLORS.errorContainer : COLORS.surfaceContainer;
  const iconColor  = isAlert ? COLORS.error : COLORS.primary;
  const iconBg     = isAlert ? COLORS.error + '18' : COLORS.primary + '18';
  const titleColor = isAlert ? COLORS.error : COLORS.primary;

  const modeBadgeStyle = isAlert
    ? styles.badgeAlert
    : isAuto
    ? styles.badgeAuto
    : styles.badgeManual;

  const modeBadgeTextStyle = isAlert
    ? styles.badgeAlertText
    : isAuto
    ? styles.badgeAutoText
    : styles.badgeManualText;

  return (
    <View style={[
      styles.equipCard,
      { backgroundColor: cardBg },
      isAlert && styles.equipCardAlert,
    ]}>
      {/* ── En-tête */}
      <View style={styles.equipCardHeader}>
        <View style={[styles.equipIconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={item.icon} size={22} color={iconColor} />
        </View>
        <View style={[modeBadgeStyle]}>
          <Text style={modeBadgeTextStyle}>{item.mode}</Text>
        </View>
      </View>

      {/* ── Nom + Toggle */}
      <View style={styles.equipCardFooter}>
        <Text style={[styles.equipName, { color: titleColor }]}>{item.name}</Text>
        <View style={styles.equipToggleRow}>
          <Text style={[
            styles.equipStatus,
            { color: item.isOn ? COLORS.statusHealthy : COLORS.onSurfaceVariant },
          ]}>
            {isAlert ? 'FAIL' : item.isOn ? 'ON' : 'OFF'}
          </Text>
          <Switch
            value={item.isOn && !isAlert}
            onValueChange={() => !isAlert && onToggle(item.id)}
            trackColor={{
              false: COLORS.surfaceContainerHigh,
              true: isAlert ? COLORS.error + '40' : COLORS.primary + '60',
            }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.surfaceContainerHigh}
            disabled={isAlert}
          />
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 FILTER PILL
// ─────────────────────────────────────────
const FilterPill = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// 📱 EQUIPMENT SCREEN
// ─────────────────────────────────────────
const EquipmentScreen = ({ navigation }) => {
  const equipment        = useAppStore((s) => s.equipment);
  const equipmentFilter  = useAppStore((s) => s.equipmentFilter);
  const unreadCount      = useAppStore((s) => s.unreadAlertsCount);
  const { toggleEquipment, setEquipmentFilter } = useAppStore();

  const [selectedCoop, setSelectedCoop] = useState('POULAILLER 2');

  // ── Filtrage
  const filteredEquipment = equipment.filter((eq) => {
    if (equipmentFilter === 'active') return eq.isOn;
    if (equipmentFilter === 'alert')  return eq.mode === EQUIPMENT_MODE.ALERT;
    return true;
  });

  const filterItems = [
    { key: 'all',    label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'alert',  label: 'En alerte' },
  ];

  // ─────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.coopDropdown} activeOpacity={0.8}>
          <Text style={styles.coopDropdownText}>{selectedCoop}</Text>
          <MaterialIcons name="expand-more" size={18} color={COLORS.emerald400} />
        </TouchableOpacity>
        <View style={styles.topBarRight}>
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
          <View style={styles.avatarSmall}>
            <MaterialIcons name="person" size={18} color={COLORS.emerald400} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Équipements</Text>
          <Text style={styles.screenSubtitle}>
            Contrôle en temps réel et automatisation
          </Text>
        </View>

        {/* ── Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filterItems.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={equipmentFilter === f.key}
              onPress={() => setEquipmentFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* ── Grille équipements 2 colonnes */}
        {filteredEquipment.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="devices-other" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>Aucun équipement dans cette catégorie</Text>
          </View>
        ) : (
          <View style={styles.equipGrid}>
            {filteredEquipment.map((eq) => (
              <View key={eq.id} style={styles.equipGridItem}>
                <EquipmentCard item={eq} onToggle={toggleEquipment} />
              </View>
            ))}
          </View>
        )}

        {/* ── Grande carte Distributeurs */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.distributorCard}
        >
          {/* Décoration fond */}
          <View style={styles.distributorDeco} />

          <View style={styles.distributorTop}>
            <View>
              <View style={styles.distributorIconBox}>
                <MaterialIcons name="restaurant" size={22} color={COLORS.emerald400} />
              </View>
              <Text style={styles.distributorTitle}>Distributeurs</Text>
              <Text style={styles.distributorSubtitle}>
                Prochain cycle :{' '}
                <Text style={styles.distributorTime}>
                  {MOCK_DISTRIBUTORS.nextCycle}
                </Text>
              </Text>
            </View>
            <View style={styles.distributorBadgeAuto}>
              <Text style={styles.distributorBadgeAutoText}>
                {MOCK_DISTRIBUTORS.mode}
              </Text>
            </View>
          </View>

          <View style={styles.distributorBottom}>
            {/* Avatars D1 D2 D3 +2 */}
            <View style={styles.distributorAvatars}>
              {MOCK_DISTRIBUTORS.units.map((u, index) => (
                <View
                  key={u.id}
                  style={[
                    styles.distributorAvatar,
                    { marginLeft: index === 0 ? 0 : -10 },
                    u.active
                      ? styles.distributorAvatarActive
                      : styles.distributorAvatarExtra,
                  ]}
                >
                  <Text style={styles.distributorAvatarText}>{u.label}</Text>
                </View>
              ))}
            </View>

            {/* Bouton Activer */}
            <TouchableOpacity
              style={styles.activateBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.activateBtnText}>ACTIVER</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  coopDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '60',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  coopDropdownText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
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
    borderColor: COLORS.primaryContainer,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.xl,
  },

  // ── Titre
  titleSection: { gap: 4 },
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
    opacity: 0.8,
  },

  // ── Filtres
  filtersRow: {
    gap: SPACING.md,
    paddingRight: SPACING['2xl'],
  },
  filterPill: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  // ── Grille équipements
  equipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  equipGridItem: {
    width: '47%',
  },
  equipCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    height: 160,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  equipCardAlert: {
    borderWidth: 1.5,
    borderColor: COLORS.error + '30',
  },
  equipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  equipIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges mode
  badgeAuto: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeAutoText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  badgeManual: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeManualText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  badgeAlert: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeAlertText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Footer carte
  equipCardFooter: { gap: 6 },
  equipName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  equipToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipStatus: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // ── Distributeur Card
  distributorCard: {
    borderRadius: RADIUS['3xl'],
    padding: SPACING['2xl'],
    height: 200,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  distributorDeco: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.secondary + '18',
  },
  distributorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  distributorIconBox: {
    backgroundColor: COLORS.secondary + '30',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  distributorTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  distributorSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white60,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 2,
  },
  distributorTime: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  distributorBadgeAuto: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.emerald400 + '40',
  },
  distributorBadgeAutoText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.emerald400,
    letterSpacing: 1.5,
  },

  // Bas de la carte
  distributorBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  distributorAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  distributorAvatarActive: {
    backgroundColor: COLORS.emerald800,
  },
  distributorAvatarExtra: {
    backgroundColor: COLORS.secondary,
  },
  distributorAvatarText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  activateBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    ...SHADOWS.secondary,
  },
  activateBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 1,
  },
});

export default EquipmentScreen;