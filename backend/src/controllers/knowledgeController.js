const fs = require('fs');
const { findByBotAndName, createDocument, getDocumentsByBot, getDocumentById, deleteDocument } = require('../models/documentModel');

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' });
    }

    const { botId } = req.body;

    if (!botId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Le champ botId est requis.' });
    }

    // Protection anti-doublon
    const existing = await findByBotAndName(botId, req.file.originalname);
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Ce fichier existe déjà pour ce bot. Veuillez le renommer si c\'est une nouvelle version.',
      });
    }

    // Enregistrement en base
    const document = await createDocument({
      botId,
      nomOriginal: req.file.originalname,
      nomFichierGenere: req.file.filename,
      chemin: req.file.path,
      taille: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: 'Fichier uploadé et enregistré avec succès.',
      data: document,
    });
  } catch (error) {
    console.error('Erreur uploadFile :', error.message);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) { /* fichier peut ne pas exister */ }
    }
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'upload.' });
  }
}

async function getDocuments(req, res) {
  try {
    const { botId } = req.params;
    const documents = await getDocumentsByBot(botId);
    return res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Erreur getDocuments :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des documents.' });
  }
}

async function deleteFile(req, res) {
  try {
    const { docId } = req.params;

    const document = await getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document introuvable.' });
    }

    // Suppression du fichier physique
    try {
      fs.unlinkSync(document.chemin);
    } catch (_) {
      // Le fichier physique peut déjà avoir disparu — on continue quand même
    }

    // Suppression en base
    await deleteDocument(docId);

    return res.json({ success: true, message: 'Document supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur deleteFile :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la suppression.' });
  }
}

module.exports = { uploadFile, getDocuments, deleteFile };

