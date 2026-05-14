// src/views/screens/FeedingScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// US15 – Programmer la distribution d'aliment
// US16 – Suivre la consommation d'aliment
// US17 – Surveiller les réservoirs d'eau
// US18 – Suivre la consommation d'eau
// ─────────────────────────────────────────────────────────────────────────────

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS, LAYOUT, RADIUS, SHADOWS, SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONSTANTES MATÉRIELLES
// ─────────────────────────────────────────────────────────────────────────────

// Seuils capteurs (à adapter selon votre matériel)
const HARDWARE = {
  // Capteur de poids sur le silo d'alimentation (kg)
  FEEDER_WEIGHT_SENSOR_ID: 'WEIGHT_SENSOR_01',
  FEEDER_EMPTY_THRESHOLD: 0.5,      // < 0.5 kg → silo considéré vide
  FEEDER_FULL_CAPACITY: 50,          // kg max du silo

  // Capteur de niveau d'eau (ultrasonique ou flotteur → %)
  TANK_A_SENSOR_ID: 'ULTRA_A01',
  TANK_B_SENSOR_ID: 'ULTRA_B01',
  TANK_LOW_THRESHOLD: 20,            // % → alerte critique
  TANK_FULL_CAPACITY_LITERS: 500,    // litres par réservoir

  // Capteur de débit d'eau (débitmètre)
  FLOW_METER_ID: 'FLOW_01',
  WATER_DAILY_GOAL_LITERS: 200,      // litres/jour pour ce poulailler

  // Distributeur automatique (moteur/vanne commandé)
  DISPENSER_MOTOR_ID: 'MOTOR_01',
  DISPENSER_DURATION_PER_KG: 30,     // secondes pour distribuer 1 kg

  // Polling interval (en ms) – en production, remplacer par WebSocket
  POLL_INTERVAL_MS: 5000,
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 SERVICE MATÉRIEL (simulation → remplacer par vos appels API/BLE/MQTT)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * hardwareService – Simule les lectures des capteurs.
 *
 * EN PRODUCTION, remplacez chaque méthode par :
 *   - Un appel REST à votre passerelle IoT
 *   - Ou un message MQTT sur le topic du capteur
 *   - Ou une lecture BLE sur le bon characteristic UUID
 */
const hardwareService = {
  /**
   * US16 – Lit le poids actuel dans le silo d'alimentation.
   * Matériel réel : Cellule de charge (load cell) + amplificateur HX711
   * Signal : 0–50 kg (float, précision 0.1 kg)
   * Retour → kg distribués = FEEDER_FULL_CAPACITY - poids_actuel
   */
  async readFeederWeight(siloInitialKg = 50) {
    // Simulation : décroissance lente du poids (les poules mangent)
    const consumed = Math.min(siloInitialKg, (Date.now() / 10000) % 15);
    return {
      currentWeightKg: Math.max(0, siloInitialKg - consumed),
      distributedKg: parseFloat(consumed.toFixed(1)),
      consumedKg: parseFloat((consumed * 0.87).toFixed(1)), // 13% gaspillage
      remainingKg: parseFloat((siloInitialKg - consumed).toFixed(1)),
      sensorId: HARDWARE.FEEDER_WEIGHT_SENSOR_ID,
      isEmpty: consumed >= siloInitialKg - HARDWARE.FEEDER_EMPTY_THRESHOLD,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * US17 – Lit le niveau d'un réservoir d'eau.
   * Matériel réel : Capteur ultrasonique HC-SR04 (ou capteur flotteur)
   * Signal : distance en cm → convertie en % (0–100%)
   * Alerte déclenchée si niveau < TANK_LOW_THRESHOLD
   */
  async readTankLevel(sensorId) {
    // Simulation : chaque réservoir descend indépendamment
    const seed = sensorId === HARDWARE.TANK_A_SENSOR_ID ? 1 : 2;
    const elapsed = (Date.now() / (8000 * seed)) % 1;
    const level = Math.max(0, Math.round(100 - elapsed * 100));
    return {
      sensorId,
      levelPercent: level,
      volumeLiters: Math.round((level / 100) * HARDWARE.TANK_FULL_CAPACITY_LITERS),
      isLow: level < HARDWARE.TANK_LOW_THRESHOLD,
      status: level < HARDWARE.TANK_LOW_THRESHOLD ? 'low' : 'ok',
      statusLabel: level < HARDWARE.TANK_LOW_THRESHOLD ? 'Critique' : 'Normal',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * US18 – Lit la consommation d'eau via débitmètre.
   * Matériel réel : Débitmètre YF-S201 (impulsions → litres)
   * Signal : compteur d'impulsions cumulé depuis minuit
   */
  async readWaterConsumption() {
    const hour = new Date().getHours();
    const estimated = Math.round((hour / 24) * HARDWARE.WATER_DAILY_GOAL_LITERS * 0.9);
    return {
      sensorId: HARDWARE.FLOW_METER_ID,
      consumedLiters: estimated,
      goalLiters: HARDWARE.WATER_DAILY_GOAL_LITERS,
      percentUsed: Math.round((estimated / HARDWARE.WATER_DAILY_GOAL_LITERS) * 100),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * US15 – Commande le distributeur automatique.
   * Matériel réel : Relais → moteur vis sans fin ou vanne servo
   * Durée = quantité_kg × DISPENSER_DURATION_PER_KG secondes
   * Retourne l'état de la commande (succès / erreur moteur)
   */
  async triggerDispenser(quantityKg) {
    const durationSec = quantityKg * HARDWARE.DISPENSER_DURATION_PER_KG;
    console.log(
      `[MOTOR] Activation ${HARDWARE.DISPENSER_MOTOR_ID} pour ${durationSec}s → ${quantityKg}kg`
    );
    // Simulation 200ms → En production : envoi commande MQTT/HTTP
    await new Promise((r) => setTimeout(r, 200));
    return {
      motorId: HARDWARE.DISPENSER_MOTOR_ID,
      success: true,
      durationSec,
      quantityKg,
      startedAt: new Date().toISOString(),
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 STAT CHIP
// ─────────────────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, unit, accent }) => (
  <View style={[styles.statChip, accent && styles.statChipAccent]}>
    <Text style={styles.statChipLabel}>{label}</Text>
    <Text style={[styles.statChipValue, accent && styles.statChipValueAccent]}>
      {value}
      <Text style={styles.statChipUnit}> {unit}</Text>
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 WEEKLY BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
const WeeklyBarChart = ({ data, activeIndex }) => {
  const maxHeight = 90;
  return (
    <View style={styles.chartBars}>
      {data.map((item, index) => {
        const isActive = index === activeIndex;
        const barH = Math.round((item.height / 100) * maxHeight);
        return (
          <View key={index} style={styles.chartBarCol}>
            <View style={[styles.chartBar, { height: maxHeight }]}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    height: barH,
                    backgroundColor: isActive
                      ? COLORS.primary
                      : item.height > 0
                      ? COLORS.surfaceContainerHigh
                      : COLORS.surfaceContainerHigh + '40',
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartDayLabel, isActive && styles.chartDayLabelActive]}>
              {item.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 SCHEDULE ITEM – US15
// État matériel : done (poids OK) / running (moteur actif) / pending (planifié)
// ─────────────────────────────────────────────────────────────────────────────
const ScheduleItem = ({ item, onMarkDone }) => {
  const isDone    = item.status === 'done';
  const isRunning = item.status === 'running';
  const isPending = item.status === 'pending';

  if (isPending) {
    return (
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scheduleItemPending}
      >
        <View style={styles.scheduleTimeBadgeDark}>
          <Text style={styles.scheduleTimeDark}>{item.time}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleNameLight}>{item.label}</Text>
          <Text style={styles.scheduleQtyLight}>{item.quantity} kg prévu</Text>
        </View>
        <MaterialIcons name="schedule" size={22} color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  if (isRunning) {
    return (
      <LinearGradient
        colors={['#0F6E56', '#1D9E75']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scheduleItemPending}
      >
        <View style={styles.scheduleTimeBadgeDark}>
          <Text style={styles.scheduleTimeDark}>{item.time}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleNameLight}>{item.label}</Text>
          <Text style={styles.scheduleQtyLight}>⚙️ Moteur actif – {item.quantity} kg en cours…</Text>
        </View>
        <TouchableOpacity onPress={() => onMarkDone(item.id)}>
          <MaterialIcons name="check-circle-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.scheduleItemDone}>
      <View style={styles.scheduleTimeBadge}>
        <Text style={styles.scheduleTime}>{item.time}</Text>
      </View>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleName}>{item.label}</Text>
        <Text style={styles.scheduleQty}>✓ {item.quantity} kg distribués</Text>
      </View>
      <MaterialIcons name="check-circle" size={22} color={COLORS.statusHealthy} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 TANK VISUAL – US17
// État matériel : ok / low (capteur ultrasonique)
// ─────────────────────────────────────────────────────────────────────────────
const TankVisual = ({ tank }) => {
  const isLow     = tank.status === 'low';
  const fillColor = isLow ? COLORS.secondary + 'CC' : COLORS.emerald400 + 'CC';
  const fillH     = `${tank.level}%`;
  const badgeBg   = isLow ? COLORS.statusWarningBg : COLORS.statusHealthyBg;
  const badgeTxt  = isLow ? COLORS.secondary : COLORS.statusHealthy;

  return (
    <View style={styles.tankWrapper}>
      <View style={styles.tank}>
        {isLow && <View style={styles.tankDangerLine} />}
        <View style={[styles.tankFill, { height: fillH, backgroundColor: fillColor }]}>
          <Text style={[styles.tankFillLabel, { color: isLow ? COLORS.white : COLORS.primary }]}>
            {tank.level}%
          </Text>
        </View>
      </View>
      <Text style={styles.tankName}>{tank.name}</Text>
      <View style={[styles.tankBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.tankBadgeText, { color: badgeTxt }]}>{tank.statusLabel}</Text>
      </View>
      {/* Volume en litres */}
      <Text style={styles.tankVolume}>{tank.volumeLiters} L</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 WATER CONSUMPTION BAR – US18
// ─────────────────────────────────────────────────────────────────────────────
const WaterConsumptionBar = ({ consumed, goal }) => {
  const pct = Math.min(100, Math.round((consumed / goal) * 100));
  const isLow = pct < 50;
  const barColor = isLow ? COLORS.secondary : COLORS.emerald400;

  return (
    <View style={styles.waterCard}>
      <View style={styles.waterCardHeader}>
        <Text style={styles.waterCardTitle}>Consommation d'eau – Aujourd'hui</Text>
        <Text style={[styles.waterPct, { color: isLow ? COLORS.secondary : COLORS.statusHealthy }]}>
          {pct}%
        </Text>
      </View>
      <View style={styles.waterTrack}>
        <View style={[styles.waterFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.waterMeta}>
        <Text style={styles.waterMetaText}>{consumed} L consommés</Text>
        <Text style={styles.waterMetaText}>Objectif : {goal} L</Text>
      </View>
      {isLow && (
        <View style={styles.waterWarn}>
          <MaterialIcons name="warning" size={14} color={COLORS.secondary} />
          <Text style={styles.waterWarnText}>Consommation en dessous de la normale</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📱 FEEDING SCREEN (composant principal)
// ─────────────────────────────────────────────────────────────────────────────
const FeedingScreen = ({ navigation }) => {
  const pollRef = useRef(null);

  // ── US15 – Planning de distribution
  const [schedule, setSchedule] = useState([
    { id: 1, time: '06:00', label: 'Petit déjeuner', quantity: 4.2, status: 'done' },
    { id: 2, time: '12:00', label: 'Repas du midi',  quantity: 4.0, status: 'done' },
    { id: 3, time: '17:00', label: 'Repas du soir',  quantity: 4.2, status: 'pending' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTime, setNewTime]   = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newQty, setNewQty]     = useState('');

  // ── US16 – Consommation d'aliment (depuis capteur poids)
  const [feeding, setFeeding] = useState({
    distributed: 12.4,
    consumed: 10.8,
    remaining: 1.6,
    unit: 'kg',
    weeklyData: [
      { day: 'L', height: 72 }, { day: 'M', height: 85 }, { day: 'M', height: 60 },
      { day: 'J', height: 100 },{ day: 'V', height: 0 },  { day: 'S', height: 0 },
      { day: 'D', height: 0 },
    ],
  });

  // ── US17 – Niveaux des réservoirs (depuis capteurs ultrasoniques)
  const [tanks, setTanks] = useState([
    { id: 'ULTRA_A01', name: 'Réservoir A', level: 72, status: 'ok', statusLabel: 'Normal', volumeLiters: 360 },
    { id: 'ULTRA_B01', name: 'Réservoir B', level: 18, status: 'low', statusLabel: 'Critique', volumeLiters: 90 },
  ]);

  // ── US18 – Consommation d'eau (depuis débitmètre)
  const [waterData, setWaterData] = useState({ consumed: 136, goal: 200 });

  // ── Alertes
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [selectedCoop] = useState('Poulailler 2');

  // ─────────────────────────────────────────
  // ⏱ Polling capteurs (simulation)
  // En production → remplacer par MQTT subscribe ou WebSocket
  // ─────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        // US16 – Poids silo
        const feederData = await hardwareService.readFeederWeight(50);
        setFeeding((prev) => ({
          ...prev,
          distributed: feederData.distributedKg,
          consumed:    feederData.consumedKg,
          remaining:   feederData.remainingKg,
        }));

        // US17 – Réservoirs
        const [tankA, tankB] = await Promise.all([
          hardwareService.readTankLevel(HARDWARE.TANK_A_SENSOR_ID),
          hardwareService.readTankLevel(HARDWARE.TANK_B_SENSOR_ID),
        ]);
        const updatedTanks = [
          { id: tankA.sensorId, name: 'Réservoir A', ...tankA },
          { id: tankB.sensorId, name: 'Réservoir B', ...tankB },
        ];
        setTanks(updatedTanks);

        // Alertes niveau critique (US17)
        if (alertEnabled) {
          updatedTanks.forEach((t) => {
            if (t.isLow) {
              Alert.alert(
                '⚠️ Niveau critique',
                `${t.name} est à ${t.levelPercent}% (${t.volumeLiters} L restants). Remplissage requis.`,
                [{ text: 'OK' }],
              );
            }
          });
        }

        // US18 – Consommation eau
        const wData = await hardwareService.readWaterConsumption();
        setWaterData({ consumed: wData.consumedLiters, goal: wData.goalLiters });

        // US15 – Vérifier les plannings à déclencher
        checkScheduleTriggers();
      } catch (err) {
        console.error('[POLL] Erreur lecture capteur:', err);
      }
    };

    poll();
    pollRef.current = setInterval(poll, HARDWARE.POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [alertEnabled]);

  // ─────────────────────────────────────────
  // US15 – Vérification des plannings
  // Compare l'heure courante aux plannings "pending"
  // Si l'heure correspond → active le moteur distributeur
  // ─────────────────────────────────────────
  const checkScheduleTriggers = async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setSchedule((prev) =>
      prev.map((item) => {
        if (item.status === 'pending' && item.time === currentTime) {
          // Déclencher le moteur
          hardwareService.triggerDispenser(item.quantity).then((result) => {
            console.log('[US15] Distributeur activé:', result);
          });
          return { ...item, status: 'running' };
        }
        return item;
      })
    );
  };

  // ─────────────────────────────────────────
  // US15 – Marquer une distribution comme terminée
  // En prod : déclenché par le capteur poids (poids distribué atteint)
  // ─────────────────────────────────────────
  const markAsDone = (id) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'done' } : item))
    );
  };

  // US15 – Ajouter un planning de distribution
  const addSchedule = () => {
    if (!newTime || !newQty || isNaN(parseFloat(newQty))) {
      Alert.alert('Erreur', 'Veuillez remplir l\'heure et la quantité.');
      return;
    }
    const newItem = {
      id:       Date.now(),
      time:     newTime,
      label:    newLabel || 'Distribution',
      quantity: parseFloat(newQty),
      status:   'pending',
    };
    setSchedule((prev) => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setModalVisible(false);
    setNewTime(''); setNewLabel(''); setNewQty('');
  };

  const activeBarIndex = feeding.weeklyData.findIndex((d) => d.height === 100);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.coopDropdown} activeOpacity={0.8}>
          <MaterialIcons name="expand-more" size={18} color={COLORS.white} />
          <Text style={styles.coopDropdownText}>{selectedCoop.toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation?.navigate('Alerts')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.emerald400} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════
            US16 – ALIMENTATION
        ══════════════════════════════ */}
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionLabel}>Overview</Text>
            <Text style={styles.sectionTitle}>ALIMENTATION</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>En Direct</Text>
          </View>
        </View>

        {/* Stat chips – données du capteur poids */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statChipsRow}>
          <StatChip label="Distribué"  value={feeding.distributed} unit={feeding.unit} />
          <StatChip label="Consommé"   value={feeding.consumed}    unit={feeding.unit} accent />
          <StatChip label="Restant"    value={feeding.remaining}   unit={feeding.unit} />
        </ScrollView>

        {/* Graphe hebdomadaire */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartCardTitle}>Consommation hebdomadaire</Text>
            <Text style={styles.chartCardRange}>Lun – Dim</Text>
          </View>
          <WeeklyBarChart
            data={feeding.weeklyData}
            activeIndex={activeBarIndex >= 0 ? activeBarIndex : 3}
          />
        </View>

        {/* ══════════════════════════════
            US15 – PLANNING DISTRIBUTION
        ══════════════════════════════ */}
        <Text style={styles.planningTitle}>Planning de distribution</Text>

        {/* Légende états matériels */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.statusHealthy }]} />
            <Text style={styles.legendText}>Terminé (poids OK)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1D9E75' }]} />
            <Text style={styles.legendText}>Moteur actif</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.legendText}>Planifié</Text>
          </View>
        </View>

        <View style={styles.scheduleList}>
          {schedule.map((item) => (
            <ScheduleItem key={item.id} item={item} onMarkDone={markAsDone} />
          ))}
        </View>

        {/* ══════════════════════════════
            US17 – RÉSERVOIRS D'EAU
        ══════════════════════════════ */}
        <View style={styles.hydrationSection}>
          <Text style={styles.sectionLabel}>Hydratation</Text>
          <Text style={styles.sectionTitle}>ABREUVEMENT</Text>
        </View>

        <View style={styles.tanksRow}>
          {tanks.map((tank) => (
            <TankVisual key={tank.id} tank={tank} />
          ))}
        </View>

        {/* ══════════════════════════════
            US18 – CONSOMMATION D'EAU
        ══════════════════════════════ */}
        <WaterConsumptionBar consumed={waterData.consumed} goal={waterData.goal} />

        {/* Toggle alerte niveau critique (US17) */}
        <View style={styles.alertToggleCard}>
          <View style={styles.alertToggleLeft}>
            <View style={styles.alertToggleIconBox}>
              <MaterialIcons name="notifications-active" size={22} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.alertToggleTitle}>Alerter si &lt; {HARDWARE.TANK_LOW_THRESHOLD}%</Text>
              <Text style={styles.alertToggleSubtitle}>Niveau critique</Text>
            </View>
          </View>
          <Switch
            value={alertEnabled}
            onValueChange={setAlertEnabled}
            trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.secondary }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.surfaceContainerHigh}
          />
        </View>

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── FAB – Ajouter une distribution (US15) */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* ══════════════════════════════
          MODAL – Nouveau planning US15
      ══════════════════════════════ */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Programmer une distribution</Text>

            <Text style={styles.inputLabel}>Heure</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM (ex: 14:30)"
              value={newTime}
              onChangeText={setNewTime}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.inputLabel}>Libellé</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Goûter de l'après-midi"
              value={newLabel}
              onChangeText={setNewLabel}
            />

            <Text style={styles.inputLabel}>Quantité (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 3.5"
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="decimal-pad"
            />

            {/* Info matérielle */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Le moteur {HARDWARE.DISPENSER_MOTOR_ID} sera activé {HARDWARE.DISPENSER_DURATION_PER_KG}s par kg distribué.
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={addSchedule}>
                <Text style={styles.btnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg, height: LAYOUT.topBarHeight,
  },
  coopDropdown: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  coopDropdownText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: -0.3,
  },
  notifBtn: { position: 'relative', padding: SPACING.sm, borderRadius: RADIUS.full },
  notifDot: {
    position: 'absolute', top: 6, right: 6, width: 8, height: 8,
    borderRadius: 4, backgroundColor: COLORS.secondary,
    borderWidth: 2, borderColor: COLORS.primary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], gap: SPACING.xl },

  // Section
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionLabel: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, letterSpacing: -0.5,
  },
  liveBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.xs },
  liveBadgeText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Stat Chips
  statChipsRow: { gap: SPACING.lg, paddingRight: SPACING['2xl'] },
  statChip: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.xl, minWidth: 130, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.outlineVariant + '40',
  },
  statChipAccent: { borderColor: COLORS.primary + '40', borderWidth: 1.5 },
  statChipLabel: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  statChipValue: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'], fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary },
  statChipValueAccent: { color: COLORS.statusHealthy },
  statChipUnit: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.regular, color: COLORS.onSurfaceVariant, opacity: 0.6 },

  // Chart
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING['2xl'],
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant + '30',
  },
  chartCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING['2xl'] },
  chartCardTitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  chartCardRange: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 },
  chartBarCol: { flex: 1, alignItems: 'center', gap: SPACING.sm },
  chartBar: { width: 6, justifyContent: 'flex-end', borderRadius: RADIUS.full },
  chartBarFill: { width: '100%', borderRadius: RADIUS.full },
  chartDayLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  chartDayLabelActive: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.extraBold },

  // Planning
  planningTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  legendRow: { flexDirection: 'row', gap: SPACING.lg, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  scheduleList: { gap: SPACING.md },
  scheduleItemDone: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    backgroundColor: COLORS.surfaceContainer + '80', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.outlineVariant + '30', ...SHADOWS.sm,
  },
  scheduleItemPending: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.lg },
  scheduleTimeBadge: { backgroundColor: COLORS.white, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.outlineVariant + '40', ...SHADOWS.sm },
  scheduleTimeBadgeDark: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  scheduleTime: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  scheduleTimeDark: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  scheduleNameLight: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  scheduleQty: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },
  scheduleQtyLight: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.white + '99', marginTop: 2 },

  // Hydration
  hydrationSection: { marginTop: SPACING.xl, gap: 2 },
  tanksRow: { flexDirection: 'row', gap: SPACING.lg },
  tankWrapper: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', gap: SPACING.md, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant + '40' },
  tank: { width: LAYOUT.tankWidth || 56, height: LAYOUT.tankHeight || 90, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outlineVariant + '50', justifyContent: 'flex-end', position: 'relative' },
  tankDangerLine: { position: 'absolute', bottom: '20%', left: 0, right: 0, height: 1, borderTopWidth: 1, borderColor: COLORS.secondary + '60', borderStyle: 'dashed', zIndex: 1 },
  tankFill: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  tankFillLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold },
  tankName: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  tankBadge: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full },
  tankBadgeText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.extraBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  tankVolume: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },

  // Water bar (US18)
  waterCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant + '30' },
  waterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  waterCardTitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, flex: 1 },
  waterPct: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.extraBold },
  waterTrack: { height: 8, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  waterFill: { height: '100%', borderRadius: RADIUS.full },
  waterMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  waterMetaText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  waterWarn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm, backgroundColor: COLORS.statusWarningBg, borderRadius: RADIUS.md, padding: SPACING.sm },
  waterWarnText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.secondary, flex: 1 },

  // Alert toggle
  alertToggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.statusWarningBg, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.secondary + '30', ...SHADOWS.sm },
  alertToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  alertToggleIconBox: { width: 40, height: 40, backgroundColor: COLORS.secondary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  alertToggleTitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  alertToggleSubtitle: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  // FAB
  fab: { position: 'absolute', bottom: LAYOUT.bottomNavHeight + SPACING.lg, right: SPACING['2xl'], width: LAYOUT.fabSize || 56, height: LAYOUT.fabSize || 56, backgroundColor: COLORS.secondary, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', ...SHADOWS.secondary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS['2xl'] || 24, borderTopRightRadius: RADIUS['2xl'] || 24, padding: SPACING['3xl'] || 32, gap: SPACING.md },
  modalTitle: { fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.primary, marginBottom: SPACING.sm },
  inputLabel: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.md, padding: SPACING.lg, fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.primary, backgroundColor: COLORS.surfaceContainer + '50' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.md, padding: SPACING.md },
  infoText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, flex: 1 },
  modalBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  btnCancel: { flex: 1, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  btnCancelText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant },
  btnConfirm: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  btnConfirmText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
});

export default FeedingScreen;