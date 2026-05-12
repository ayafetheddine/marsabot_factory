const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const { testConnection } = require('./config/db');
const { initApiSourceTable } = require('./models/apiSourceModel');
const { initSettingsTable } = require('./models/settingModel');
const { initDocumentsTable, initChunksTable } = require('./models/documentModel');
const { initMessagesTable } = require('./models/messageModel');
const whatsappService = require('./services/whatsappService');
const botRoutes = require('./routes/botRoutes');
const adminRoutes = require('./routes/adminRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Fichiers uploadés accessibles publiquement (lecture seule)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/bots', authMiddleware, botRoutes);
app.use('/api/knowledge', authMiddleware, knowledgeRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

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
  await initApiSourceTable();
  await initSettingsTable();
  await initDocumentsTable();
  await initChunksTable();
  await initMessagesTable();
  await whatsappService.initializeActiveBots();
});
