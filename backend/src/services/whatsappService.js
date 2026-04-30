const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const { pool } = require('../config/db');
const vectorService = require('./vectorService');

/**
 * Map des clients actifs : botId (string) → { client, status }
 * statuts : 'initializing' | 'qr_ready' | 'ready' | 'disconnected'
 */
const clients = new Map();

/**
 * Détruit un client existant pour un botId donné.
 */
async function destroyClient(botId) {
  const entry = clients.get(String(botId));
  if (entry) {
    try { await entry.client.destroy(); } catch (_) { /* ignore */ }
    clients.delete(String(botId));
  }
}

/**
 * Initialise un client WhatsApp pour un bot.
 * @param {number|string} botId
 * @param {function} qrCallback  (err, qrBase64DataURL) — appelé lors du premier QR
 */
async function initializeWhatsApp(botId, qrCallback) {
  const key = String(botId);

  // Réinitialise si un client existe déjà
  await destroyClient(key);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `bot_${key}` }),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  clients.set(key, { client, status: 'initializing' });

  client.on('qr', async (qr) => {
    const entry = clients.get(key);
    if (entry) entry.status = 'qr_ready';
    try {
      const base64 = await qrcode.toDataURL(qr);
      qrCallback(null, base64);
    } catch (err) {
      qrCallback(err);
    }
  });

  client.on('ready', async () => {
    const entry = clients.get(key);
    if (entry) entry.status = 'ready';
    console.log(`✅ Bot #${key} WhatsApp connecté et prêt.`);
    try {
      await pool.execute("UPDATE bots SET statut = 'actif' WHERE id = ?", [key]);
    } catch (dbErr) {
      console.error(`⚠️ Impossible de mettre à jour le statut du bot #${key} :`, dbErr.message);
    }
  });

  // ── Traitement des messages entrants ──────────────────────────────────────
  client.on('message', async (msg) => {
    // Ignorer groupes et statuts
    if (msg.isGroupMsg || msg.from === 'status@broadcast') return;

    try {
      // 1. Récupérer la configuration globale Ollama
      const [settingRows] = await pool.execute(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('ollama_url', 'ollama_default_model')"
      );
      const settingsMap = {};
      settingRows.forEach(({ setting_key, setting_value }) => {
        settingsMap[setting_key] = setting_value;
      });
      const ollamaUrl = settingsMap['ollama_url'] || 'http://localhost:11434';
      const defaultModel = settingsMap['ollama_default_model'] || 'phi3';

      // 2. Récupérer la config du bot (allow_general_knowledge)
      const [botRows] = await pool.execute(
        'SELECT allow_general_knowledge FROM bots WHERE id = ? LIMIT 1',
        [key]
      );
      const allowGeneralKnowledge = botRows.length > 0 ? Boolean(botRows[0].allow_general_knowledge) : false;

      // 3. RAG — vectoriser la question et chercher dans la mémoire du bot
      let retrievedContext = '';
      try {
        const questionEmbedding = await vectorService.getEmbedding(msg.body);
        retrievedContext = await vectorService.findSimilarChunks(questionEmbedding, key);
        console.log(`🔍 Contexte trouvé pour bot #${key} :`, retrievedContext || '(vide)');
      } catch (ragErr) {
        console.warn(`⚠️  RAG échoué pour bot #${key} :`, ragErr.message);
        retrievedContext = '';
      }

      // 4. Court-circuit strict : le CODE refuse de répondre, sans appeler le LLM
      //    Ne jamais déléguer cette responsabilité au modèle (risque d'hallucination garanti)
      if (!allowGeneralKnowledge && !retrievedContext.trim()) {
        await msg.reply('Désolé, je ne dispose pas de cette information. Puis-je vous aider autrement ?');
        return;
      }

      // 5. Construction du system prompt
      let systemPrompt;
      if (!allowGeneralKnowledge) {
        systemPrompt =
          "Tu es un assistant strict. Tu dois répondre UNIQUEMENT en utilisant le contexte fourni. " +
          "Si la réponse n'est pas dans le contexte, dis EXACTEMENT " +
          "'Désolé, je ne dispose pas de cette information dans ma base de connaissances.'. " +
          "N'invente rien. Contexte: " + retrievedContext;
      } else {
        systemPrompt =
          "Tu es un assistant utile. Utilise le contexte fourni en priorité. " +
          "Si l'information n'y est pas, utilise tes connaissances générales pour aider l'utilisateur. " +
          "Contexte: " + retrievedContext;
      }

      // 5. Appel à Ollama
      const ollamaResponse = await axios.post(
        `${ollamaUrl}/api/generate`,
        {
          model: defaultModel,
          prompt: msg.body,
          system: systemPrompt,
          stream: false,
        },
        { timeout: 120000 }
      );

      // 6. Répondre sur WhatsApp
      await msg.reply(ollamaResponse.data.response);

    } catch (error) {
      console.error(`Erreur traitement message bot #${key} :`, error.message);
      await msg.reply('Une erreur interne est survenue. Veuillez réessayer.');
    }
  });

  client.on('auth_failure', (msg) => {
    qrCallback(new Error(`Échec d'authentification WhatsApp : ${msg}`));
    clients.delete(key);
  });

  client.on('disconnected', async (reason) => {
    console.log(`🛑 Déconnexion WhatsApp détectée pour le bot ${key}. Raison :`, reason);
    // 1. Mettre à jour le statut en base avant de détruire le client
    try {
      await pool.execute("UPDATE bots SET statut = 'inactif' WHERE id = ?", [key]);
    } catch (dbErr) {
      console.error(`⚠️ Impossible de mettre à jour le statut du bot #${key} :`, dbErr.message);
    }
    try {
      // 2. On détruit proprement l'instance Puppeteer pour relâcher les fichiers (lockfile, etc.)
      await client.destroy();
      console.log(`✅ Instance Puppeteer fermée proprement pour le bot ${key}.`);
    } catch (error) {
      console.error(`⚠️ Erreur lors de la fermeture de l'instance pour le bot ${key}:`, error.message);
    } finally {
      // 3. On retire le bot de la Map des clients actifs pour garder la mémoire propre
      if (clients.has(key)) {
        clients.delete(key);
      }
    }
  });

  // Non-bloquant — les événements 'qr' et 'ready' arrivent de manière asynchrone
  client.initialize().catch((err) => {
    qrCallback(new Error(`Impossible de démarrer Puppeteer : ${err.message}`));
    clients.delete(key);
  });
}

/**
 * Retourne le statut d'un client.
 */
function getClientStatus(botId) {
  const entry = clients.get(String(botId));
  return entry ? entry.status : 'none';
}

/**
 * Relance automatiquement tous les bots ayant le statut 'actif' en base.
 * Appelée au démarrage du serveur pour éviter l'intervention manuelle.
 */
async function initializeActiveBots() {
  const [rows] = await pool.execute("SELECT id FROM bots WHERE statut = 'actif'");
  if (rows.length === 0) {
    console.log('   ℹ️  Aucun bot actif à relancer.');
    return;
  }
  console.log(`   🤖 Relance automatique de ${rows.length} bot(s) actif(s)...`);
  for (const row of rows) {
    try {
      // Callback vide : LocalAuth gère la session, aucun nouveau QR attendu
      await initializeWhatsApp(row.id, (err) => {
        if (err) console.warn(`   ⚠️  QR inattendu pour bot #${row.id} :`, err.message);
      });
      console.log(`   ✅ Bot #${row.id} initialisé.`);
    } catch (err) {
      console.error(`   ❌ Échec de la relance du bot #${row.id} :`, err.message);
    }
  }
}

module.exports = { initializeWhatsApp, destroyClient, getClientStatus, initializeActiveBots };
