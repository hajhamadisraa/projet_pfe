// src/views/screens/EquipmentScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 MODE TOGGLE
// ─────────────────────────────────────────
const ModeToggle = ({ mode, onToggle, color = COLORS.primary }) => (
  <View style={styles.modeToggleWrapper}>
    <TouchableOpacity
      style={[styles.modeBtn, mode === 'auto' && { backgroundColor: COLORS.white }]}
      onPress={() => onToggle('auto')}
      activeOpacity={0.8}
    >
      <Text style={[styles.modeBtnText, mode === 'auto' && { color }]}>
         AUTO
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.modeBtn, mode === 'manuel' && { backgroundColor: COLORS.white }]}
      onPress={() => onToggle('manuel')}
      activeOpacity={0.8}
    >
      <Text style={[styles.modeBtnText, mode === 'manuel' && { color }]}>
        MANUEL
      </Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────
// 🧩 EQUIPMENT CARD
// ─────────────────────────────────────────
const EquipmentCard = ({
  icon,
  title,
  statusDot,
  statusText,
  statusColor,
  mode,
  onModeToggle,
  footerContent,
  isManualOverride,
  iconColor,
  iconBg,
}) => (
  <View style={[
    styles.card,
    isManualOverride && {
      borderLeftWidth: 4,
      borderLeftColor: COLORS.secondary,
      borderWidth: 0,
    },
  ]}>
    {/* Header */}
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg || COLORS.surfaceContainer }]}>
          <MaterialIcons name={icon} size={24} color={iconColor || COLORS.primary} />
        </View>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusDot }]} />
            <Text style={[styles.statusText, { color: statusColor || COLORS.onSurfaceVariant }]}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>
      <ModeToggle
        mode={mode}
        onToggle={onModeToggle}
        color={isManualOverride ? COLORS.secondary : COLORS.primary}
      />
    </View>

    {/* Footer */}
    <View style={styles.cardFooter}>
      {footerContent}
    </View>
  </View>
);

