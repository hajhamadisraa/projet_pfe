// src/views/screens/EquipmentScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet, Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import {
  FONTS, FONT_SIZES, FONT_WEIGHTS,
  LAYOUT,
  RADIUS, SHADOWS,
  SPACING
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🎨 DESIGN TOKENS (fidèles au HTML)
// ─────────────────────────────────────────
const C = {
  primaryContainer: '#0A3D27',  // bg-primary-container
  primary:          '#012D1D',  // bg-primary
  primaryLight:     '#1B4332',
  secondary:        '#FE6A34',  // bg-secondary (orange)
  error:            '#B3261E',
  errorContainer:   '#F9DEDC',
  surfaceContainerLow: '#FFFFFF',
  surfaceContainerHigh:'#E8EAEB',
  surfaceVariant:   '#E1E3E4',
  onSurfaceVariant: '#44474F',
  emerald400:       '#34D399',
  emerald800:       '#065F46',
  emerald50:        '#ECFDF5',
  white:            '#FFFFFF',
  primaryFixed:     '#C8E6C9',
  primaryFixedDim:  '#A5D6A7',
  onTertiaryContainer: '#1B5E20',
};

// ─────────────────────────────────────────
// 🧩 EQUIPMENT CARD
// ─────────────────────────────────────────
const EquipmentCard = ({ item, onToggle }) => {
  const isAlert = item.mode === 'ALERTE';
  const isOn    = item.isOn;

  return (
    <View style={[
      styles.card,
      isAlert && styles.cardAlert,
    ]}>
      {/* Haut : icône + badge mode */}
      <View style={styles.cardTop}>
        <View style={[
          styles.cardIconBox,
          { backgroundColor: isAlert ? C.error + '18' : C.primary + '18' },
        ]}>
          <MaterialIcons
            name={item.icon}
            size={24}
            color={isAlert ? C.error : C.primary}
          />
        </View>
        <View style={[
          styles.modeBadge,
          isAlert  ? styles.modeBadgeAlert :
          item.mode === 'AUTO' ? styles.modeBadgeAuto : styles.modeBadgeManual,
        ]}>
          <Text style={[
            styles.modeBadgeText,
            isAlert  ? styles.modeBadgeTextAlert :
            item.mode === 'AUTO' ? styles.modeBadgeTextAuto : styles.modeBadgeTextManual,
          ]}>
            {item.mode}
          </Text>
        </View>
      </View>

      {/* Bas : nom + toggle */}
      <View>
        <Text style={[styles.cardName, isAlert && { color: C.error }]}>
          {item.name}
        </Text>
        <View style={styles.cardToggleRow}>
          <Text style={[
            styles.cardStatus,
            isAlert
              ? { color: C.error }
              : isOn
              ? { color: C.onTertiaryContainer }
              : { color: C.onSurfaceVariant },
          ]}>
            {isAlert ? 'FAIL/OFF' : isOn ? 'ON' : 'OFF'}
          </Text>
          <Switch
            value={isOn && !isAlert}
            onValueChange={() => !isAlert && onToggle(item.id)}
            trackColor={{
              false: isAlert ? C.error + '30' : C.surfaceVariant,
              true:  C.secondary + '80',
            }}
            thumbColor={C.white}
            ios_backgroundColor={C.surfaceVariant}
            disabled={isAlert}
            style={styles.switch}
          />
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 EQUIPMENT SCREEN
// ─────────────────────────────────────────
const EquipmentScreen = ({ navigation }) => {
  const user        = useAppStore((s) => s.user);
  const unreadCount = useAppStore((s) => s.unreadAlertsCount);
  const selectedCoop = useAppStore((s) => s.selectedCoop);

  const [activeFilter, setActiveFilter] = useState('all');
  const [equipment, setEquipment] = useState([
    { id: '1', name: 'Ventilateurs', icon: 'air',        mode: 'AUTO',   isOn: true  },
    { id: '2', name: 'Pad Cooling',  icon: 'ac-unit',    mode: 'MANUEL', isOn: false },
    { id: '3', name: 'Éclairage',    icon: 'lightbulb',  mode: 'AUTO',   isOn: true  },
    { id: '4', name: 'Stores',       icon: 'blinds',     mode: 'MANUEL', isOn: true  },
    { id: '5', name: 'Chauffage',    icon: 'thermostat',  mode: 'ALERTE', isOn: false },
    { id: '6', name: 'Abreuvoirs',   icon: 'water-drop', mode: 'AUTO',   isOn: true  },
  ]);

  const handleToggle = (id) => {
    setEquipment((prev) =>
      prev.map((eq) => eq.id === id ? { ...eq, isOn: !eq.isOn } : eq)
    );
  };

  const filteredEquipment = equipment.filter((eq) => {
    if (activeFilter === 'active') return eq.isOn && eq.mode !== 'ALERTE';
    if (activeFilter === 'alert')  return eq.mode === 'ALERTE';
    return true;
  });

  const filters = [
    { key: 'all',    label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'alert',  label: 'En alerte' },
  ];

  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ══ TOP APP BAR ══ */}
      <View style={styles.topBar}>
        {/* Dropdown coop */}
        <TouchableOpacity style={styles.coopDropdown} activeOpacity={0.8}>
          <Text style={styles.coopDropdownText}>
            {selectedCoop?.name?.toUpperCase() || 'POULAILLER 2'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={C.emerald400} />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.getParent()?.navigate('AlertsTab')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="notifications" size={24} color={C.emerald400} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ TITRE ══ */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Équipements</Text>
          <Text style={styles.screenSubtitle}>
            Contrôle en temps réel et automatisation
          </Text>
        </View>

        {/* ══ FILTRES ══ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterPill,
                activeFilter === f.key && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === f.key && styles.filterPillTextActive,
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ══ GRILLE ÉQUIPEMENTS 2 COLONNES ══ */}
        <View style={styles.grid}>
          {filteredEquipment.map((eq) => (
            <View key={eq.id} style={styles.gridItem}>
              <EquipmentCard item={eq} onToggle={handleToggle} />
            </View>
          ))}
        </View>

        {/* ══ GRANDE CARTE DISTRIBUTEURS ══ */}
        <LinearGradient
          colors={[C.primary, C.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.distributorCard}
        >
          {/* Décoration blur */}
          <View style={styles.distributorDeco} />

          {/* Top : infos + badge */}
          <View style={styles.distributorTop}>
            <View>
              <View style={styles.distributorIconBox}>
                <MaterialIcons name="restaurant" size={24} color={C.primaryFixedDim} />
              </View>
              <Text style={styles.distributorTitle}>Distributeurs</Text>
              <Text style={styles.distributorSubtitle}>
                Prochain cycle :{' '}
                <Text style={styles.distributorTime}>14h30</Text>
              </Text>
            </View>
            <View style={styles.distributorBadge}>
              <Text style={styles.distributorBadgeText}>AUTO</Text>
            </View>
          </View>

          {/* Bottom : avatars D1/D2/D3/+2 + bouton ACTIVER */}
          <View style={styles.distributorBottom}>
            <View style={styles.distributorAvatars}>
              {['D1', 'D2', 'D3'].map((label, i) => (
                <View
                  key={label}
                  style={[
                    styles.distributorAvatar,
                    styles.distributorAvatarGreen,
                    { marginLeft: i === 0 ? 0 : -8 },
                  ]}
                >
                  <Text style={styles.distributorAvatarText}>{label}</Text>
                </View>
              ))}
              <View style={[
                styles.distributorAvatar,
                styles.distributorAvatarOrange,
                { marginLeft: -8 },
              ]}>
                <Text style={styles.distributorAvatarText}>+2</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.activateBtn} activeOpacity={0.85}>
              <Text style={styles.activateBtnText}>ACTIVER</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },

  // ── Top Bar
  topBar: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    backgroundColor:  C.primaryContainer,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical:   SPACING.lg,
    height:            LAYOUT.topBarHeight,
  },
  coopDropdown: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: C.primary + '60',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderRadius:    RADIUS.full,
  },
  coopDropdownText: {
    fontFamily:  FONTS.inter,
    fontSize:    FONT_SIZES.sm,
    fontWeight:  FONT_WEIGHTS.bold,
    color:       C.white,
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.lg,
  },
  notifBtn: { position: 'relative', padding: SPACING.xs },
  notifDot: {
    position:        'absolute',
    top:             2, right: 2,
    width:           8, height: 8,
    borderRadius:    4,
    backgroundColor: C.secondary,
    borderWidth:     1.5,
    borderColor:     C.primaryContainer,
  },
  avatarWrapper: {
    width:        40, height: 40,
    borderRadius: 20,
    overflow:     'hidden',
    borderWidth:  2,
    borderColor:  C.primaryContainer,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    backgroundColor: C.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitials: {
    fontFamily: FONTS.manrope,
    fontSize:   FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color:      C.white,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop:        SPACING['2xl'],
    gap:               SPACING.xl,
  },

  // ── Titre
  titleSection: { gap: 4 },
  screenTitle: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES['3xl'],
    fontWeight:  FONT_WEIGHTS.extraBold,
    color:       C.primary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color:      C.onSurfaceVariant,
    opacity:    0.8,
  },

  // ── Filtres
  filtersRow: {
    gap:         SPACING.md,
    paddingRight: SPACING['2xl'],
  },
  filterPill: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical:   SPACING.sm + 2,
    backgroundColor:   C.surfaceContainerHigh,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    borderColor:       'transparent',
  },
  filterPillActive: {
    backgroundColor: C.primary,
    borderColor:     C.primary,
  },
  filterPillText: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color:      C.onSurfaceVariant,
  },
  filterPillTextActive: {
    color:      C.white,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // ── Grille 2 colonnes
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING.lg,
  },
  gridItem: {
    width: '47.5%',
  },

  // ── Equipment Card
  card: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius:    20,
    padding:         SPACING.xl,
    height:          176,
    justifyContent:  'space-between',
    ...SHADOWS.sm,
  },
  cardAlert: {
    backgroundColor: C.errorContainer,
    borderWidth:     1.5,
    borderColor:     C.error + '30',
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  cardIconBox: {
    padding:      SPACING.sm,
    borderRadius: RADIUS.lg,
  },

  // Badges mode
  modeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
  },
  modeBadgeAuto: {
    backgroundColor: C.primaryContainer,
  },
  modeBadgeManual: {
    backgroundColor: C.surfaceVariant,
  },
  modeBadgeAlert: {
    backgroundColor: C.error,
  },
  modeBadgeText: {
    fontFamily: FONTS.inter,
    fontSize:   9,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  modeBadgeTextAuto: {
    color: C.primaryFixedDim,
  },
  modeBadgeTextManual: {
    color: C.onSurfaceVariant,
  },
  modeBadgeTextAlert: {
    color: C.white,
  },

  // Nom + toggle
  cardName: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES.lg,
    fontWeight:  FONT_WEIGHTS.bold,
    color:       C.primary,
    marginBottom: SPACING.md,
  },
  cardToggleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  cardStatus: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },

  // ── Distributeur Card
  distributorCard: {
    borderRadius:  32,
    padding:       SPACING['2xl'],
    height:        210,
    justifyContent:'space-between',
    overflow:      'hidden',
    ...SHADOWS.xl,
  },
  distributorDeco: {
    position:        'absolute',
    top:             -48, right: -64,
    width:           192, height: 192,
    borderRadius:    96,
    backgroundColor: C.secondary + '18',
  },
  distributorTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    zIndex:         1,
  },
  distributorIconBox: {
    backgroundColor: C.secondary + '30',
    padding:         SPACING.md,
    borderRadius:    RADIUS.xl,
    alignSelf:       'flex-start',
    marginBottom:    SPACING.md,
  },
  distributorTitle: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES['2xl'],
    fontWeight:  FONT_WEIGHTS.bold,
    color:       C.white,
    letterSpacing: -0.3,
  },
  distributorSubtitle: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    color:      C.primaryFixedDim,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop:  2,
  },
  distributorTime: {
    fontWeight: FONT_WEIGHTS.bold,
    color:      C.white,
  },
  distributorBadge: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    borderColor:       C.emerald400 + '35',
  },
  distributorBadgeText: {
    fontFamily:  FONTS.inter,
    fontSize:    FONT_SIZES.xs,
    fontWeight:  FONT_WEIGHTS.extraBold,
    color:       C.emerald400,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  distributorBottom: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    zIndex:         1,
  },
  distributorAvatars: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  distributorAvatar: {
    width:          32, height: 32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    2,
    borderColor:    C.primary,
  },
  distributorAvatarGreen: {
    backgroundColor: C.emerald800,
  },
  distributorAvatarOrange: {
    backgroundColor: C.secondary,
  },
  distributorAvatarText: {
    fontFamily: FONTS.inter,
    fontSize:   9,
    fontWeight: FONT_WEIGHTS.bold,
    color:      C.white,
  },
  activateBtn: {
    backgroundColor:   C.secondary,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical:   SPACING.md,
    borderRadius:      RADIUS.xl,
    shadowColor:       C.secondary,
    shadowOffset:      { width: 0, height: 6 },
    shadowOpacity:     0.3,
    shadowRadius:      12,
    elevation:         8,
  },
  activateBtnText: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES.sm,
    fontWeight:  FONT_WEIGHTS.bold,
    color:       C.white,
    letterSpacing: 1,
  },
});

export default EquipmentScreen;