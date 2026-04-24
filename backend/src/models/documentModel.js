const { pool } = require('../config/db');

/**
 * Vérifie si un fichier avec le même nom original existe déjà pour un bot.
 */
async function findByBotAndName(botId, originalName) {
  const [rows] = await pool.execute(
    'SELECT id FROM documents WHERE bot_id = ? AND nom_original = ? LIMIT 1',
    [botId, originalName]
  );
  return rows[0] || null;
}

/**
 * Insère un nouveau document en base.
 */
async function createDocument({ botId, nomOriginal, nomFichierGenere, chemin, taille }) {
  const [result] = await pool.execute(
    `INSERT INTO documents (bot_id, nom_original, nom_fichier_genere, chemin, taille)
     VALUES (?, ?, ?, ?, ?)`,
    [botId, nomOriginal, nomFichierGenere, chemin, taille]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM documents WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
}

/**
 * Récupère tous les documents d'un bot, du plus récent au plus ancien.
 */
async function getDocumentsByBot(botId) {
  const [rows] = await pool.execute(
    'SELECT * FROM documents WHERE bot_id = ? ORDER BY date_ajout DESC',
    [botId]
  );
  return rows;
}

/**
 * Récupère un document par son id.
 */
async function getDocumentById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM documents WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Supprime un document de la base par son id.
 */
async function deleteDocument(id) {
  await pool.execute('DELETE FROM documents WHERE id = ?', [id]);
}

module.exports = { findByBotAndName, createDocument, getDocumentsByBot, getDocumentById, deleteDocument };
