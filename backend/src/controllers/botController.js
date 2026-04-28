const { pool } = require('../config/db');
const { initializeWhatsApp } = require('../services/whatsappService');

// Créer un nouveau bot
async function createBot(req, res) {
  try {
    const { nom, description, specialite_domaine, numero_telephone } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO bots (nom, description, specialite_domaine, numero_telephone) VALUES (?, ?, ?, ?)',
      [nom, description, specialite_domaine, numero_telephone]
    );

    const [rows] = await pool.execute('SELECT * FROM bots WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur createBot :', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du bot.' });
  }
}

// Récupérer tous les bots
async function getAllBots(_req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM bots ORDER BY date_creation DESC');

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur getAllBots :', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des bots.' });
  }
}

// Générer le QR Code WhatsApp pour un bot
function generateQrCode(req, res) {
  const { botId } = req.params;

  const TIMEOUT_MS = 60000; // 60s max pour que Puppeteer démarre et génère le QR

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Timeout (60s) : Puppeteer n\'a pas pu générer le QR. Vérifiez que Chrome est accessible.',
      });
    }
  }, TIMEOUT_MS);

  try {
    initializeWhatsApp(botId, (err, qrBase64) => {
      clearTimeout(timer);
      if (res.headersSent) return;
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.json({ success: true, qrCodeBase64: qrBase64 });
    });
  } catch (error) {
    clearTimeout(timer);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = { createBot, getAllBots, generateQrCode };
