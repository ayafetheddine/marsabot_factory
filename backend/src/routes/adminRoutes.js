const express = require('express');
const router = express.Router();
const { login, createDefaultAdmin } = require('../controllers/adminController');

// POST /api/admin/login
router.post('/login', login);
// GET /api/admin/setup
router.get('/setup', createDefaultAdmin);

module.exports = router;
