const { pool } = require('../config/db');

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

module.exports = { createBot, getAllBots };
