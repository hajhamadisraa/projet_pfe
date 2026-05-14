// src/controllers/hooks/useActuators.js
// ═══════════════════════════════════════════════════════════════
//  Hook — Contrôle des actionneurs via MQTT
//  Usage : const { actuators, sendCommand, setMode } = useActuators(coopId, mac, autoStates)
//
//  autoStates = { fan: true/false } — calculé par getAutoFanState dans EquipmentScreen
//  Quand mode = 'auto', le hook envoie la commande automatiquement si l'état doit changer
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../models/services/apiService';
import { API } from '../../models/utils/constants';

const SOCKET_URL = API.BASE_URL.replace('/api', '');

// ─────────────────────────────────────────────────────────────
//  État initial des actionneurs
// ─────────────────────────────────────────────────────────────
const defaultActuators = {
  fan:        { on: false, mode: 'auto', loading: false },
  heater:     { on: false, mode: 'auto', loading: false },
  light:      { on: false, mode: 'auto', loading: false },
  padCooling: { on: false, mode: 'auto', loading: false },
  waterPump:  { on: false, mode: 'auto', loading: false },
};

// ─────────────────────────────────────────────────────────────
//  autoStates = { fan: true/false, heater: true/false, ... }
//  Ces valeurs sont calculées dans EquipmentScreen selon les
//  seuils climatiques (getAutoFanState) et passées ici
// ─────────────────────────────────────────────────────────────
export default function useActuators(coopId, mac, autoStates = {}) {
  const socketRef = useRef(null);
  const [actuators, setActuators] = useState(defaultActuators);
  const [connected, setConnected] = useState(false);

  // ── Connexion Socket.IO ──────────────────────────────────────
  useEffect(() => {
    if (!coopId || !mac) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_coop', coopId);
      console.log('[Actuators] Socket connecté, room rejointe :', coopId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Actuators] Socket déconnecté');
    });

    // ── Réception état réel des relais depuis l'ESP32 ──────────
    // Émis par mqttService.js quand ESP32 publie coop/{MAC}/actuators
    // Déclenché après chaque SET_RELAY + au démarrage de l'ESP32
    socket.on('actuator_state', (data) => {
      if (data.mac !== mac) return;
      console.log('[Actuators] ✅ État reçu depuis ESP32 :', data);

      setActuators((prev) => ({
        fan:        { ...prev.fan,        on: data.fan        ?? prev.fan.on,        loading: false },
        heater:     { ...prev.heater,     on: data.heater     ?? prev.heater.on,     loading: false },
        light:      { ...prev.light,      on: data.light      ?? prev.light.on,      loading: false },
        padCooling: { ...prev.padCooling, on: data.padCooling ?? prev.padCooling.on, loading: false },
        waterPump:  { ...prev.waterPump,  on: data.waterPump  ?? prev.waterPump.on,  loading: false },
      }));
    });

    // ── Réception changement de mode depuis l'app ──────────────
    socket.on('mode_state', (data) => {
      if (data.mac !== mac) return;
      setActuators((prev) => {
        const updated = { ...prev };
        if (data.target && updated[data.target]) {
          updated[data.target] = { ...updated[data.target], mode: data.mode, loading: false };
        }
        return updated;
      });
    });

    return () => {
      socket.emit('leave_coop', coopId);
      socket.disconnect();
    };
  }, [coopId, mac]);

  // ── Envoyer une commande SET_RELAY ───────────────────────────
  const sendCommand = useCallback(async (target, value) => {
    if (!mac) {
      console.warn('[Actuators] Pas de MAC — commande ignorée');
      return;
    }

    // Feedback immédiat dans l'UI
    setActuators((prev) => ({
      ...prev,
      [target]: { ...prev[target], loading: true },
    }));

    try {
      await api.post(`/esp32/command/${mac}`, {
        action: 'SET_RELAY',
        target,
        value,
      });
      console.log(`[Actuators] Commande envoyée → ${target} = ${value}`);

      // Mise à jour optimiste (l'état réel arrive ensuite via Socket.IO actuator_state)
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], on: value, loading: false },
      }));

    } catch (err) {
      console.error('[Actuators] Erreur commande :', err.message);
      // Retirer le loading sans changer l'état
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], loading: false },
      }));
    }
  }, [mac]);

  // ── Changer le mode AUTO / MANUEL ───────────────────────────
  const setMode = useCallback(async (target, mode) => {
    if (!mac) return;

    // Mise à jour UI immédiate
    setActuators((prev) => ({
      ...prev,
      [target]: { ...prev[target], mode, loading: true },
    }));

    try {
      await api.post(`/esp32/command/${mac}`, {
        action: 'SET_MODE',
        target,
        value:  mode,
      });
      console.log(`[Actuators] Mode ${target} → ${mode}`);
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], mode, loading: false },
      }));
    } catch (err) {
      console.error('[Actuators] Erreur SET_MODE :', err.message);
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], loading: false },
      }));
    }
  }, [mac]);

  // ── Mode AUTO — exécution automatique des commandes ──────────
  // Quand autoStates change (nouvelle température reçue via Socket.IO)
  // → si un actionneur est en mode 'auto' et que son état doit changer
  // → on envoie la commande automatiquement
  //
  // Exemple : T° passe de 26°C à 28°C
  //   autoStates = { fan: true }
  //   actuators.fan.mode = 'auto' && actuators.fan.on = false
  //   → sendCommand('fan', true) → relais ON
  useEffect(() => {
    if (!mac) return;

    Object.entries(autoStates).forEach(([target, shouldBeOn]) => {
      const actuator = actuators[target];
      if (!actuator) return;

      if (actuator.mode === 'auto' && actuator.on !== shouldBeOn && !actuator.loading) {
        console.log(`[Actuators] 🤖 AUTO : ${target} → ${shouldBeOn ? 'ON' : 'OFF'} (T° seuil atteint)`);
        sendCommand(target, shouldBeOn);
      }
    });
  }, [autoStates, mac]);
  // Note : on exclut intentionnellement 'actuators' et 'sendCommand' des deps
  // pour éviter une boucle infinie — on lit leur valeur courante via la closure

  return { actuators, connected, sendCommand, setMode };
}