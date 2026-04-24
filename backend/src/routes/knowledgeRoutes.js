const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadFile, getDocuments, deleteFile } = require('../controllers/knowledgeController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/knowledge/upload
router.post('/upload', upload.single('file'), uploadFile);

// GET /api/knowledge/:botId/documents
router.get('/:botId/documents', getDocuments);

// DELETE /api/knowledge/:botId/documents/:docId
router.delete('/:botId/documents/:docId', authMiddleware, deleteFile);

module.exports = router;
