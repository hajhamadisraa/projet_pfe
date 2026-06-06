import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API } from '../../models/utils/constants';

const SOCKET_URL = API.BASE_URL.replace('/api', '');

export default function useRealtimeSensors(coopId) {
  const socketRef  = useRef(null);
  const [connected,  setConnected]  = useState(false);
  const [sensors,    setSensors]    = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!coopId) return;

    console.log(`[Socket] Connexion à ${SOCKET_URL}`);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_coop', coopId);
      console.log('[Socket] ✅ Connecté :', socket.id);
      console.log(`[Socket] Rejoint room : coop_${coopId}`);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[Socket] ❌ Déconnecté :', reason);
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      console.error('[Socket] Erreur connexion :', err.message);
    });

    socket.on('sensor_update', (data) => {
      if (data.coopId !== coopId) return;
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
        // ✅ Niveau eau — reçu depuis l'ESP32 via mqttService
        waterLevel: {
          value: data.waterLevel ?? prev?.waterLevel?.value ?? 0,
          trend: calcTrend(prev?.waterLevel?.value, data.waterLevel),
          alert: (data.waterLevel ?? 100) < 20,
        },
        pumpOn: {
          value: data.pumpOn ?? prev?.pumpOn?.value ?? false,
        },
      }));

      setLastUpdate(new Date(data.timestamp || Date.now()));
    });

    return () => {
      try {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('sensor_update');
        if (socket.connected) socket.emit('leave_coop', coopId);
        socket.disconnect();
      } catch (e) {}
      console.log('[Socket] Déconnecté proprement');
    };
  }, [coopId]);

  return { sensors, connected, lastUpdate };
}

function calcTrend(prev, curr) {
  if (prev == null || curr == null) return 'flat';
  if (curr > prev + 0.3) return 'up';
  if (curr < prev - 0.3) return 'down';
  return 'flat';
}