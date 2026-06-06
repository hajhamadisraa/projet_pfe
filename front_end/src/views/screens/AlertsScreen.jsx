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
// CONFIG PAR SÉVÉRITÉ
// ─────────────────────────────────────────
const getSeverityConfig = (severity) => {
  const map = {
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
  return map[severity] || map[ALERT_SEVERITY.INFO];
};

// ─────────────────────────────────────────
// CONFIG CATÉGORIE ÉLEVEUR
// ─────────────────────────────────────────
const getBreederCategoryConfig = (category) => {
  const map = {
    temperature: {
      color: COLORS.error,
      bgColor: COLORS.errorContainer,
      icon: 'thermostat',
      label: 'Température',
      accent: '#FF6B35',
    },
    reservoir: {
      color: '#1565C0',
      bgColor: '#E3F2FD',
      icon: 'water-drop',
      label: 'Réservoir',
      accent: '#1565C0',
    },
    fan: {
      color: COLORS.secondary,
      bgColor: COLORS.statusWarningBg,
      icon: 'air',
      label: 'Ventilation',
      accent: COLORS.secondary,
    },
  };
  return map[category] || null;
};

// ─────────────────────────────────────────
// ALERT CARD GÉNÉRIQUE
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
// TEMPERATURE ALERT CARD (Seuil dépassé)
// ─────────────────────────────────────────
const TemperatureAlertCard = ({ alert, onDismiss, onMarkRead }) => {
  const isAbove = alert.meta?.direction === 'above';
  const currentTemp = alert.meta?.currentTemp;
  const threshold = alert.meta?.threshold;
  const sensorName = alert.meta?.sensorName || alert.location;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !alert.isRead && onMarkRead && onMarkRead(alert.id)}
    >
      <View style={[styles.alertCard, styles.tempCard, !alert.isRead && styles.alertCardUnread]}>
        <View style={[styles.alertBand, { backgroundColor: COLORS.error }]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderLeft}>
              <View style={styles.alertIconWrapper}>
                <View style={[styles.alertIconBox, { backgroundColor: COLORS.errorContainer }]}>
                  <MaterialIcons name="thermostat" size={20} color={COLORS.error} />
                </View>
                {!alert.isRead && <View style={[styles.unreadDot, { backgroundColor: COLORS.error }]} />}
              </View>
              <View style={styles.alertTitleBlock}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.isRead && (
                    <View style={[styles.unreadBadge, { backgroundColor: COLORS.error }]}>
                      <Text style={styles.unreadBadgeText}>Critique</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.alertLocation, { color: COLORS.error }]}>{sensorName}</Text>
              </View>
            </View>
            <View style={styles.alertTimestamp}>
              <Text style={styles.alertTimestampText}>{alert.timestamp}</Text>
            </View>
          </View>

          <Text style={styles.alertDescription}>{alert.description}</Text>

          {(currentTemp !== undefined && threshold !== undefined) && (
            <View style={styles.tempGaugeRow}>
              <View style={styles.tempGaugeItem}>
                <MaterialIcons name={isAbove ? 'arrow-upward' : 'arrow-downward'} size={16} color={COLORS.error} />
                <Text style={styles.tempGaugeValue}>{currentTemp}°C</Text>
                <Text style={styles.tempGaugeLabel}>Actuelle</Text>
              </View>
              <View style={styles.tempGaugeDivider} />
              <View style={styles.tempGaugeItem}>
                <MaterialIcons name="straighten" size={16} color={COLORS.onSurfaceVariant} />
                <Text style={[styles.tempGaugeValue, { color: COLORS.onSurfaceVariant }]}>{threshold}°C</Text>
                <Text style={styles.tempGaugeLabel}>Seuil</Text>
              </View>
              <View style={styles.tempGaugeDivider} />
              <View style={styles.tempGaugeItem}>
                <MaterialIcons name="trending-up" size={16} color={COLORS.error} />
                <Text style={styles.tempGaugeValue}>
                  {isAbove ? '+' : '-'}{Math.abs(currentTemp - threshold).toFixed(1)}°C
                </Text>
                <Text style={styles.tempGaugeLabel}>Écart</Text>
              </View>
            </View>
          )}

          <View style={styles.alertActionsRow}>
            <TouchableOpacity style={styles.alertBtnSecondary} onPress={() => onDismiss(alert.id)}>
              <MaterialIcons name="close" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.alertBtnSecondaryText}>Ignorer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.breederActionBtn, { backgroundColor: COLORS.error }]}
              onPress={() => {
                onMarkRead && onMarkRead(alert.id);
                // TODO: navigation vers détails capteur
              }}
            >
              <MaterialIcons name="sensors" size={15} color={COLORS.white} />
              <Text style={styles.breederActionBtnText}>Voir le capteur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────
