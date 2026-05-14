// src/views/screens/AlertsScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import {
  ALERT_CATEGORIES,
  ALERT_SEVERITY,
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 CONFIG PAR SÉVÉRITÉ
// ─────────────────────────────────────────
const getSeverityConfig = (severity) => {
  const map = {
    [ALERT_SEVERITY.CRITICAL]: {
      color:   COLORS.error,
      bgColor: COLORS.errorContainer,
      icon:    'warning',
      label:   'Critique',
    },
    [ALERT_SEVERITY.WARNING]: {
      color:   COLORS.secondary,
      bgColor: COLORS.statusWarningBg,
      icon:    'health-and-safety',
      label:   'Attention',
    },
    [ALERT_SEVERITY.INFO]: {
      color:   COLORS.statusHealthy,
      bgColor: COLORS.statusHealthyBg,
      icon:    'analytics',
      label:   'Info',
    },
  };
  return map[severity] || map[ALERT_SEVERITY.INFO];
};

// ─────────────────────────────────────────
// 🧩 ALERT CARD — standard
// ─────────────────────────────────────────
const AlertCard = ({ alert, onDismiss, onMarkRead }) => {
  const config = getSeverityConfig(alert.severity);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !alert.isRead && onMarkRead && onMarkRead(alert.id)}
    >
      <Animated.View style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}>
        <View style={[styles.alertBand, { backgroundColor: config.color }]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderLeft}>
              <View style={styles.alertIconWrapper}>
                <View style={[styles.alertIconBox, { backgroundColor: config.bgColor }]}>
                  <MaterialIcons name={config.icon} size={20} color={config.color} />
                </View>
                {!alert.isRead && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.alertTitleBlock}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.isRead && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>Nouveau</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.alertLocation, { color: config.color }]}>
                  {alert.location}
                </Text>
              </View>
            </View>
            <View style={styles.alertTimestamp}>
              <Text style={styles.alertTimestampText}>{alert.timestamp}</Text>
            </View>
          </View>

          <Text style={styles.alertDescription}>{alert.description}</Text>

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertBtnSecondary}
              onPress={() => onDismiss(alert.id)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.alertBtnSecondaryText}>Ignorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────
