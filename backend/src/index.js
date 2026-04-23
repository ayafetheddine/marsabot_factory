const express = require('express');
const cors = require('cors');
require('dotenv').config();


const { testConnection } = require('./config/db');
const botRoutes = require('./routes/botRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/bots', authMiddleware, botRoutes);

// Route de test
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: "L'API MarsaBot Factory fonctionne correctement !",
    timestamp: new Date().toISOString(),
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('┌──────────────────────────────────────────┐');
  console.log('│                                          │');
  console.log(`│   🚀 MarsaBot Factory API                │`);
  console.log(`│   ✅ Serveur lancé sur le port ${PORT}       │`);
  console.log(`│   📡 http://localhost:${PORT}/api/health    │`);
  console.log('│                                          │');
  console.log('└──────────────────────────────────────────┘');

  await testConnection();
});
