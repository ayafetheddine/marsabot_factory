const axios = require('axios');
const { pool } = require('../config/db');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';

/**
 * Découpe un texte en chunks avec chevauchement.
 * L'index avance toujours d'au moins 1 caractère pour éviter toute boucle infinie.
 * @param {string} text        - Texte source
 * @param {number} chunkSize   - Taille max en caractères d'un chunk
 * @param {number} overlap     - Nombre de caractères de chevauchement entre chunks
 * @returns {string[]}
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];
  const chunks = [];
  // Sécurité anti-boucle infinie : le pas doit toujours être positif
  const step = chunkSize - overlap > 0 ? chunkSize - overlap : chunkSize;
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += step;
  }
  return chunks;
}

/**
 * Obtient l'embedding d'un texte via l'API Ollama.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function getEmbedding(text) {
  const response = await axios.post(
    `${OLLAMA_URL}/api/embeddings`,
    { model: EMBED_MODEL, prompt: text },
    { timeout: 10000 } // 10 s max — évite de bloquer le handler WhatsApp
  );
  return response.data.embedding;
}

/**
 * Découpe le texte en chunks, vectorise chaque chunk via Ollama et stocke
 * les résultats dans la table document_chunks.
 * @param {number} documentId
 * @param {string} text
 */
async function processAndStoreDocument(documentId, text) {
  if (!text || text.trim().length === 0) {
    console.log(`⚠️  Aucun texte à vectoriser pour le document ${documentId}.`);
    return;
  }

  const chunks = chunkText(text);
  console.log(`✂️  Découpage du texte en ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk);
    await pool.execute(
      'INSERT INTO document_chunks (document_id, chunk_text, embedding) VALUES (?, ?, ?)',
      [documentId, chunk, JSON.stringify(embedding)]
    );
  }

  console.log(`🔢 Vectorisation et stockage terminés (${chunks.length} chunks pour le document ${documentId}).`);
}

/**
 * Calcule la similarité cosinus entre deux vecteurs.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} score entre -1 et 1
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Cherche les chunks les plus proches sémantiquement de la question dans la base du bot.
 * @param {number[]} questionEmbedding  - Vecteur de la question
 * @param {number|string} botId
 * @param {number} topK                 - Nombre de chunks à retourner
 * @returns {Promise<string>}           - Chunks concatenés séparés par des sauts de ligne
 */
async function findSimilarChunks(questionEmbedding, botId, topK = 2) {
  const [rows] = await pool.execute(
    `SELECT dc.chunk_text, dc.embedding
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE d.bot_id = ?`,
    [String(botId)]
  );

  if (rows.length === 0) return '';

  const scored = rows.map((row) => {
    const embedding = typeof row.embedding === 'string'
      ? JSON.parse(row.embedding)
      : row.embedding;
    const score = cosineSimilarity(questionEmbedding, embedding);
    return { text: row.chunk_text, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, topK)
    .map((c) => c.text)
    .join('\n\n');
}

module.exports = { chunkText, getEmbedding, processAndStoreDocument, cosineSimilarity, findSimilarChunks };
