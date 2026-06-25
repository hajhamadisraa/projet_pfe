// src/controllers/hooks/useActuators.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../models/services/apiService';
import { API } from '../../models/utils/constants';

const SOCKET_URL = API.BASE_URL.replace('/api', '');

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
  const lastAutoSent = useRef({});

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
          persistedModes[data.target] = data.mode;
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

    persistedModes[target] = mode;

    // ✅ CORRECTION bug 2 : en mode MANUEL, figer lastAutoSent à l'état actuel
    //    → empêche le useEffect AUTO de renvoyer une commande immédiatement
    //    En AUTO : delete pour forcer une réévaluation propre
    if (mode === 'manuel') {
      lastAutoSent.current[target] = actuators[target]?.on ?? false;
    } else {
      delete lastAutoSent.current[target];
    }

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
  }, [mac, actuators]);

  // ── Mode AUTO — exécution automatique ───────────────────────
  useEffect(() => {
    if (!mac) return;

    Object.entries(autoStates).forEach(([target, shouldBeOn]) => {
      const actuator = actuators[target];
      if (!actuator) return;

      // ✅ CORRECTION bug 2 : sortir immédiatement si mode MANUEL
      if (actuator.mode !== 'auto') return;
      if (actuator.loading) return;
      if (lastAutoSent.current[target] === shouldBeOn) return;

      // Protection waterPump : ignorer ON au démarrage sans données réelles
      if (target === 'waterPump' && shouldBeOn && actuator.on === false) {
        console.log('[Actuators] waterPump AUTO ON ignoré — attente données réelles');
        return;
      }

      // Protection heater : ignorer ON au démarrage sans données réelles
      if (target === 'heater' && shouldBeOn && actuator.on === false) {
        console.log('[Actuators] heater AUTO ON ignoré — attente données réelles');
        return;
      }

      lastAutoSent.current[target] = shouldBeOn;
      console.log(`[Actuators] 🤖 AUTO : ${target} → ${shouldBeOn ? 'ON' : 'OFF'}`);
      sendCommand(target, shouldBeOn);
    });
  }, [autoStates, mac]);

  return { actuators, connected, sendCommand, setMode };
}