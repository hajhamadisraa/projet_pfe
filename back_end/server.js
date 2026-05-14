// server.js
const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const http       = require('http');           // ✅ NOUVEAU
const { Server } = require('socket.io');      // ✅ NOUVEAU
const connectDB  = require('./config/db');
const mqttService = require('./services/mqttService'); // ✅ NOUVEAU
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { startMonitoring } = require('./services/monitoringService');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);        // ✅ HTTP server (pour Socket.IO)

// ─────────────────────────────────────────
//  Socket.IO — temps réel vers l'app mobile
// ─────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',           // En prod : mettez l'IP de votre app
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] 📱 App connectée : ${socket.id}`);

  // L'app rejoint la "room" d'un poulailler pour ses données en temps réel
  socket.on('join_coop', (coopId) => {
    socket.join(`coop_${coopId}`);
    console.log(`[SOCKET] App ${socket.id} rejoint coop_${coopId}`);
  });

  socket.on('leave_coop', (coopId) => {
    socket.leave(`coop_${coopId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] 📱 App déconnectée : ${socket.id}`);
  });
});

// ─────────────────────────────────────────
//  Middlewares
// ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Injecter io dans les requêtes (pour les controllers qui publient des commandes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'API PoulIA fonctionne !',
    mqtt:    mqttService.isConnected() ? '✅ Connecté' : '❌ Déconnecté',
  });
});

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/coops',     require('./routes/coopRoutes'));
app.use('/api/alerts',    require('./routes/alertRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/esp32',     require('./routes/esp32Routes'));
app.use('/api/chicken', require('./routes/chickenRoutes'));


// ─────────────────────────────────────────
//  Erreurs — toujours en dernier
// ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────
//  Démarrage
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Serveur lancé sur le port ${PORT}`);

  // ✅ Initialiser MQTT après démarrage du serveur
  mqttService.init(io);
  startMonitoring(io);
});