// ─────────────────────────────────────────
// 📱 EQUIPMENT SCREEN
// ─────────────────────────────────────────
const EquipmentScreen = ({ navigation }) => {
  const [modes, setModes] = useState({
    ventilateurs: 'auto',
    padCooling:   'auto',
    eclairage:    'manuel',
    stores:       'auto',
    chauffage:    'auto',
    abreuvoirs:   'auto',
  });

  const toggleMode = (key) => (value) => {
    setModes((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity activeOpacity={0.8}>
            <MaterialIcons name="menu" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Bâtiment A01</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarIcon} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarFallback}>
              <MaterialIcons name="person" size={18} color={COLORS.white} />
            </View>
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
          <Text style={styles.sectionLabel}>Contrôle des Systèmes</Text>
          <Text style={styles.screenTitle}>Gestion Équipements</Text>
        </View>

        {/* ── Bannière IA */}
        <View style={styles.iaBanner}>
          <View style={styles.iaBannerContent}>
            <View style={styles.iaBannerTag}>
              <MaterialIcons name="smart-toy" size={16} color={COLORS.statusHealthy} />
              <Text style={styles.iaBannerTagText}>IA Agronome Active</Text>
            </View>
            <Text style={styles.iaBannerTitle}>Optimisation Climatique</Text>
            <Text style={styles.iaBannerSubtitle}>
              Le système maintient 24°C. Humidité stable à 62%.
            </Text>
          </View>
          <View style={styles.iaBannerDeco} />
        </View>

        {/* ── Cards équipements */}

        {/* Ventilateurs */}
        <EquipmentCard
          icon="air"
          title="Ventilateurs"
          statusDot={COLORS.statusHealthy}
          statusText="8 Unités Actives"
          mode={modes.ventilateurs}
          onModeToggle={toggleMode('ventilateurs')}
          footerContent={
            <View style={styles.footerCenter}>
              <View style={styles.activeIndicator} />
              <Text style={styles.activeText}>EN COURS...</Text>
            </View>
          }
        />

        {/* Pad Cooling */}
        <EquipmentCard
          icon="ac-unit"
          title="Pad Cooling"
          statusDot={COLORS.outlineVariant}
          statusText="Veille thermique"
          mode={modes.padCooling}
          onModeToggle={toggleMode('padCooling')}
          footerContent={
            <View style={styles.footerCenter}>
              <Text style={styles.inactiveText}>EN ATTENTE</Text>
            </View>
          }
        />

        {/* Éclairage — override manuel */}
        <EquipmentCard
          icon="lightbulb"
          title="Éclairage"
          statusDot={COLORS.secondary}
          statusText="Override Manuel"
          statusColor={COLORS.secondary}
          mode={modes.eclairage}
          onModeToggle={toggleMode('eclairage')}
          isManualOverride
          iconColor={COLORS.secondary}
          iconBg={COLORS.secondary + '1A'}
          footerContent={
            <View style={styles.manualActions}>
              <TouchableOpacity style={[styles.manualBtn, { backgroundColor: COLORS.statusHealthy }]} activeOpacity={0.85}>
                <Text style={styles.manualBtnText}>DÉMARRER</Text>
                <MaterialIcons name="play-arrow" size={16} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.manualBtn, { backgroundColor: COLORS.secondary }]} activeOpacity={0.85}>
                <Text style={styles.manualBtnText}>ARRÊTER</Text>
                <MaterialIcons name="stop" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          }
        />

        {/* Stores */}
        <EquipmentCard
          icon="blinds"
          title="Stores"
          statusDot={COLORS.statusHealthy}
          statusText="Position: 45%"
          mode={modes.stores}
          onModeToggle={toggleMode('stores')}
          footerContent={
            <View style={styles.footerCenter}>
              <Text style={styles.activeText}>ACTIF</Text>
            </View>
          }
        />

        {/* Chauffage */}
        <EquipmentCard
          icon="heat-pump"
          title="Chauffage"
          statusDot={COLORS.outlineVariant}
          statusText="Cible: 24.5°C"
          mode={modes.chauffage}
          onModeToggle={toggleMode('chauffage')}
          footerContent={
            <View style={styles.footerCenter}>
              <Text style={styles.inactiveText}>EN VEILLE</Text>
            </View>
          }
        />

        {/* Abreuvoirs */}
        <EquipmentCard
          icon="water-drop"
          title="Abreuvoirs"
          statusDot={COLORS.statusHealthy}
          statusText="Flux: 2.4L/min"
          mode={modes.abreuvoirs}
          onModeToggle={toggleMode('abreuvoirs')}
          footerContent={
            <View style={styles.footerCenter}>
              <Text style={styles.activeText}>DÉBIT OK</Text>
            </View>
          }
        />

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + '20',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topBarIcon: {
    padding: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  avatarWrapper: {
    width: 32, height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.lg,
  },

  // ── Titre
  titleSection: { gap: 4, marginBottom: SPACING.sm },
  sectionLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
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

  // ── Bannière IA
  iaBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  iaBannerContent: { zIndex: 1 },
  iaBannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iaBannerTagText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.statusHealthy,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  iaBannerTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  iaBannerSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  iaBannerDeco: {
    position: 'absolute',
    right: -20, top: -20,
    width: 128, height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.statusHealthy + '33',
  },

  // ── Card
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '1A',
    ...SHADOWS.sm,
    gap: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    flex: 1,
  },
  iconWrapper: {
    width: 48, height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 6, height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Mode Toggle
  modeToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '1A',
  },
  modeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  modeBtnText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },

  // ── Card Footer
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant + '1A',
    paddingTop: SPACING.lg,
  },
  footerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  activeIndicator: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusHealthy,
  },
  activeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.statusHealthy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inactiveText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.4,
  },

  // ── Manual Actions
  manualActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  manualBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  manualBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default EquipmentScreen;