// FAN ALERT CARD (Activation / Désactivation manuelle)
// ─────────────────────────────────────────
const FanAlertCard = ({ alert, onDismiss, onMarkRead }) => {
  const fanState = alert.meta?.fanState; // 'activated' | 'deactivated'
  const fanName = alert.meta?.fanName || alert.location;
  const isOn = fanState === 'activated';

  const FAN_COLOR = isOn ? COLORS.secondary : '#757575';
  const FAN_BG = isOn ? COLORS.statusWarningBg : COLORS.surfaceContainerHigh;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !alert.isRead && onMarkRead && onMarkRead(alert.id)}
    >
      <View style={[styles.alertCard, styles.fanCard, !alert.isRead && styles.alertCardUnread]}>
        <View style={[styles.alertBand, { backgroundColor: FAN_COLOR }]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderLeft}>
              <View style={styles.alertIconWrapper}>
                <View style={[styles.alertIconBox, { backgroundColor: FAN_BG }]}>
                  <MaterialIcons name="air" size={20} color={FAN_COLOR} />
                </View>
                {!alert.isRead && <View style={[styles.unreadDot, { backgroundColor: FAN_COLOR }]} />}
              </View>
              <View style={styles.alertTitleBlock}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.isRead && (
                    <View style={[styles.unreadBadge, { backgroundColor: FAN_COLOR }]}>
                      <Text style={styles.unreadBadgeText}>Manuel</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.alertLocation, { color: FAN_COLOR }]}>{fanName}</Text>
              </View>
            </View>
            <View style={styles.alertTimestamp}>
              <Text style={styles.alertTimestampText}>{alert.timestamp}</Text>
            </View>
          </View>

          <Text style={styles.alertDescription}>{alert.description}</Text>

          <View style={[styles.fanStatusRow, { backgroundColor: FAN_BG, borderColor: FAN_COLOR + '44' }]}>
            <MaterialIcons name={isOn ? 'toggle-on' : 'toggle-off'} size={24} color={FAN_COLOR} />
            <Text style={[styles.fanStatusText, { color: FAN_COLOR }]}>
              Ventilateur {isOn ? 'activé manuellement' : 'désactivé manuellement'}
            </Text>
            <View style={[styles.fanStatusDot, { backgroundColor: isOn ? '#4CAF50' : '#9E9E9E' }]} />
          </View>

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
      </View>
    </TouchableOpacity>
  );
};

// (Les autres cartes Reservoir et Account restent inchangées)
const ReservoirAlertCard = ({ alert, onDismiss, onMarkRead }) => { /* ... code existant ... */ };
const AccountRequestCard = ({ alert, onDismiss, onMarkRead, onNavigateToUsers }) => { /* ... code existant ... */ };

// ─────────────────────────────────────────
// ROUTER DE CARTES
// ─────────────────────────────────────────
const AlertCardRouter = ({ alert, onDismiss, onMarkRead, onNavigateToUsers }) => {
  switch (alert.category) {
    case ALERT_CATEGORIES.ACCOUNT:
      return <AccountRequestCard alert={alert} onDismiss={onDismiss} onMarkRead={onMarkRead} onNavigateToUsers={onNavigateToUsers} />;
    case 'temperature':
      return <TemperatureAlertCard alert={alert} onDismiss={onDismiss} onMarkRead={onMarkRead} />;
    case 'reservoir':
      return <ReservoirAlertCard alert={alert} onDismiss={onDismiss} onMarkRead={onMarkRead} />;
    case 'fan':
      return <FanAlertCard alert={alert} onDismiss={onDismiss} onMarkRead={onMarkRead} />;
    default:
      return <AlertCard alert={alert} onDismiss={onDismiss} onMarkRead={onMarkRead} />;
  }
};

