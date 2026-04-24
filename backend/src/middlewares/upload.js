const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : PDF, TXT, CSV, XLSX.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
