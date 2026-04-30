const express = require('express');
const router = express.Router();
const { createBot, getAllBots, generateQrCode, updateBot } = require('../controllers/botController');

router.post('/', createBot);
router.get('/', getAllBots);
router.put('/:id', updateBot);

// GET /api/bots/:botId/whatsapp/qr — génère et retourne le QR code WhatsApp
router.get('/:botId/whatsapp/qr', generateQrCode);

module.exports = router;
