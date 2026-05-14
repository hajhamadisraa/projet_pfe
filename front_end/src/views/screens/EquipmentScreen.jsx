// src/views/screens/EquipmentScreen.jsx
// ✅ ÉTAPE 5 — Ventilateur connecté à l'ESP32 via MQTT
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import useActuators from '../../controllers/hooks/useActuators';
import useRealtimeSensors from '../../controllers/hooks/useRealtimeSensors';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  LAYOUT, RADIUS, ROUTES, SHADOWS, SPACING,
} from '../../models/utils/constants';

// ═══════════════════════════════════════════════════════════════
//  🌡️  NORMES CLIMATIQUES POULAILLER
//  Références : standards avicoles internationaux
// ═══════════════════════════════════════════════════════════════
const THRESHOLDS = {
  fan: {
    critical:  35,   // T > 35°C → ventilo obligatoire + alerte
    high:      30,   // T > 30°C → ventilo ON
    ideal_max: 27,   // T > 27°C → ventilo recommandé
    ideal_min: 18,   // T < 18°C → ventilo OFF
  },
};

// Calcule l'état auto du ventilateur selon la température
const getAutoFanState = (temperature) => {
  if (temperature == null || isNaN(temperature)) {
    return { on: false, reason: 'Capteur indisponible', color: COLORS.outline };
  }
  if (temperature >= THRESHOLDS.fan.critical) {
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Critique !`,   color: COLORS.error };
  }
  if (temperature >= THRESHOLDS.fan.high) {
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Chaleur`,      color: COLORS.secondary };
  }
  if (temperature >= THRESHOLDS.fan.ideal_max) {
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Au-dessus idéal`, color: COLORS.warning };
  }
  if (temperature <= THRESHOLDS.fan.ideal_min) {
    return { on: false, reason: `T°=${temperature.toFixed(1)}°C — Zone froide`,  color: '#378ADD' };
  }
  return { on: false,   reason: `T°=${temperature.toFixed(1)}°C — Zone idéale ✓`, color: COLORS.statusHealthy };
};

// ─────────────────────────────────────────
// 🧩 MODE TOGGLE
// ─────────────────────────────────────────
const ModeToggle = ({ mode, onToggle, color = COLORS.primary, disabled }) => (
  <View style={[styles.modeToggleWrapper, disabled && { opacity: 0.5 }]}>
    <TouchableOpacity
      style={[styles.modeBtn, mode === 'auto' && { backgroundColor: COLORS.white }]}
      onPress={() => !disabled && onToggle('auto')}
      activeOpacity={0.8}
    >
      <Text style={[styles.modeBtnText, mode === 'auto' && { color }]}>AUTO</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.modeBtn, mode === 'manuel' && { backgroundColor: COLORS.white }]}
      onPress={() => !disabled && onToggle('manuel')}
      activeOpacity={0.8}
    >
      <Text style={[styles.modeBtnText, mode === 'manuel' && { color }]}>MANUEL</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────
// 🧩 PREVIEW ROW
// ─────────────────────────────────────────
const PreviewRow = ({ items }) => (
  <View style={styles.previewRow}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <View style={styles.previewSep} />}
        <View style={styles.previewItem}>
          <MaterialIcons name={item.icon} size={14} color={item.color || COLORS.onSurfaceVariant} />
          <Text style={[styles.previewValue, item.color && { color: item.color }]}>{item.value}</Text>
          <Text style={styles.previewLabel}>{item.label}</Text>
        </View>
      </React.Fragment>
    ))}
  </View>
);

// ─────────────────────────────────────────
// 🧩 RESERVOIR GRID
// ─────────────────────────────────────────
const TANK_H = 60;
const getReservoirColor = (l) => l > 60 ? COLORS.statusHealthy : l > 20 ? '#F59E0B' : COLORS.error;
const getReservoirLabel = (l) => l > 60 ? 'OK' : l > 20 ? 'Bas' : 'Critique';

const ReservoirGrid = ({ reservoirs }) => {
  const okCount       = reservoirs.filter((r) => r.level > 60).length;
  const warnCount     = reservoirs.filter((r) => r.level > 20 && r.level <= 60).length;
  const criticalCount = reservoirs.filter((r) => r.level <= 20).length;

  return (
    <View style={rStyles.wrapper}>
      <View style={rStyles.header}>
        <MaterialIcons name="water-drop" size={13} color={COLORS.onSurfaceVariant} />
        <Text style={rStyles.headerTitle}>{reservoirs.length} Réservoirs</Text>
        <View style={rStyles.headerSummary}>
          {okCount > 0 && <View style={[rStyles.summaryPill, { backgroundColor: COLORS.statusHealthy + '20' }]}><View style={[rStyles.summaryDot, { backgroundColor: COLORS.statusHealthy }]} /><Text style={[rStyles.summaryText, { color: COLORS.statusHealthy }]}>{okCount}</Text></View>}
          {warnCount > 0 && <View style={[rStyles.summaryPill, { backgroundColor: '#F59E0B20' }]}><View style={[rStyles.summaryDot, { backgroundColor: '#F59E0B' }]} /><Text style={[rStyles.summaryText, { color: '#F59E0B' }]}>{warnCount}</Text></View>}
          {criticalCount > 0 && <View style={[rStyles.summaryPill, { backgroundColor: COLORS.error + '20' }]}><View style={[rStyles.summaryDot, { backgroundColor: COLORS.error }]} /><Text style={[rStyles.summaryText, { color: COLORS.error }]}>{criticalCount}</Text></View>}
        </View>
      </View>
      <View style={rStyles.grid}>
        {reservoirs.map((r) => {
          const color      = getReservoirColor(r.level);
          const fillHeight = Math.max(2, Math.round(TANK_H * r.level / 100));
          return (
            <View key={r.id} style={rStyles.item}>
              <View style={rStyles.tank}>
                <View style={[rStyles.tankFill, { height: fillHeight, backgroundColor: color + '45' }]} />
                <View style={[rStyles.tankSurface, { bottom: fillHeight - 2, backgroundColor: color }]} />
              </View>
              <Text style={[rStyles.level, { color }]}>{r.level}%</Text>
              <Text style={rStyles.name}>{r.label}</Text>
              <View style={[rStyles.pill, { backgroundColor: color + '20' }]}>
                <Text style={[rStyles.pillText, { color }]}>{getReservoirLabel(r.level)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 EQUIPMENT CARD GÉNÉRIQUE
// ─────────────────────────────────────────
const EquipmentCard = ({
  icon, title, mode, onModeToggle, running, loading,
  onStart, onStop, previewItems, autoReason, children,
}) => {
  const isManual    = mode === 'manuel';
  const accentColor = running
    ? (isManual ? COLORS.secondary : COLORS.statusHealthy)
    : COLORS.outline;

  return (
    <View style={[styles.card, { borderLeftColor: running ? accentColor : COLORS.outlineVariant }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconWrapper, { backgroundColor: accentColor + '1A' }]}>
            {loading
              ? <ActivityIndicator size="small" color={accentColor} />
              : <MaterialIcons name={icon} size={24} color={accentColor} />
            }
          </View>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: running ? accentColor : COLORS.outlineVariant }]} />
              <Text style={[styles.statusText, { color: accentColor }]}>
                {isManual
                  ? (running ? 'Actif — Manuel' : 'Arrêté — Manuel')
                  : (running ? 'EN COURS — Auto' : 'EN ATTENTE — Auto')}
              </Text>
            </View>
          </View>
        </View>
        <ModeToggle mode={mode} onToggle={onModeToggle} color={accentColor} disabled={loading} />
      </View>

      {/* Preview */}
      {previewItems?.length > 0 && <PreviewRow items={previewItems} />}

      {/* Raison auto */}
      {!isManual && autoReason && (
        <View style={styles.autoReasonBox}>
          <MaterialIcons name="smart-toy" size={13} color={COLORS.primary} />
          <Text style={styles.autoReasonText}>{autoReason}</Text>
        </View>
      )}

      {children}

      {/* Footer */}
      <View style={styles.cardFooter}>
        {isManual ? (
          <View style={styles.manualActions}>
            <TouchableOpacity
              style={[styles.manualBtn, { backgroundColor: running ? COLORS.outlineVariant : COLORS.statusHealthy }, running && styles.manualBtnDisabled]}
              onPress={onStart} disabled={running || loading} activeOpacity={0.85}
            >
              {loading && !running
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <MaterialIcons name="play-arrow" size={16} color={COLORS.white} />
              }
              <Text style={styles.manualBtnText}>DÉMARRER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.manualBtn, { backgroundColor: running ? COLORS.secondary : COLORS.outlineVariant }, !running && styles.manualBtnDisabled]}
              onPress={onStop} disabled={!running || loading} activeOpacity={0.85}
            >
              {loading && running
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <MaterialIcons name="stop" size={16} color={COLORS.white} />
              }
              <Text style={styles.manualBtnText}>ARRÊTER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footerCenter}>
            {running && <View style={[styles.activeIndicator, { backgroundColor: accentColor }]} />}
            <Text style={[styles.activeText, { color: running ? accentColor : COLORS.onSurfaceVariant, opacity: running ? 1 : 0.4 }]}>
              {running ? 'EN COURS...' : 'EN ATTENTE'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 EQUIPMENT SCREEN
// ─────────────────────────────────────────
const EquipmentScreen = ({ navigation }) => {
  const user         = useAppStore((s) => s.user);
  const unreadCount  = useAppStore((s) => s.unreadAlertsCount);
  const selectedCoop = useAppStore((s) => s.selectedCoop);
console.log('[DEBUG] selectedCoop.espMac =', selectedCoop?.espMac); // ← ajouter

  // ── Données temps réel capteurs ─────────────────────────────
  const { sensors } = useRealtimeSensors(selectedCoop?.id);
  const temperature  = sensors?.temperature?.value ?? null;

  // ── Commandes actionneurs ────────────────────────────────────
  // Remplace l'appel existant au hook :
// ✅ 1. autoFan en premier
const autoFan = useMemo(() => getAutoFanState(temperature), [temperature]);

// ✅ 2. useActuators ensuite avec autoFan.on
const { actuators, sendCommand, setMode } = useActuators(
  selectedCoop?.id,
  selectedCoop?.espMac,
  { fan: autoFan.on }
);

// ✅ 3. Protection ?. au cas où actuators n'est pas encore initialisé
const fanRunning = actuators?.fan?.mode === 'auto'
  ? autoFan.on
  : (actuators?.fan?.on ?? false);

  // ── Équipements non ESP32 (mock pour l'instant) ──────────────
  const [mockEquip, setMockEquip] = useState({
    padCooling: { mode: 'auto',   running: false },
    eclairage:  { mode: 'manuel', running: false },
    stores:     { mode: 'auto',   running: true  },
    chauffage:  { mode: 'auto',   running: false },
    abreuvoirs: {
      mode: 'auto', running: true,
      reservoirs: [
        { id: 1, label: 'R-01', level: 85 }, { id: 2, label: 'R-02', level: 42 },
        { id: 3, label: 'R-03', level: 12 }, { id: 4, label: 'R-04', level: 91 },
        { id: 5, label: 'R-05', level: 67 }, { id: 6, label: 'R-06', level: 28 },
      ],
    },
  });
  const toggleMock     = (key) => (val) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], mode: val } }));
  const startMock      = (key) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], running: true } }));
  const stopMock       = (key) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], running: false } }));

  const goBack      = () => navigation.goBack();
  const goToAlerts  = () => navigation.getParent()?.navigate(ROUTES.ALERTS);
  const goToProfile = () => navigation.navigate(ROUTES.PROFILE);

  // Previews ventilateur avec données réelles
  const fanPreviews = [
    {
      icon:  'thermostat',
      label: 'Temp actuelle',
      value: temperature != null ? `${temperature.toFixed(1)}°C` : '--',
      color: temperature >= THRESHOLDS.fan.high
        ? COLORS.error
        : temperature >= THRESHOLDS.fan.ideal_max
          ? COLORS.secondary : COLORS.statusHealthy,
    },
    {
      icon:  'thermostat',
      label: 'Seuil activation',
      value: `${THRESHOLDS.fan.ideal_max}°C`,
    },
    {
      icon:  'air',
      label: 'État relais',
      value: fanRunning ? 'ON' : 'OFF',
      color: fanRunning ? COLORS.statusHealthy : COLORS.outlineVariant,
    },
  ];

  const e = mockEquip;
  const previews = {
    padCooling: [
      { icon: 'thermostat',        label: 'Seuil',    value: '28°C' },
      { icon: 'device-thermostat', label: 'Actuelle', value: temperature != null ? `${temperature.toFixed(1)}°C` : '--' },
      { icon: 'ac-unit',           label: 'État',     value: e.padCooling.running ? 'Actif' : 'Veille', color: e.padCooling.running ? COLORS.statusHealthy : COLORS.outlineVariant },
    ],
    eclairage: [
      { icon: 'wb-sunny',  label: 'Intensité', value: e.eclairage.running ? '820 lux' : '0 lux', color: e.eclairage.running ? COLORS.secondary : COLORS.outlineVariant },
      { icon: 'schedule',  label: 'Programme', value: '16 h/j' },
      { icon: 'timer',     label: 'Restant',   value: e.eclairage.running ? '6h 20' : '—' },
    ],
    stores: [
      { icon: 'blinds',   label: 'Position',   value: e.stores.running ? '45%' : '0%', color: e.stores.running ? COLORS.primary : COLORS.outlineVariant },
      { icon: 'wb-sunny', label: 'Luminosité', value: '820 lux' },
      { icon: 'loop',     label: 'Mode',       value: 'Soleil' },
    ],
    chauffage: [
      { icon: 'thermostat',            label: 'Cible',    value: '24.5°C' },
      { icon: 'device-thermostat',     label: 'Actuelle', value: temperature != null ? `${temperature.toFixed(1)}°C` : '--' },
      { icon: 'local-fire-department', label: 'Puissance',value: e.chauffage.running ? '38%' : 'Veille', color: e.chauffage.running ? COLORS.error : COLORS.outlineVariant },
    ],
    abreuvoirs: [
      { icon: 'water-drop', label: 'Débit',    value: e.abreuvoirs.running ? '2.4 L/min' : '—', color: e.abreuvoirs.running ? '#378ADD' : COLORS.outlineVariant },
      { icon: 'compress',   label: 'Pression', value: e.abreuvoirs.running ? '1.8 bar' : '—' },
      { icon: 'opacity',    label: 'Conso/h',  value: e.abreuvoirs.running ? '144 L' : '—' },
    ],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {selectedCoop?.name || 'Bâtiment A01'}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={goToAlerts} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
            {unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarWrapper} onPress={goToProfile} activeOpacity={0.8}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{user?.name?.charAt(0) || 'U'}</Text></View>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>Contrôle des Systèmes</Text>
          <Text style={styles.screenTitle}>Gestion Équipements</Text>
        </View>

        {/* Bannière IA */}
        <View style={styles.iaBanner}>
          <View style={styles.iaBannerContent}>
            <View style={styles.iaBannerTag}>
              <MaterialIcons name="smart-toy" size={16} color={COLORS.statusHealthy} />
              <Text style={styles.iaBannerTagText}>IA Agronome Active</Text>
            </View>
            <Text style={styles.iaBannerTitle}>Optimisation Climatique</Text>
            <Text style={styles.iaBannerSubtitle}>
              {temperature != null
                ? `Température actuelle : ${temperature.toFixed(1)}°C — ${autoFan.reason}`
                : 'Le système surveille les conditions climatiques.'}
            </Text>
          </View>
          <View style={styles.iaBannerDeco} />
        </View>

        {/* ══════════════════════════════════════════════════════
            ✅ VENTILATEUR — CONNECTÉ À L'ESP32
        ══════════════════════════════════════════════════════ */}
        <EquipmentCard
          icon="air"
          title="Ventilateurs"
          mode={actuators.fan.mode}
          running={fanRunning}
          loading={actuators.fan.loading}
          autoReason={autoFan.reason}
          previewItems={fanPreviews}
          onModeToggle={(mode) => setMode('fan', mode)}
          onStart={() => sendCommand('fan', true)}
          onStop={() => sendCommand('fan', false)}
        />

        {/* Pad Cooling — mock */}
        <EquipmentCard
          icon="ac-unit"
          title="Pad Cooling"
          mode={e.padCooling.mode}
          running={e.padCooling.running}
          loading={false}
          autoReason="Actif si T° > 28°C"
          previewItems={previews.padCooling}
          onModeToggle={toggleMock('padCooling')}
          onStart={() => startMock('padCooling')}
          onStop={() => stopMock('padCooling')}
        />

        {/* Éclairage — mock */}
        <EquipmentCard
          icon="lightbulb"
          title="Éclairage"
          mode={e.eclairage.mode}
          running={e.eclairage.running}
          loading={false}
          autoReason="Programme 06h00 → 20h00"
          previewItems={previews.eclairage}
          onModeToggle={toggleMock('eclairage')}
          onStart={() => startMock('eclairage')}
          onStop={() => stopMock('eclairage')}
        />

        {/* Stores — mock */}
        <EquipmentCard
          icon="blinds"
          title="Stores"
          mode={e.stores.mode}
          running={e.stores.running}
          loading={false}
          autoReason="Réglage automatique selon luminosité"
          previewItems={previews.stores}
          onModeToggle={toggleMock('stores')}
          onStart={() => startMock('stores')}
          onStop={() => stopMock('stores')}
        />

        {/* Chauffage — mock */}
        <EquipmentCard
          icon="heat-pump"
          title="Chauffage"
          mode={e.chauffage.mode}
          running={e.chauffage.running}
          loading={false}
          autoReason="Actif si T° < 18°C"
          previewItems={previews.chauffage}
          onModeToggle={toggleMock('chauffage')}
          onStart={() => startMock('chauffage')}
          onStop={() => stopMock('chauffage')}
        />

        {/* Abreuvoirs — mock */}
        <EquipmentCard
          icon="water-drop"
          title="Abreuvoirs"
          mode={e.abreuvoirs.mode}
          running={e.abreuvoirs.running}
          loading={false}
          autoReason={`Flux: 2.4 L/min — ${e.abreuvoirs.reservoirs.length} réservoirs`}
          previewItems={previews.abreuvoirs}
          onModeToggle={toggleMock('abreuvoirs')}
          onStart={() => startMock('abreuvoirs')}
          onStop={() => stopMock('abreuvoirs')}
        >
          <ReservoirGrid reservoirs={e.abreuvoirs.reservoirs} />
        </EquipmentCard>

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const rStyles = StyleSheet.create({
  wrapper: { backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5, flex: 1 },
  headerSummary: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  summaryDot: { width: 5, height: 5, borderRadius: 3 },
  summaryText: { fontFamily: FONTS.inter, fontSize: 10, fontWeight: FONT_WEIGHTS.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'space-between' },
  item: { alignItems: 'center', gap: 4, flex: 1, minWidth: 48 },
  tank: { width: 30, height: TANK_H, borderRadius: RADIUS.sm, backgroundColor: COLORS.outlineVariant + '30', borderWidth: 1, borderColor: COLORS.outlineVariant + '60', overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  tankFill: { width: '100%' },
  tankSurface: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  level: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold },
  name: { fontFamily: FONTS.inter, fontSize: 10, color: COLORS.onSurfaceVariant },
  pill: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: RADIUS.full },
  pillText: { fontFamily: FONTS.inter, fontSize: 9, fontWeight: FONT_WEIGHTS.bold, letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg, height: LAYOUT.topBarHeight },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  backBtn: { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.white10 },
  topBarTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -0.3, flex: 1 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  notifBtn: { position: 'relative', padding: SPACING.xs },
  notifBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.error, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.primary },
  notifBadgeText: { fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  avatarWrapper: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.white10 },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', flex: 1 },
  avatarInitials: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], gap: SPACING.lg },

  titleSection: { gap: 4, marginBottom: SPACING.sm },
  sectionLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 3 },
  screenTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['3xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, letterSpacing: -0.5 },

  iaBanner: { backgroundColor: COLORS.primary, borderRadius: RADIUS['2xl'], padding: SPACING['2xl'], marginBottom: SPACING.md, overflow: 'hidden', ...SHADOWS.lg },
  iaBannerContent: { zIndex: 1 },
  iaBannerTag: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  iaBannerTagText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.statusHealthy, textTransform: 'uppercase', letterSpacing: 2 },
  iaBannerTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  iaBannerSubtitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  iaBannerDeco: { position: 'absolute', right: -20, top: -20, width: 128, height: 128, borderRadius: 64, backgroundColor: COLORS.statusHealthy + '33' },

  card: { backgroundColor: COLORS.surfaceContainerLow, padding: SPACING['2xl'], ...SHADOWS.sm, gap: SPACING.lg, borderLeftWidth: 4, borderRadius: RADIUS.xl },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, flex: 1 },
  iconWrapper: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, textTransform: 'uppercase', letterSpacing: 1 },

  modeToggleWrapper: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.full, padding: 4, borderWidth: 1, borderColor: COLORS.outlineVariant + '1A' },
  modeBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  modeBtnText: { fontFamily: FONTS.inter, fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, letterSpacing: 1 },

  previewRow: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm },
  previewItem: { flex: 1, alignItems: 'center', gap: 3 },
  previewSep: { width: 1, backgroundColor: COLORS.outlineVariant + '50', marginVertical: 4 },
  previewValue: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, textAlign: 'center' },
  previewLabel: { fontFamily: FONTS.inter, fontSize: 10, color: COLORS.onSurfaceVariant, textAlign: 'center' },

  // ✅ Raison auto
  autoReasonBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.md, padding: SPACING.md },
  autoReasonText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.primary, flex: 1, fontWeight: FONT_WEIGHTS.semiBold },

  cardFooter: { borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '1A', paddingTop: SPACING.lg },
  footerCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  activeIndicator: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold, letterSpacing: 2, textTransform: 'uppercase' },

  manualActions: { flexDirection: 'row', gap: SPACING.md },
  manualBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg, ...SHADOWS.sm },
  manualBtnDisabled: { opacity: 0.45 },
  manualBtnText: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
});

export default EquipmentScreen;