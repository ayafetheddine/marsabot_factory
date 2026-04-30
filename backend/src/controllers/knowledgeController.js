const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { findByBotAndName, createDocument, getDocumentsByBot, getDocumentById, deleteDocument } = require('../models/documentModel');
const { addApiSource, getApiSourcesByBot, deleteApiSource } = require('../models/apiSourceModel');
const vectorService = require('../services/vectorService');

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

    // Extraction du texte (uniquement pour les PDF)
    let content = '';
    if (req.file.mimetype === 'application/pdf') {
      console.log('📄 Début de l\'extraction PDF...');
      try {
        const buffer = fs.readFileSync(req.file.path);
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        content = result.text.replace(/\n+/g, ' ').trim();
        console.log(`✅ Texte extrait et sauvegardé (${content.length} caractères).`);
      } catch (pdfErr) {
        // PDF scanné ou illisible — on continue sans crasher
        console.warn(`⚠️ Impossible d'extraire le texte du PDF (${req.file.originalname}) :`, pdfErr.message);
        content = '';
      }
    }

    // Enregistrement en base
    const document = await createDocument({
      botId,
      nomOriginal: req.file.originalname,
      nomFichierGenere: req.file.filename,
      chemin: req.file.path,
      taille: req.file.size,
      content,
    });

    // Vectorisation RAG (asynchrone, ne bloque pas la réponse HTTP)
    if (content.trim().length > 0) {
      vectorService.processAndStoreDocument(document.id, content).catch((vecErr) => {
        console.warn(`⚠️  Vectorisation échouée pour le document ${document.id} :`, vecErr.message);
      });
    }

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

async function addApi(req, res) {
  try {
    const { botId } = req.params;
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: "L'URL est requise." });
    }
    const source = await addApiSource(botId, url.trim());
    return res.status(201).json({ success: true, data: source });
  } catch (error) {
    console.error('Erreur addApi :', error.message);
    return res.status(500).json({ success: false, message: "Erreur lors de l'ajout de la source API." });
  }
}

async function getApis(req, res) {
  try {
    const { botId } = req.params;
    const sources = await getApiSourcesByBot(botId);
    return res.json({ success: true, data: sources });
  } catch (error) {
    console.error('Erreur getApis :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des sources API.' });
  }
}

async function deleteApi(req, res) {
  try {
    const { sourceId } = req.params;
    await deleteApiSource(sourceId);
    return res.json({ success: true, message: 'Source API supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur deleteApi :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de la suppression.' });
  }
}

module.exports = { uploadFile, getDocuments, deleteFile, addApi, getApis, deleteApi };

