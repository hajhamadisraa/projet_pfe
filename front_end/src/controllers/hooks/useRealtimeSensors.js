// src/controllers/hooks/useRealtimeSensors.js
// ═══════════════════════════════════════════════════════════════
//  Hook — Données capteurs en temps réel via Socket.IO
//  Usage : const { sensors, connected } = useRealtimeSensors(coopId)
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API } from '../../models/utils/constants';

// URL Socket.IO = même serveur que l'API mais sans /api
const SOCKET_URL = API.BASE_URL.replace('/api', '');

export default function useRealtimeSensors(coopId) {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [sensors,   setSensors]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!coopId) return;

    // ── Connexion au serveur Socket.IO ───────────────────────
    console.log(`[Socket] Connexion à ${SOCKET_URL}`);

    const socket = io(SOCKET_URL, {
      transports:         ['websocket'],
      reconnection:       true,
      reconnectionDelay:  2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // ── Événements de connexion ──────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket] ✅ Connecté :', socket.id);
      setConnected(true);

      // Rejoindre la room du poulailler pour recevoir ses données
      socket.emit('join_coop', coopId);
      console.log(`[Socket] Rejoint room : coop_${coopId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Déconnecté :', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Erreur connexion :', err.message);
      setConnected(false);
    });

    // ── Réception données capteurs (temps réel depuis MQTT) ──
    // Émis par mqttService.js quand l'ESP32 publie des données
    socket.on('sensor_update', (data) => {
      if (data.coopId !== coopId) return; // filtrer par poulailler

      console.log(`[Socket] 📊 Données reçues :`, data);

      setSensors((prev) => ({
        temperature: {
          value: data.temperature ?? prev?.temperature?.value ?? '--',
          trend: calcTrend(prev?.temperature?.value, data.temperature),
          alert: data.temperature > 30,
        },
        humidity: {
          value: data.humidity ?? prev?.humidity?.value ?? '--',
          trend: calcTrend(prev?.humidity?.value, data.humidity),
          alert: data.humidity > 75,
        },
        luminosity: {
          value: data.luminosity ?? prev?.luminosity?.value ?? '--',
          trend: calcTrend(prev?.luminosity?.value, data.luminosity),
          alert: false,
        },
        ventilation: {
          value: data.ventilation ?? prev?.ventilation?.value ?? '--',
          trend: 'flat',
          alert: false,
        },
      }));

      setLastUpdate(new Date(data.timestamp || Date.now()));
    });

    // ── Cleanup au démontage ─────────────────────────────────
    return () => {
      if (socket.connected) {
        socket.emit('leave_coop', coopId);
      }
      socket.disconnect();
      console.log('[Socket] Déconnecté proprement');
    };
  }, [coopId]);

  return { sensors, connected, lastUpdate };
}

// ─────────────────────────────────────────────────────────────
//  Calcule la tendance entre deux valeurs
// ─────────────────────────────────────────────────────────────
function calcTrend(prev, curr) {
  if (prev == null || curr == null) return 'flat';
  if (curr > prev + 0.3) return 'up';
  if (curr < prev - 0.3) return 'down';
  return 'flat';
}