require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ¦¦¦ Middleware ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ¦¦¦ Static — Uploaded files (images, audio) ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ¦¦¦ Health / Ping ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Arena GamersZone API is running ??',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ¦¦¦ 404 Fallback ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ¦¦¦ Global Error Handler ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ¦¦¦ Start ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
app.listen(PORT, () => {
  console.log(`?? Arena GamersZone Server running on http://localhost:${PORT}`);
  console.log(`?? Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
