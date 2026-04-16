// src/views/screens/AlertsScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    Animated,
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
    ALERT_CATEGORIES,
    ALERT_SEVERITY,
    COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
    LAYOUT,
    RADIUS, SHADOWS,
    SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 ALERT CARD
// ─────────────────────────────────────────
const AlertCard = ({ alert, onDismiss, onViewDetails }) => {
  const isScaleAnim = new Animated.Value(1);

  const severityConfig = {
    [ALERT_SEVERITY.CRITICAL]: {
      color: COLORS.error,
      bgColor: COLORS.errorContainer,
      icon: 'warning',
      label: 'Critique',
    },
    [ALERT_SEVERITY.WARNING]: {
      color: COLORS.secondary,
      bgColor: COLORS.statusWarningBg,
      icon: 'health-and-safety',
      label: 'Attention',
    },
    [ALERT_SEVERITY.INFO]: {
      color: COLORS.statusHealthy,
      bgColor: COLORS.statusHealthyBg,
      icon: 'analytics',
      label: 'Info',
    },
  };

  const config = severityConfig[alert.severity] || severityConfig[ALERT_SEVERITY.INFO];

  const handlePressIn = () => {
    Animated.spring(isScaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(isScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.alertCard, { transform: [{ scale: isScaleAnim }] }]}>
      {/* Bande colorée gauche */}
      <View style={[styles.alertBand, { backgroundColor: config.color }]} />

      <View style={styles.alertContent}>
        {/* ── En-tête */}
        <View style={styles.alertHeader}>
          <View style={styles.alertHeaderLeft}>
            <View style={[styles.alertIconBox, { backgroundColor: config.bgColor }]}>
              <MaterialIcons name={config.icon} size={20} color={config.color} />
            </View>
            <View style={styles.alertTitleBlock}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={[styles.alertLocation, { color: config.color }]}>
                {alert.location}
              </Text>
            </View>
          </View>
          <View style={styles.alertTimestamp}>
            <Text style={styles.alertTimestampText}>{alert.timestamp}</Text>
          </View>
        </View>

        {/* ── Description */}
        <Text style={styles.alertDescription}>{alert.description}</Text>

        {/* ── Boutons */}
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.alertBtnPrimary}
            onPress={() => onViewDetails(alert)}
            activeOpacity={0.85}
          >
            <Text style={styles.alertBtnPrimaryText}>Voir les détails</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.alertBtnSecondary}
            onPress={() => onDismiss(alert.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.alertBtnSecondaryText}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// 🧩 TOGGLE ROW
// ─────────────────────────────────────────
const ToggleRow = ({ label, subtitle, value, onChange }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLabelBlock}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {subtitle ? (
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{
        false: COLORS.surfaceContainerHigh,
        true: COLORS.primary,
      }}
      thumbColor={COLORS.white}
      ios_backgroundColor={COLORS.surfaceContainerHigh}
    />
  </View>
);

// ─────────────────────────────────────────
// 📱 ALERTS SCREEN
// ─────────────────────────────────────────
const AlertsScreen = ({ navigation }) => {
  const alerts               = useAppStore((s) => s.alerts);
  const notificationSettings = useAppStore((s) => s.notificationSettings);
  const unreadCount          = useAppStore((s) => s.unreadAlertsCount);
  const {
    dismissAlert,
    markAllAlertsRead,
    toggleNotificationSetting,
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState(ALERT_CATEGORIES.ALL);

  // ── Filtrage par catégorie
  const filteredAlerts = useMemo(() => {
    if (activeFilter === ALERT_CATEGORIES.ALL) return alerts;
    return alerts.filter((a) => a.category === activeFilter);
  }, [alerts, activeFilter]);

  // ── Compteurs par catégorie
  const counts = useMemo(() => ({
    all:         alerts.length,
    security:    alerts.filter((a) => a.category === ALERT_CATEGORIES.SECURITY).length,
    health:      alerts.filter((a) => a.category === ALERT_CATEGORIES.HEALTH).length,
    environment: alerts.filter((a) => a.category === ALERT_CATEGORIES.ENVIRONMENT).length,
    system:      alerts.filter((a) => a.category === ALERT_CATEGORIES.SYSTEM).length,
  }), [alerts]);

  const filterItems = [
    { key: ALERT_CATEGORIES.ALL,         label: 'Toutes',       count: counts.all },
    { key: ALERT_CATEGORIES.SECURITY,    label: 'Sécurité',     count: counts.security },
    { key: ALERT_CATEGORIES.HEALTH,      label: 'Santé',        count: counts.health },
    { key: ALERT_CATEGORIES.ENVIRONMENT, label: 'Environnement',count: counts.environment },
    { key: ALERT_CATEGORIES.SYSTEM,      label: 'Système',      count: counts.system },
  ];

  const handleViewDetails = (alert) => {
    // Navigation future vers AlertDetailScreen
    console.log('Voir détail alerte:', alert.id);
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
        <View style={styles.topBarRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllAlertsRead}
              activeOpacity={0.8}
            >
              <Text style={styles.markAllText}>Tout lire</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Smart Alerts</Text>
          <Text style={styles.screenSubtitle}>
            Real-time agricultural intelligence feed
          </Text>
        </View>

        {/* ── Filtres catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filterItems.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                activeFilter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === f.key && styles.filterChipTextActive,
              ]}>
                {f.label}
              </Text>
              {f.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  activeFilter === f.key && styles.filterBadgeActive,
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    activeFilter === f.key && styles.filterBadgeTextActive,
                  ]}>
                    {f.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Liste alertes */}
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="notifications-off"
              size={56}
              color={COLORS.outlineVariant}
            />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptySubtitle}>
              Tout est sous contrôle dans cette catégorie.
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
                onViewDetails={handleViewDetails}
              />
            ))}
          </View>
        )}

        {/* ── Séparateur */}
        <View style={styles.divider} />

        {/* ── Paramètres notifications */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsHeader}>
            <MaterialIcons name="settings-suggest" size={22} color={COLORS.primary} />
            <Text style={styles.settingsTitle}>Paramètres de notification</Text>
          </View>

          <View style={styles.settingsCard}>
            {/* Emergency Override */}
            <ToggleRow
              label="Priorité d'urgence"
              subtitle="Passer outre le mode silencieux pour les alertes critiques"
              value={notificationSettings.emergencyOverride}
              onChange={() => toggleNotificationSetting('emergencyOverride')}
            />

            <View style={styles.settingsDivider} />

            {/* Par catégorie */}
            <Text style={styles.settingsCategoryTitle}>Par catégorie</Text>

            <ToggleRow
              label="Alertes sécurité"
              value={notificationSettings.security}
              onChange={() => toggleNotificationSetting('security')}
            />
            <ToggleRow
              label="Surveillance santé"
              value={notificationSettings.health}
              onChange={() => toggleNotificationSetting('health')}
            />
            <ToggleRow
              label="Capteurs environnement"
              value={notificationSettings.environment}
              onChange={() => toggleNotificationSetting('environment')}
            />
            <ToggleRow
              label="État du système"
              value={notificationSettings.system}
              onChange={() => toggleNotificationSetting('system')}
            />
          </View>
        </View>

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
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  markAllBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white10,
    borderRadius: RADIUS.sm,
  },
  markAllText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.emerald400,
  },
  notifBtn: {
    padding: SPACING.xs,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
  },

  // ── Titre
  titleSection: {
    marginBottom: SPACING.xl,
  },
  screenTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Filtres
  filtersRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
    paddingRight: SPACING['2xl'],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: COLORS.white20,
  },
  filterBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  filterBadgeTextActive: {
    color: COLORS.white,
  },

  // ── Alert Card
  alertsList: { gap: SPACING.lg },
  alertCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  alertBand: {
    width: 5,
  },
  alertContent: {
    flex: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  alertHeader: {
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
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleBlock: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: -0.2,
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
  alertActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  alertBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnPrimaryText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  alertBtnSecondary: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnSecondaryText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
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

  // ── Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant + '40',
    marginVertical: SPACING['3xl'],
  },

  // ── Settings
  settingsSection: {
    gap: SPACING.lg,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingsTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    gap: SPACING.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  settingsCategoryTitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },

  // ── Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  toggleLabelBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  toggleSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default AlertsScreen;