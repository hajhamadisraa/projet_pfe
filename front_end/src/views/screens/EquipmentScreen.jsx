// src/views/screens/EquipmentScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet,
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

// ─────────────────────────────────────────────────────────────
//  Seuils climatiques
// ─────────────────────────────────────────────────────────────
const THRESHOLDS = {
  fan:    { critical: 35, high: 30, ideal_max: 27, ideal_min: 18 },
  heater: { critical_low: 10, low: 14, ideal_min: 18 },
};

const getAutoFanState = (temperature) => {
  if (temperature == null || isNaN(temperature))
    return { on: false, reason: 'Capteur indisponible', color: COLORS.outline };
  if (temperature >= THRESHOLDS.fan.critical)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Critique !`,      color: COLORS.error };
  if (temperature >= THRESHOLDS.fan.high)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Chaleur`,         color: COLORS.secondary };
  if (temperature >= THRESHOLDS.fan.ideal_max)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Au-dessus idéal`, color: COLORS.warning };
  if (temperature <= THRESHOLDS.fan.ideal_min)
    return { on: false, reason: `T°=${temperature.toFixed(1)}°C — Zone froide`,     color: '#378ADD' };
  return   { on: false, reason: `T°=${temperature.toFixed(1)}°C — Zone idéale ✓`,  color: COLORS.statusHealthy };
};

const getAutoHeaterState = (temperature) => {
  if (temperature == null || isNaN(temperature))
    return { on: false, reason: 'Capteur indisponible' };
  if (temperature <= THRESHOLDS.heater.critical_low)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Critique froid !` };
  if (temperature <= THRESHOLDS.heater.low)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Froid` };
  if (temperature < THRESHOLDS.heater.ideal_min)
    return { on: true,  reason: `T°=${temperature.toFixed(1)}°C — Sous idéal` };
  return   { on: false, reason: `T°=${temperature.toFixed(1)}°C — Zone idéale ✓` };
};

// ── AJOUT : logique auto éclairage (programme horaire) ───────
const getAutoLightState = () => {
  const now    = new Date();
  const hour   = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 60 + minute;
  const on = timeVal >= 6 * 60 && timeVal < 20 * 60;  // 06h00 → 20h00
  return {
    on,
    reason: on
      ? `Programme actif — éteint à 20h00`
      : `Programme inactif — allumé à 06h00`,
  };
};

// ─────────────────────────────────────────────────────────────
//  Composants réutilisables
// ─────────────────────────────────────────────────────────────
const ModeToggle = ({ mode, onToggle, color = COLORS.primary, disabled }) => (
  <View style={[styles.modeToggleWrapper, disabled && { opacity: 0.5 }]}>
    {['auto', 'manuel'].map((m) => (
      <TouchableOpacity
        key={m}
        style={[styles.modeBtn, mode === m && { backgroundColor: COLORS.white }]}
        onPress={() => !disabled && onToggle(m)}
        activeOpacity={0.8}
      >
        <Text style={[styles.modeBtnText, mode === m && { color }]}>{m.toUpperCase()}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

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

// ─────────────────────────────────────────────────────────────
//  Réservoir unique
// ─────────────────────────────────────────────────────────────
const TANK_H = 80;

const SingleReservoir = ({ levelPct, pumpOn }) => {
  const color      = levelPct > 60 ? COLORS.statusHealthy : levelPct > 20 ? '#F59E0B' : COLORS.error;
  const label      = levelPct > 60 ? 'Plein' : levelPct > 20 ? 'Bas' : 'Critique';
  const fillHeight = Math.max(2, Math.round(TANK_H * levelPct / 100));

  return (
    <View style={sStyles.wrapper}>
      <View style={sStyles.row}>
        <View style={sStyles.tankOuter}>
          <View style={[sStyles.tankFill, { height: fillHeight, backgroundColor: color + '40' }]} />
          <View style={[sStyles.tankSurface, { bottom: fillHeight - 2, backgroundColor: color }]} />
          <View style={[sStyles.marker, { bottom: TANK_H * 0.6 }]} />
          <View style={[sStyles.marker, { bottom: TANK_H * 0.2 }]} />
        </View>
        <View style={sStyles.info}>
          <Text style={[sStyles.pct, { color }]}>{levelPct}%</Text>
          <View style={[sStyles.pill, { backgroundColor: color + '20' }]}>
            <Text style={[sStyles.pillText, { color }]}>{label}</Text>
          </View>
          <Text style={sStyles.sub}>Réservoir principal</Text>
          <View style={sStyles.pumpRow}>
            <View style={[sStyles.pumpDot, { backgroundColor: pumpOn ? COLORS.statusHealthy : COLORS.outlineVariant }]} />
            <Text style={[sStyles.pumpLabel, { color: pumpOn ? COLORS.statusHealthy : COLORS.onSurfaceVariant }]}>
              Pompe {pumpOn ? 'active' : 'arrêtée'}
            </Text>
          </View>
          {levelPct <= 20 && (
            <View style={sStyles.alertBox}>
              <MaterialIcons name="warning" size={12} color={COLORS.error} />
              <Text style={sStyles.alertText}>Niveau critique !</Text>
            </View>
          )}
        </View>
      </View>
      <View style={sStyles.barBg}>
        <View style={[sStyles.barFill, { width: `${levelPct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  EquipmentCard générique
// ─────────────────────────────────────────────────────────────
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
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconWrapper, { backgroundColor: accentColor + '1A' }]}>
            {loading
              ? <ActivityIndicator size="small" color={accentColor} />
              : <MaterialIcons name={icon} size={24} color={accentColor} />}
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

      {previewItems?.length > 0 && <PreviewRow items={previewItems} />}

      {!isManual && autoReason && (
        <View style={styles.autoReasonBox}>
          <MaterialIcons name="smart-toy" size={13} color={COLORS.primary} />
          <Text style={styles.autoReasonText}>{autoReason}</Text>
        </View>
      )}

      {children}

      <View style={styles.cardFooter}>
        {isManual ? (
          <View style={styles.manualActions}>
            <TouchableOpacity
              style={[styles.manualBtn, { backgroundColor: running ? COLORS.outlineVariant : COLORS.statusHealthy }, running && styles.manualBtnDisabled]}
              onPress={onStart} disabled={running || loading} activeOpacity={0.85}
            >
              {loading && !running
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <MaterialIcons name="play-arrow" size={16} color={COLORS.white} />}
              <Text style={styles.manualBtnText}>DÉMARRER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.manualBtn, { backgroundColor: running ? COLORS.secondary : COLORS.outlineVariant }, !running && styles.manualBtnDisabled]}
              onPress={onStop} disabled={!running || loading} activeOpacity={0.85}
            >
              {loading && running
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <MaterialIcons name="stop" size={16} color={COLORS.white} />}
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

