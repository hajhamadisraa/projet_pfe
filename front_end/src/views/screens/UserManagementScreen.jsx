// src/views/screens/UserManagementScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS, LAYOUT,
  RADIUS, SHADOWS,
  SPACING,
} from '../../models/utils/constants';
import { MOCK_USERS, MOCK_USER_STATS } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🧩 BADGE RÔLE
// ─────────────────────────────────────────
const RoleBadge = ({ type, label }) => {
  const config = {
    admin:    { bg: COLORS.primary + '20',   text: COLORS.primary },
    operator: { bg: '#EFF6FF',               text: '#1D4ED8' },
    reader:   { bg: COLORS.surfaceContainerHigh, text: COLORS.onSurfaceVariant },
  };
  const c = config[type] || config.reader;

  return (
    <View style={[styles.roleBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.roleBadgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 USER CARD
// ─────────────────────────────────────────
const UserCard = ({ user, onToggle }) => (
  <TouchableOpacity
    style={styles.userCard}
    activeOpacity={0.85}
    onPress={() => {}}
  >
    <View style={styles.userCardLeft}>
      {/* Avatar + indicateur présence */}
      <View style={styles.avatarWrapper}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
        )}
        {/* Point présence */}
        <View style={[
          styles.presenceDot,
          { backgroundColor: user.isOnline ? COLORS.statusHealthy : COLORS.outlineVariant },
        ]} />
      </View>

      {/* Infos */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.userMeta}>
          <RoleBadge type={user.roleBadgeType} label={user.role} />
          <Text style={styles.userSeen} numberOfLines={1}>
            {user.lastSeen}
          </Text>
        </View>
      </View>
    </View>

    {/* Toggle actif */}
    <Switch
      value={user.isActive}
      onValueChange={() => onToggle(user.id)}
      trackColor={{
        false: COLORS.surfaceContainerHigh,
        true: COLORS.primary + '80',
      }}
      thumbColor={COLORS.white}
      ios_backgroundColor={COLORS.surfaceContainerHigh}
    />
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// 📱 USER MANAGEMENT SCREEN
// ─────────────────────────────────────────
const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState(MOCK_USERS);

  const handleToggleUser = (userId) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u)
    );
  };

  const activeCount    = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Gestion des Utilisateurs</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.8}>
          <MaterialIcons name="more-vert" size={22} color={COLORS.white60} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Titre éditorial */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>ADMINISTRATION</Text>
          <Text style={styles.screenTitle}>Accès & Rôles</Text>
        </View>

        {/* ── KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardGreen]}>
            <Text style={styles.kpiLabel}>Actifs</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{activeCount}</Text>
              <Text style={styles.kpiTrend}>{MOCK_USER_STATS.activeTrend}</Text>
            </View>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardRed]}>
            <Text style={styles.kpiLabel}>Suspendus</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{suspendedCount}</Text>
              <Text style={[styles.kpiTrend, { color: COLORS.error }]}>
                {MOCK_USER_STATS.suspendedLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Liste utilisateurs */}
        <View style={styles.userList}>
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onToggle={handleToggleUser}
            />
          ))}
        </View>

        {/* ── CTA Card : Configurer les rôles */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaCard}
        >
          <View style={styles.ctaDeco} />
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Configurer les Rôles</Text>
            <Text style={styles.ctaSubtitle}>
              Ajustez les permissions granulaires pour chaque catégorie d'utilisateur de votre ferme.
            </Text>
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
              <Text style={styles.ctaBtnText}>Gérer la matrice</Text>
              <MaterialIcons name="settings-suggest" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── FAB Ajouter utilisateur */}
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
    backgroundColor: COLORS.emerald900 + 'CC',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  backBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white10,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
    flex: 1,
  },
  moreBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.xl,
  },

  // ── Titre
  titleSection: { gap: 2 },
  sectionLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  screenTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // ── KPI Cards
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
    gap: SPACING.sm,
  },
  kpiCardGreen: {
    borderLeftColor: COLORS.statusHealthy,
  },
  kpiCardRed: {
    borderLeftColor: COLORS.error,
  },
  kpiLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  kpiValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },
  kpiTrend: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.statusHealthy,
  },

  // ── User List
  userList: {
    gap: SPACING.md,
  },
  userCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
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
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerLow,
  },
  userInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  userName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userSeen: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
    flexShrink: 1,
  },

  // ── CTA Card
  ctaCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING['3xl'],
    overflow: 'hidden',
    ...SHADOWS.xl,
    position: 'relative',
  },
  ctaDeco: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.secondary + '18',
  },
  ctaContent: {
    gap: SPACING.lg,
    zIndex: 1,
  },
  ctaTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white60,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.medium,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.secondary,
  },
  ctaBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── FAB
  fab: {
    position: 'absolute',
    bottom: LAYOUT.bottomNavHeight + SPACING.lg,
    right: SPACING['2xl'],
    width: LAYOUT.fabSize,
    height: LAYOUT.fabSize,
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.secondary,
  },
});

export default UserManagementScreen;