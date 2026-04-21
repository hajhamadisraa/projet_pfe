const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const connectDB  = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API PoulIA fonctionne !' });
});

// Toutes les routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/coops',     require('./routes/coopRoutes'));
app.use('/api/alerts',    require('./routes/alertRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));

// Gestion des erreurs — toujours en dernier
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lance sur le port ${PORT}`);
});