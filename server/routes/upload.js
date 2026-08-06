const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Ensure upload directories exist
const imgDir = path.join(__dirname, '../uploads/images');
const audioDir = path.join(__dirname, '../uploads/audio');

if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// ─── Configure Multer Storage ───────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, imgDir);
    } else if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else {
      cb(new Error('Geçersiz dosya alanı'), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique name: field-timestamp-random.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ─── File Filters ───────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca görsel dosyaları (.png, .jpg, .jpeg, .webp) yüklenebilir!'), false);
    }
  } else if (file.fieldname === 'audio') {
    const allowedTypes = /mpeg|mp3|wav|ogg|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.originalname.endsWith('.mp3');

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca ses dosyaları (.mp3, .wav, .ogg) yüklenebilir!'), false);
    }
  } else {
    cb(new Error('Bilinmeyen dosya alanı'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Max 10MB
  }
});

// ─── POST /api/upload/image ──────────────────────────────────
// Upload an image (Protected)
router.post('/image', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen yüklenecek bir görsel seçin' });
    }
    
    // Return relative URL for client consumption
    const fileUrl = `/uploads/images/${req.file.filename}`;
    res.json({
      message: 'Görsel başarıyla yüklenebilir',
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Görsel yüklenirken bir hata oluştu' });
  }
});

// ─── POST /api/upload/audio ──────────────────────────────────
// Upload an audio file (Protected)
router.post('/audio', protect, upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen yüklenecek bir ses dosyası seçin' });
    }

    const fileUrl = `/uploads/audio/${req.file.filename}`;
    res.json({
      message: 'Ses dosyası başarıyla yüklendi',
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ses dosyası yüklenirken bir hata oluştu' });
  }
});

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Dosya boyutu çok büyük! Maksimum limit 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
