const express = require('express');
const router = express.Router();
const { createBot, getAllBots } = require('../controllers/botController');

router.post('/', createBot);
router.get('/', getAllBots);

module.exports = router;
