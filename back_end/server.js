const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes (on les ajoutera plus tard)
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/coops',     require('./routes/coopRoutes'));
app.use('/api/alerts',    require('./routes/alertRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Serveur lancé sur le port ' + PORT));