const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

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

  client.on('ready', () => {
    const entry = clients.get(key);
    if (entry) entry.status = 'ready';
  });

  client.on('auth_failure', (msg) => {
    qrCallback(new Error(`Échec d'authentification WhatsApp : ${msg}`));
    clients.delete(key);
  });

  client.on('disconnected', () => {
    clients.delete(key);
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

module.exports = { initializeWhatsApp, destroyClient, getClientStatus };
