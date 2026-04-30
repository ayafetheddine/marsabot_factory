const { pool } = require('../config/db');

/**
 * Crée la table documents si elle n'existe pas encore.
 */
async function initDocumentsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id                  INT           AUTO_INCREMENT PRIMARY KEY,
      bot_id              INT           NOT NULL,
      nom_original        VARCHAR(255)  NOT NULL,
      nom_fichier_genere  VARCHAR(255)  NOT NULL,
      chemin              VARCHAR(500)  NOT NULL,
      taille              INT           NOT NULL DEFAULT 0,
      content             LONGTEXT,
      date_ajout          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_documents_bot
        FOREIGN KEY (bot_id) REFERENCES bots(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);
  // Ajoute la colonne content si la table existait avant cette version
  try {
    await pool.execute(`
      ALTER TABLE documents ADD COLUMN content LONGTEXT
    `);
    console.log('✅ Colonne content ajoutée à la table documents.');
  } catch (err) {
    // Erreur 1060 = colonne déjà existante, on ignore silencieusement
    if (err.errno !== 1060) throw err;
  }
  console.log('✅ Table documents vérifiée/créée.');
}

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
async function createDocument({ botId, nomOriginal, nomFichierGenere, chemin, taille, content = '' }) {
  const [result] = await pool.execute(
    `INSERT INTO documents (bot_id, nom_original, nom_fichier_genere, chemin, taille, content)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [botId, nomOriginal, nomFichierGenere, chemin, taille, content]
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

/**
 * Crée la table document_chunks si elle n'existe pas encore.
 * Chaque chunk est lié à un document (ON DELETE CASCADE) et stocke
 * le texte brut ainsi que l'embedding au format JSON.
 */
async function initChunksTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id           INT  AUTO_INCREMENT PRIMARY KEY,
      document_id  INT  NOT NULL,
      chunk_text   TEXT NOT NULL,
      embedding    JSON,
      CONSTRAINT fk_chunks_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table document_chunks vérifiée/créée.');
}

module.exports = { initDocumentsTable, initChunksTable, findByBotAndName, createDocument, getDocumentsByBot, getDocumentById, deleteDocument };
