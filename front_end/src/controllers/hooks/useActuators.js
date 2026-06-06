// src/controllers/hooks/useActuators.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../models/services/apiService';
import { API } from '../../models/utils/constants';

const SOCKET_URL = API.BASE_URL.replace('/api', '');

// ─────────────────────────────────────────────────────────────
//  Modes persistés entre reconnexions Socket.IO
//  Quand la socket se déconnecte/reconnecte, on garde le mode
//  choisi par l'utilisateur (auto ou manuel)
// ─────────────────────────────────────────────────────────────
const persistedModes = {
  fan:        'auto',
  heater:     'auto',
  light:      'auto',
  padCooling: 'auto',
  waterPump:  'auto',
};

const makeDefault = () => ({
  fan:        { on: false, mode: persistedModes.fan,        loading: false },
  heater:     { on: false, mode: persistedModes.heater,     loading: false },
  light:      { on: false, mode: persistedModes.light,      loading: false },
  padCooling: { on: false, mode: persistedModes.padCooling, loading: false },
  waterPump:  { on: false, mode: persistedModes.waterPump,  loading: false },
});

export default function useActuators(coopId, mac, autoStates = {}) {
  const socketRef    = useRef(null);
  const lastAutoSent = useRef({});   // ← évite le spam de commandes AUTO

  const [actuators, setActuators] = useState(makeDefault);
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
      console.log('[Actuators] Socket connecté :', coopId);

      // ✅ Restaurer les modes persistés après reconnexion
      setActuators((prev) => {
        const restored = { ...prev };
        Object.keys(persistedModes).forEach((key) => {
          if (restored[key]) {
            restored[key] = { ...restored[key], mode: persistedModes[key] };
          }
        });
        return restored;
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Actuators] Socket déconnecté');
    });

    // État réel des relais depuis ESP32
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

    socket.on('mode_state', (data) => {
      if (data.mac !== mac) return;
      setActuators((prev) => {
        const updated = { ...prev };
        if (data.target && updated[data.target]) {
          updated[data.target] = { ...updated[data.target], mode: data.mode, loading: false };
          persistedModes[data.target] = data.mode;  // persister
        }
        return updated;
      });
    });

    return () => {
      try {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('actuator_state');
        socket.off('mode_state');
        if (socket.connected) socket.emit('leave_coop', coopId);
        socket.disconnect();
      } catch (e) {}
    };
  }, [coopId, mac]);

  // ── Envoyer une commande SET_RELAY ───────────────────────────
  const sendCommand = useCallback(async (target, value) => {
    if (!mac) return;

    setActuators((prev) => ({
      ...prev,
      [target]: { ...prev[target], loading: true },
    }));

    try {
      await api.post(`/esp32/command/${mac}`, {
        action: 'SET_RELAY', target, value,
      });
      console.log(`[Actuators] Commande envoyée → ${target} = ${value}`);
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], on: value, loading: false },
      }));
    } catch (err) {
      console.error('[Actuators] Erreur commande :', err.message);
      setActuators((prev) => ({
        ...prev,
        [target]: { ...prev[target], loading: false },
      }));
    }
  }, [mac]);

  // ── Changer le mode AUTO / MANUEL ───────────────────────────
  const setMode = useCallback(async (target, mode) => {
    if (!mac) return;

    // ✅ Persister immédiatement pour survivre aux reconnexions
    persistedModes[target] = mode;

    // ✅ Réinitialiser lastAutoSent pour ce target
    //    → permet à AUTO de renvoyer une commande si nécessaire
    delete lastAutoSent.current[target];

    setActuators((prev) => ({
      ...prev,
      [target]: { ...prev[target], mode, loading: true },
    }));

    try {
      await api.post(`/esp32/command/${mac}`, {
        action: 'SET_MODE', target, value: mode,
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

  // ── Mode AUTO — exécution automatique ───────────────────────
  // ✅ Protection anti-spam : envoie la commande seulement si
  //    l'état souhaité est DIFFÉRENT de la dernière commande AUTO envoyée
  useEffect(() => {
    if (!mac) return;

    Object.entries(autoStates).forEach(([target, shouldBeOn]) => {
      const actuator = actuators[target];
      if (!actuator) return;

      if (
        actuator.mode === 'auto' &&
        !actuator.loading &&
        lastAutoSent.current[target] !== shouldBeOn  // ← nouveau : évite le spam
      ) {
        lastAutoSent.current[target] = shouldBeOn;
        console.log(`[Actuators] 🤖 AUTO : ${target} → ${shouldBeOn ? 'ON' : 'OFF'}`);
        // Dans le useEffect auto, avant sendCommand :
// Pour waterPump, ne pas envoyer ON si on n'a pas de données réelles
if (target === 'waterPump' && shouldBeOn && actuator.on === false) {
    // Vérifier que ce n'est pas la valeur par défaut
    // On fait confiance au firmware pour gérer le démarrage
    console.log('[Actuators] waterPump AUTO ON ignoré — attente données réelles');
    return;
}
        sendCommand(target, shouldBeOn);
      }
    });
  }, [autoStates, mac]);

  return { actuators, connected, sendCommand, setMode };
}