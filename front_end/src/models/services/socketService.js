import { io } from 'socket.io-client';

const BACKEND_URL = 'http://192.168.1.X:5000'; // ← remplace par l'IP de ton PC

let socket = null;

export const connectSocket = () => {
    socket = io(BACKEND_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('[SOCKET] Connecté au backend');
        // Rejoindre la room du poulailler
        socket.emit('join_coop', 'cam_01');
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] Déconnecté');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};