// 🧩 ACCOUNT REQUEST CARD — carte spéciale pour demandes de compte
// ─────────────────────────────────────────
const AccountRequestCard = ({ alert, onDismiss, onMarkRead, onNavigateToUsers }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => !alert.isRead && onMarkRead && onMarkRead(alert.id)}
  >
    <View style={[styles.alertCard, styles.accountCard, !alert.isRead && styles.alertCardUnread]}>
      {/* Bande verte pour distinguer des alertes système */}
      <View style={[styles.alertBand, { backgroundColor: COLORS.primary }]} />

      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <View style={styles.alertHeaderLeft}>
            <View style={styles.alertIconWrapper}>
              <View style={[styles.alertIconBox, { backgroundColor: COLORS.emerald50 }]}>
                <MaterialIcons name="person-add" size={20} color={COLORS.primary} />
              </View>
              {!alert.isRead && <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />}
            </View>
            <View style={styles.alertTitleBlock}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                {!alert.isRead && (
                  <View style={[styles.unreadBadge, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.unreadBadgeText}>Action requise</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.alertLocation, { color: COLORS.primary }]}>
                {alert.meta?.userName || alert.location}
              </Text>
            </View>
          </View>
          <View style={styles.alertTimestamp}>
            <Text style={styles.alertTimestampText}>{alert.timestamp}</Text>
          </View>
        </View>

        <Text style={styles.alertDescription}>{alert.description}</Text>

        {/* Email de l'éleveur */}
        {alert.meta?.userEmail && (
          <View style={styles.accountEmailRow}>
            <MaterialIcons name="mail-outline" size={14} color={COLORS.primary} />
            <Text style={styles.accountEmailText}>{alert.meta.userEmail}</Text>
          </View>
        )}

        {/* Actions : Voir la demande + Ignorer */}
        <View style={styles.alertActionsRow}>
          <TouchableOpacity
            style={styles.alertBtnSecondary}
            onPress={() => onDismiss(alert.id)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={14} color={COLORS.onSurfaceVariant} />
            <Text style={styles.alertBtnSecondaryText}>Ignorer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountActionBtn}
            onPress={() => {
              onMarkRead && onMarkRead(alert.id);
              onNavigateToUsers();
            }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="how-to-reg" size={15} color={COLORS.white} />
            <Text style={styles.accountActionBtnText}>Voir la demande</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// 📱 ALERTS SCREEN
// ─────────────────────────────────────────
const AlertsScreen = ({ navigation }) => {
  const alerts      = useAppStore((s) => s.alerts);
  const unreadCount = useAppStore((s) => s.unreadAlertsCount);
  const {
    dismissAlert,
    dismissAllAlerts,
    markAllAlertsRead,
    markAlertRead,
    fetchAlerts,
  } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  // Séparer les alertes de compte des alertes système
  const accountAlerts = alerts.filter((a) => a.category === ALERT_CATEGORIES.ACCOUNT);
  const systemAlerts  = alerts.filter((a) => a.category !== ALERT_CATEGORIES.ACCOUNT);

  const navigateToUsers = () => {
    // Navigation vers UserManagement depuis l'onglet Admin
    navigation.navigate('UserManagement');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarTitle}>Alertes</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="notifications" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statCardUnread]}>
            <View style={styles.statDotIcon}>
              <MaterialIcons name="mark-email-unread" size={22} color={COLORS.secondary} />
              {unreadCount > 0 && <View style={styles.statUnreadDot} />}
            </View>
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Non lues</Text>
          </View>
          {accountAlerts.length > 0 && (
            <TouchableOpacity
              style={[styles.statCard, styles.statCardAccount]}
              onPress={navigateToUsers}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-add" size={22} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{accountAlerts.length}</Text>
              <Text style={styles.statLabel}>Demandes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Boutons d'action ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnRead]}
            onPress={() => { if (typeof markAllAlertsRead === 'function') markAllAlertsRead(); }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="done-all" size={16} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Tout lire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelete]}
            onPress={dismissAllAlerts}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-sweep" size={16} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Supprimer tous</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section Demandes de compte (si existantes) ── */}
        {accountAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="person-add" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Demandes de compte</Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{accountAlerts.length}</Text>
              </View>
            </View>
            <View style={styles.alertsList}>
              {accountAlerts.map((alert) => (
                <AccountRequestCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={dismissAlert}
                  onMarkRead={markAlertRead}
                  onNavigateToUsers={navigateToUsers}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Section Alertes système ── */}
        {systemAlerts.length > 0 && (
          <View style={styles.section}>
            {accountAlerts.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="notifications" size={16} color={COLORS.onSurfaceVariant} />
                  <Text style={[styles.sectionTitle, { color: COLORS.onSurfaceVariant }]}>
                    Alertes système
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.alertsList}>
              {systemAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={dismissAlert}
                  onMarkRead={markAlertRead}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Empty state ── */}
        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-off" size={56} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptySubtitle}>Tout est sous contrôle.</Text>
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.emerald950,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center' },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'] },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  statCardUnread: {
    borderWidth: 1,
    borderColor: COLORS.secondary + '33',
  },
  statCardAccount: {
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  statDotIcon:  { position: 'relative' },
  statUnreadDot: {
    position: 'absolute',
    top: -2, right: -4,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  statValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Action buttons ──
  actionsRow: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING['2xl'] },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  actionBtnRead:   { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '44' },
  actionBtnDelete: { backgroundColor: COLORS.error   + '10', borderColor: COLORS.error   + '44' },
  actionBtnText:   {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // ── Sections ──
  section:       { marginBottom: SPACING['2xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sectionTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 22,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ── Alert Card ──
  alertsList: { gap: SPACING.md },
  alertCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  alertCardUnread: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1.5,
    borderColor: COLORS.secondary + '55',
  },
  accountCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  alertBand:    { width: 5 },
  alertContent: { flex: 1, padding: SPACING.xl, gap: SPACING.md },
  alertHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  alertIconWrapper: { position: 'relative' },
  alertIconBox: {
    width: 40, height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -4, right: -4,
    width: 13, height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.secondary,
    borderWidth: 2.5,
    borderColor: COLORS.surfaceContainer,
  },
  alertTitleBlock: { flex: 1 },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  alertTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  unreadBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertLocation: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  alertTimestamp: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginLeft: SPACING.sm,
  },
  alertTimestampText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  alertDescription: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },

  // ── Account card extras ──
  accountEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.emerald50,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  accountEmailText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },

  // ── Alert Actions ──
  alertActions:    { flexDirection: 'row', marginTop: SPACING.xs },
  alertActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  alertBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  alertBtnSecondaryText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  accountActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  accountActionBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ── Empty state ──
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
});

export default AlertsScreen;