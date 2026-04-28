const { getAllSettings, updateSetting } = require('../models/settingModel');

async function getSettings(req, res) {
  try {
    const rows = await getAllSettings();
    // Transforme le tableau [{setting_key, setting_value}] en objet plat
    const settings = {};
    rows.forEach(({ setting_key, setting_value }) => {
      settings[setting_key] = setting_value;
    });
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Erreur getSettings :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres.' });
  }
}

async function updateSettings(req, res) {
  try {
    const updates = req.body; // { ollama_url: '...', ollama_default_model: '...' }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Corps de requête invalide.' });
    }
    for (const [key, value] of Object.entries(updates)) {
      await updateSetting(key, String(value));
    }
    return res.json({ success: true, message: 'Paramètres mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur updateSettings :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des paramètres.' });
  }
}

module.exports = { getSettings, updateSettings };
