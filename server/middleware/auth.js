const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Handle guest authentication
      if (token && token.startsWith('guest_')) {
        const parts = token.split(':');
        const guestId = parts[0];
        const username = decodeURIComponent(parts[1] || 'Misafir');
        
        req.user = {
          _id: guestId,
          username: username,
          avatar: {
            type: 'preset',
            value: 'avatar_01'
          },
          isGuest: true
        };
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!req.user) {
        return res.status(401).json({ error: 'Yetkisiz erişim, kullanıcı bulunamadı' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      res.status(401).json({ error: 'Yetkisiz erişim, geçersiz token' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Yetkisiz erişim, token bulunamadı' });
  }
};

module.exports = { protect };
