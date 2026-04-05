const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const verify = require('../verifyToken');

const router = express.Router();

const itemsDir = path.join(__dirname, '..', 'uploads', 'items');
fs.mkdirSync(itemsDir, { recursive: true });

function safeFilename(label, originalname) {
  const raw = originalname || '';
  const m = raw.match(/(\.[a-zA-Z0-9]{1,12})$/);
  const ext = m ? m[1].toLowerCase() : '';
  return `${Date.now()}_${String(label)}${ext}`;
}

function uploadHandler(req, res) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin only' });
  }
  const label = String(req.query.label || 'file');

  const storage = multer.diskStorage({
    destination: (r, file, cb) => cb(null, itemsDir),
    filename: (r, file, cb) =>
      cb(null, safeFilename(label, file.originalname)),
  });

  const upload = multer({
    storage,
    limits: { fileSize: 800 * 1024 * 1024 },
  }).single('file');

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file' });
    }
    if (process.env.PUBLIC_UPLOAD_BASE) {
      const base = String(process.env.PUBLIC_UPLOAD_BASE).replace(/\/$/, '');
      const url = `${base}/uploads/items/${req.file.filename}`;
      return res.status(201).json({ url });
    }
    const url = `/uploads/items/${req.file.filename}`;
    return res.status(201).json({ url });
  });
}

router.post('/item', verify, uploadHandler);

module.exports = router;