// ─────────────────────────────────────────────────────────────
//  EquipmentScreen
// ─────────────────────────────────────────────────────────────
const EquipmentScreen = ({ navigation }) => {
  const user         = useAppStore((s) => s.user);
  const unreadCount  = useAppStore((s) => s.unreadAlertsCount);
  const selectedCoop = useAppStore((s) => s.selectedCoop);

  const { sensors } = useRealtimeSensors(selectedCoop?.id);
  const temperature   = sensors?.temperature?.value ?? null;
  const waterLevelPct = sensors?.waterLevel?.value ?? 0;
  const luminosity    = sensors?.luminosity?.value ?? null;  // ← AJOUT

  // ── Logique auto ventilateur ──────────────────────────────────
  const autoFan = useMemo(() => getAutoFanState(temperature), [temperature]);

  // ── Logique auto pompe ────────────────────────────────────────
  const autoPump = useMemo(() => {
    if (sensors === null) return { on: false, reason: 'En attente données capteur...' };
    return {
      on:     waterLevelPct < 12,
      reason: waterLevelPct >= 12
        ? `Eau détectée ${waterLevelPct}% — Pompe OFF`
        : `Capteur hors eau — Pompe ON`,
    };
  }, [waterLevelPct, sensors]);

  // ── Logique auto chauffage ────────────────────────────────────
  const autoHeater = useMemo(() => getAutoHeaterState(temperature), [temperature]);

  // ── Logique auto éclairage (recalcul chaque minute) ──────────
  const autoLight = useMemo(() => getAutoLightState(), [
    // recalcul toutes les minutes via un tick
    Math.floor(Date.now() / 60000),
  ]);

  // ── useActuators ──────────────────────────────────────────────
  const { actuators, sendCommand, setMode } = useActuators(
    selectedCoop?.id,
    selectedCoop?.espMac,
    {
      fan:       autoFan.on,
      waterPump: autoPump.on,
      heater:    autoHeater.on,
      light:     autoLight.on,   // ← AJOUT
    }
  );

  const fanRunning = actuators?.fan?.mode === 'auto'
    ? autoFan.on : (actuators?.fan?.on ?? false);

  const pumpRunning = actuators?.waterPump?.mode === 'auto'
    ? autoPump.on : (actuators?.waterPump?.on ?? false);

  const heaterRunning = actuators?.heater?.mode === 'auto'
    ? autoHeater.on : (actuators?.heater?.on ?? false);

  // ── AJOUT : état éclairage ────────────────────────────────────
  const lightRunning = actuators?.light?.mode === 'auto'
    ? autoLight.on : (actuators?.light?.on ?? false);

  // ── Mocks (sans chauffage, sans éclairage) ───────────────────
  const [mockEquip, setMockEquip] = useState({
    padCooling: { mode: 'auto', running: false },
  });
  const toggleMock = (key) => (val) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], mode: val } }));
  const startMock  = (key) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], running: true } }));
  const stopMock   = (key) => setMockEquip((p) => ({ ...p, [key]: { ...p[key], running: false } }));

  const e = mockEquip;

  // ── Previews ──────────────────────────────────────────────────
  const fanPreviews = [
    { icon: 'thermostat', label: 'Temp actuelle',    value: temperature != null ? `${temperature.toFixed(1)}°C` : '--', color: temperature >= THRESHOLDS.fan.high ? COLORS.error : temperature >= THRESHOLDS.fan.ideal_max ? COLORS.secondary : COLORS.statusHealthy },
    { icon: 'thermostat', label: 'Seuil activation', value: `${THRESHOLDS.fan.ideal_max}°C` },
    { icon: 'air',        label: 'État relais',       value: fanRunning ? 'ON' : 'OFF', color: fanRunning ? COLORS.statusHealthy : COLORS.outlineVariant },
  ];

  const pumpPreviews = [
    { icon: 'water-drop', label: 'Niveau eau',  value: `${waterLevelPct}%`,        color: waterLevelPct > 60 ? COLORS.statusHealthy : waterLevelPct > 20 ? '#F59E0B' : COLORS.error },
    { icon: 'sensors',    label: 'Seuil pompe', value: '60%' },
    { icon: 'water',      label: 'État pompe',  value: pumpRunning ? 'ON' : 'OFF',  color: pumpRunning ? COLORS.statusHealthy : COLORS.outlineVariant },
  ];

  const heaterPreviews = [
    { icon: 'thermostat',        label: 'Seuil activation', value: `${THRESHOLDS.heater.ideal_min}°C` },
    { icon: 'device-thermostat', label: 'Temp actuelle',    value: temperature != null ? `${temperature.toFixed(1)}°C` : '--',
      color: temperature <= THRESHOLDS.heater.low ? COLORS.error : temperature <= THRESHOLDS.heater.ideal_min ? COLORS.warning : COLORS.statusHealthy },
    { icon: 'heat-pump',         label: 'État relais',      value: heaterRunning ? 'ON' : 'OFF',
      color: heaterRunning ? COLORS.statusHealthy : COLORS.outlineVariant },
  ];

  // ── AJOUT : previews éclairage ────────────────────────────────
  const lightPreviews = [
    { icon: 'wb-sunny',  label: 'Luminosité',   value: luminosity != null ? `${Math.round(luminosity)} lux` : '--',
      color: luminosity > 500 ? COLORS.statusHealthy : luminosity > 100 ? '#F59E0B' : COLORS.outlineVariant },
    { icon: 'schedule',  label: 'Programme',    value: '06h→20h' },
    { icon: 'lightbulb', label: 'État relais',  value: lightRunning ? 'ON' : 'OFF',
      color: lightRunning ? COLORS.statusHealthy : COLORS.outlineVariant },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {selectedCoop?.name || 'Bâtiment A01'}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.getParent()?.navigate(ROUTES.ALERTS)} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
            {unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate(ROUTES.PROFILE)} activeOpacity={0.8}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{user?.name?.charAt(0) || 'U'}</Text></View>}
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
                ? `T° ${temperature.toFixed(1)}°C — ${autoFan.reason}`
                : 'Surveillance des conditions climatiques en cours.'}
            </Text>
          </View>
          <View style={styles.iaBannerDeco} />
        </View>

        {/* ✅ VENTILATEUR */}
        <EquipmentCard
          icon="air" title="Ventilateurs"
          mode={actuators?.fan?.mode ?? 'auto'}
          running={fanRunning}
          loading={actuators?.fan?.loading ?? false}
          autoReason={autoFan.reason}
          previewItems={fanPreviews}
          onModeToggle={(m) => setMode('fan', m)}
          onStart={() => sendCommand('fan', true)}
          onStop={() => sendCommand('fan', false)}
        />

        {/* ✅ POMPE À EAU */}
        <EquipmentCard
          icon="water" title="Pompe à eau"
          mode={actuators?.waterPump?.mode ?? 'auto'}
          running={pumpRunning}
          loading={actuators?.waterPump?.loading ?? false}
          autoReason={autoPump.reason}
          previewItems={pumpPreviews}
          onModeToggle={(m) => setMode('waterPump', m)}
          onStart={() => sendCommand('waterPump', true)}
          onStop={() => sendCommand('waterPump', false)}
        >
          <SingleReservoir levelPct={waterLevelPct} pumpOn={pumpRunning} />
        </EquipmentCard>

        {/* ✅ CHAUFFAGE */}
        <EquipmentCard
          icon="heat-pump" title="Chauffage"
          mode={actuators?.heater?.mode ?? 'auto'}
          running={heaterRunning}
          loading={actuators?.heater?.loading ?? false}
          autoReason={autoHeater.reason}
          previewItems={heaterPreviews}
          onModeToggle={(m) => setMode('heater', m)}
          onStart={() => sendCommand('heater', true)}
          onStop={() => sendCommand('heater', false)}
        />

        {/* ✅ ÉCLAIRAGE — connecté ESP32 */}
        <EquipmentCard
          icon="lightbulb" title="Éclairage"
          mode={actuators?.light?.mode ?? 'auto'}
          running={lightRunning}
          loading={actuators?.light?.loading ?? false}
          autoReason={autoLight.reason}
          previewItems={lightPreviews}
          onModeToggle={(m) => setMode('light', m)}
          onStart={() => sendCommand('light', true)}
          onStop={() => sendCommand('light', false)}
        />

        {/* Pad Cooling — mock */}
        <EquipmentCard
          icon="ac-unit" title="Pad Cooling"
          mode={e.padCooling.mode} running={e.padCooling.running} loading={false}
          autoReason="Actif si T° > 28°C"
          previewItems={[
            { icon: 'thermostat',        label: 'Seuil',    value: '28°C' },
            { icon: 'device-thermostat', label: 'Actuelle', value: temperature != null ? `${temperature.toFixed(1)}°C` : '--' },
          ]}
          onModeToggle={toggleMock('padCooling')}
          onStart={() => startMock('padCooling')}
          onStop={() => stopMock('padCooling')}
        />

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
//  Styles réservoir unique
// ─────────────────────────────────────────────────────────────
const sStyles = StyleSheet.create({
  wrapper:     { backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md },
  row:         { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
  tankOuter:   { width: 40, height: TANK_H, borderRadius: RADIUS.sm, backgroundColor: COLORS.outlineVariant + '30', borderWidth: 1, borderColor: COLORS.outlineVariant + '60', overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  tankFill:    { width: '100%' },
  tankSurface: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  marker:      { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.outlineVariant + '80' },
  info:        { flex: 1, gap: SPACING.sm },
  pct:         { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.extraBold },
  pill:        { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  pillText:    { fontFamily: FONTS.inter, fontSize: 10, fontWeight: FONT_WEIGHTS.bold },
  sub:         { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  pumpRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  pumpDot:     { width: 6, height: 6, borderRadius: 3 },
  pumpLabel:   { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },
  alertBox:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.error + '15', padding: SPACING.sm, borderRadius: RADIUS.sm },
  alertText:   { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.error, fontWeight: FONT_WEIGHTS.bold },
  barBg:       { height: 6, backgroundColor: COLORS.outlineVariant + '40', borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────
//  Styles principaux
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.surface },
  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg, height: LAYOUT.topBarHeight },
  topBarLeft:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  backBtn:          { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.white10 },
  topBarTitle:      { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -0.3, flex: 1 },
  topBarRight:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  notifBtn:         { position: 'relative', padding: SPACING.xs },
  notifBadge:       { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.error, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.primary },
  notifBadgeText:   { fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  avatarWrapper:    { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.white10 },
  avatar:           { width: '100%', height: '100%' },
  avatarFallback:   { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', flex: 1 },
  avatarInitials:   { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], gap: SPACING.lg },
  titleSection:     { gap: 4, marginBottom: SPACING.sm },
  sectionLabel:     { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 3 },
  screenTitle:      { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['3xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, letterSpacing: -0.5 },
  iaBanner:         { backgroundColor: COLORS.primary, borderRadius: RADIUS['2xl'], padding: SPACING['2xl'], marginBottom: SPACING.md, overflow: 'hidden', ...SHADOWS.lg },
  iaBannerContent:  { zIndex: 1 },
  iaBannerTag:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  iaBannerTagText:  { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.statusHealthy, textTransform: 'uppercase', letterSpacing: 2 },
  iaBannerTitle:    { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  iaBannerSubtitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  iaBannerDeco:     { position: 'absolute', right: -20, top: -20, width: 128, height: 128, borderRadius: 64, backgroundColor: COLORS.statusHealthy + '33' },
  card:             { backgroundColor: COLORS.surfaceContainerLow, padding: SPACING['2xl'], ...SHADOWS.sm, gap: SPACING.lg, borderLeftWidth: 4, borderRadius: RADIUS.xl },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, flex: 1 },
  iconWrapper:      { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitle:        { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, marginBottom: 4 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, textTransform: 'uppercase', letterSpacing: 1 },
  modeToggleWrapper:{ flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.full, padding: 4, borderWidth: 1, borderColor: COLORS.outlineVariant + '1A' },
  modeBtn:          { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  modeBtnText:      { fontFamily: FONTS.inter, fontSize: 9, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, letterSpacing: 1 },
  previewRow:       { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm },
  previewItem:      { flex: 1, alignItems: 'center', gap: 3 },
  previewSep:       { width: 1, backgroundColor: COLORS.outlineVariant + '50', marginVertical: 4 },
  previewValue:     { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, textAlign: 'center' },
  previewLabel:     { fontFamily: FONTS.inter, fontSize: 10, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  autoReasonBox:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.md, padding: SPACING.md },
  autoReasonText:   { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.primary, flex: 1, fontWeight: FONT_WEIGHTS.semiBold },
  cardFooter:       { borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '1A', paddingTop: SPACING.lg },
  footerCenter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  activeIndicator:  { width: 6, height: 6, borderRadius: 3 },
  activeText:       { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold, letterSpacing: 2, textTransform: 'uppercase' },
  manualActions:    { flexDirection: 'row', gap: SPACING.md },
  manualBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg, ...SHADOWS.sm },
  manualBtnDisabled:{ opacity: 0.45 },
  manualBtnText:    { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
});

export default EquipmentScreen;