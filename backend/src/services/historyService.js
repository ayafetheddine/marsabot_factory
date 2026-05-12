'use strict';

const { saveMessage, getRecentMessages } = require('../models/messageModel');

/**
 * Persiste un message dans l'historique de la conversation.
 * @param {string} idGroupe - Identifiant WhatsApp de l'utilisateur ou du groupe
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
async function persistMessage(idGroupe, botId, role, content) {
  try {
    await saveMessage(idGroupe, botId, role, content);
  } catch (err) {
    // Non bloquant — une erreur de persistance ne doit pas interrompre la réponse
    console.warn(`⚠️  Impossible de sauvegarder le message (${idGroupe}, bot=${botId}) :`, err.message);
  }
}

/**
 * Récupère les derniers messages d'un utilisateur/groupe pour les injecter comme contexte.
 * @param {string} idGroupe
 * @param {number} limit - Nombre de messages à récupérer (défaut : 10)
 * @returns {Promise<{role: string, content: string}[]>}
 */
async function getHistory(idGroupe, botId, limit = 10) {
  try {
    return await getRecentMessages(idGroupe, botId, limit);
  } catch (err) {
    console.warn(`⚠️  Impossible de récupérer l'historique (${idGroupe}, bot=${botId}) :`, err.message);
    return [];
  }
}

module.exports = { persistMessage, getHistory };
