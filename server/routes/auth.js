const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper to generate JWT token
const generateToken = (id, rememberMe = false) => {
  const expiresIn = rememberMe 
    ? (process.env.JWT_REMEMBER_EXPIRES_IN || '30d')
    : (process.env.JWT_EXPIRES_IN || '24h');

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// ─── POST /api/auth/register ───────────────────────────────────
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Lütfen tüm alanları doldurun' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
    }

    // Check if user exists by email
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
    }

    // Check if user exists by username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      avatar: {
        type: 'preset',
        value: `avatar_0${Math.floor(Math.random() * 5) + 1}` // default random avatar
      }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ error: 'Kullanıcı kaydı başarısız oldu' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────
// Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { loginIdentifier, password, rememberMe } = req.body; // loginIdentifier is email or username

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı/e-posta ve şifre gereklidir' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { username: loginIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı, e-posta veya şifre' });
    }

    // If user registered with google and has no password hash
    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Bu hesap Google ile oluşturulmuş. Lütfen Google ile Giriş yapın.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (isMatch) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id, rememberMe)
      });
    } else {
      res.status(401).json({ error: 'Geçersiz kullanıcı adı, e-posta veya şifre' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────
// Get current user profile (Protected)
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────
// Update user profile info (Protected)
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      
      if (req.body.avatar) {
        user.avatar = {
          type: req.body.avatar.type || user.avatar.type,
          value: req.body.avatar.value || user.avatar.value
        };
      }

      // If updating password
      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır' });
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser._id) // Return a fresh token
      });
    } else {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış' });
    }
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});

// ─── Google OAuth Redirection ──────────────────────────────────
// Trigger Google Login
router.get('/google', (req, res, next) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  if (!clientID || clientID === 'your_google_client_id') {
    return res.status(400).json({ error: 'Google OAuth bu sunucuda yapılandırılmamış.' });
  }
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback Endpoint
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    try {
      // Successful authentication, create JWT token
      const token = generateToken(req.user._id, true); // Google login auto-remembers 30d
      
      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
      
      // Redirect back to Vite client success landing page with token
      res.redirect(`${clientURL}/auth-success.html?token=${token}`);
    } catch (error) {
      console.error('Google Callback Redirect Error:', error);
      res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=auth_failed');
    }
  }
);

// Unlink Google Account
router.post('/unlink-google', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ 
        error: 'Şifreniz bulunmadığı için Google hesabınızı kaldıramazsınız. Önce profilinizden şifre oluşturun.' 
      });
    }

    user.googleId = null;
    await user.save();

    res.json({ message: 'Google hesabı başarıyla kaldırıldı', user });
  } catch (error) {
    console.error('Unlink Google Error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
