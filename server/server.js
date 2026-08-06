require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const uploadRoutes = require('./routes/upload');
const http = require('http');
const { Server } = require('socket.io');
const { registerSocketEvents } = require('./socket/lobbyHandler');

// Connect to Database
connectDB();

// Configure Passport
configurePassport();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register Socket.io events
registerSocketEvents(io);

// ─── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/upload', uploadRoutes);

//  Static  Uploaded files (images, audio) 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//  Health / Ping 
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Arena GamersZone API is running ??',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Serve static client assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res, next) => {
    // If it's api route or uploads, bypass to let express handle 404
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ─── 404 Fallback ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//  Global Error Handler 
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start ───────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Arena GamersZone Server running on http://localhost:${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