// ─────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────
const AlertsScreen = ({ navigation }) => {
  const alerts = useAppStore((s) => s.alerts);
  const unreadCount = useAppStore((s) => s.unreadAlertsCount);
  const { dismissAlert, dismissAllAlerts, markAllAlertsRead, markAlertRead, fetchAlerts } = useAppStore();

  useFocusEffect(useCallback(() => { fetchAlerts(); }, []));

  const accountAlerts = alerts.filter(a => a.category === ALERT_CATEGORIES.ACCOUNT);
  const temperatureAlerts = alerts.filter(a => a.category === 'temperature');
  const reservoirAlerts = alerts.filter(a => a.category === 'reservoir');
  const fanAlerts = alerts.filter(a => a.category === 'fan');
  const systemAlerts = alerts.filter(a => !['temperature', 'reservoir', 'fan', ALERT_CATEGORIES.ACCOUNT].includes(a.category));

  const urgentBreederAlerts = [...temperatureAlerts, ...reservoirAlerts];
  const manualFanAlerts = fanAlerts;

  const navigateToUsers = () => navigation.navigate('UserManagement');

  const renderSection = (title, icon, color, alertList, badge = false) => {
    if (alertList.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name={icon} size={16} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          </View>
          {badge && (
            <View style={[styles.sectionBadge, { backgroundColor: color }]}>
              <Text style={styles.sectionBadgeText}>{alertList.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.alertsList}>
          {alertList.map(alert => (
            <AlertCardRouter
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
              onMarkRead={markAlertRead}
              onNavigateToUsers={navigateToUsers}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Mes Alertes</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats & Actions ... (inchangé) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="notifications" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statCardUnread]}>
            <MaterialIcons name="mark-email-unread" size={22} color={COLORS.secondary} />
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Non lues</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRead]} onPress={markAllAlertsRead}>
            <MaterialIcons name="done-all" size={16} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Tout lire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={dismissAllAlerts}>
            <MaterialIcons name="delete-sweep" size={16} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Supprimer tous</Text>
          </TouchableOpacity>
        </View>

        {renderSection('Alertes urgentes', 'priority-high', COLORS.error, urgentBreederAlerts, true)}
        {renderSection('Ventilation manuelle', 'air', COLORS.secondary, manualFanAlerts, true)}
        {renderSection('Demandes de compte', 'person-add', COLORS.primary, accountAlerts, true)}
        {renderSection('Alertes système', 'notifications', COLORS.onSurfaceVariant, systemAlerts)}

        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-off" size={56} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptySubtitle}>Tout est sous contrôle.</Text>
          </View>
        )}
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
  statDotIcon:   { position: 'relative' },
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

  // ── Alert Card base ──
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
  tempCard: {
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  reservoirCard: {
    borderWidth: 1,
    borderColor: '#1565C030',
  },
  fanCard: {
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
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

  // ── Temperature card ──
  tempGaugeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.errorContainer,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tempGaugeItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  tempGaugeDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.error + '33',
  },
  tempGaugeValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.error,
    letterSpacing: -0.5,
  },
  tempGaugeLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Reservoir card ──
  reservoirLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  reservoirLevelLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: '#1565C0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 40,
  },
  reservoirBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#BBDEFB',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  reservoirBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  reservoirLevelValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.extraBold,
    minWidth: 36,
    textAlign: 'right',
  },
  reservoirCapacity: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
  },

  // ── Fan card ──
  fanStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
  },
  fanStatusText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    flex: 1,
  },
  fanStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Account card ──
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
  breederActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  breederActionBtnText: {
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