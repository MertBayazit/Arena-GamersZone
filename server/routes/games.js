const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const GameHistory = require('../models/GameHistory');
const { protect } = require('../middleware/auth');

// ─── POST /api/games ──────────────────────────────────────────
// Create a new game (Protected)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(403).json({ error: 'Misafir modunda oyun oluşturamazsınız.' });
    }
    const { title, settings, stages } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Oyun başlığı gereklidir' });
    }

    const game = await Game.create({
      title,
      creatorId: req.user._id,
      settings: settings || {
        startingHP: 300,
        playerFormat: '2v2',
        stageOrder: []
      },
      stages: stages || {
        multipleChoice: {
          enabled: false,
          answerMode: 'buzzer',
          timeLimit: 15,
          damagePerQuestion: 10,
          questions: []
        }
      }
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Create Game Error:', error);
    res.status(500).json({ error: 'Oyun oluşturulurken hata oluştu' });
  }
});

// ─── GET /api/games/mine ──────────────────────────────────────
// Get games created by current user (Protected)
router.get('/mine', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.json([]);
    }
    const games = await Game.find({ creatorId: req.user._id }).sort({ updatedAt: -1 });
    res.json(games);
  } catch (error) {
    console.error('Get Mine Games Error:', error);
    res.status(500).json({ error: 'Oyunlarınız getirilirken hata oluştu' });
  }
});

// ─── GET /api/games/public ────────────────────────────────────
// Get all public/published games (Protected)
router.get('/public', protect, async (req, res) => {
  try {
    const games = await Game.find({ status: 'published' })
      .populate('creatorId', 'username')
      .sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error('Get Public Games Error:', error);
    res.status(500).json({ error: 'Genel kütüphane getirilirken hata oluştu' });
  }
});

// ─── GET /api/games/history ───────────────────────────────────
// Get game play history of current user (Protected)
router.get('/history', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.json([]);
    }
    const history = await GameHistory.find({
      'players.userId': req.user._id
    })
      .populate('gameId', 'title')
      .sort({ playedAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ error: 'Geçmiş getirilirken hata oluştu' });
  }
});

// ─── GET /api/games/history/:id ───────────────────────────────
// Get single game history details by ID (Protected)
router.get('/history/:id', protect, async (req, res) => {
  try {
    const history = await GameHistory.findById(req.params.id)
      .populate('gameId', 'title');

    if (!history) {
      return res.status(404).json({ error: 'Oyun geçmişi bulunamadı' });
    }

    res.json(history);
  } catch (error) {
    console.error('Get Single History Error:', error);
    res.status(500).json({ error: 'Oyun geçmişi detayı getirilirken hata oluştu' });
  }
});

// ─── GET /api/games/:id ──────────────────────────────────────
// Get single game details (Protected)
router.get('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Oyun bulunamadı' });
    }

    // If it's a draft, check if the user is the creator
    if (game.status === 'draft' && game.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Bu taslak oyunu görme yetkiniz yok' });
    }

    res.json(game);
  } catch (error) {
    console.error('Get Game Error:', error);
    res.status(500).json({ error: 'Oyun bilgisi getirilirken hata oluştu' });
  }
});

// ─── PUT /api/games/:id ───────────────────────────────────────
// Update a game (Protected)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(403).json({ error: 'Misafir modunda oyun düzenleyemezsiniz.' });
    }
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Oyun bulunamadı' });
    }

    // Verify ownership
    if (game.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Bu oyunu düzenleme yetkiniz yok' });
    }

    // Update fields
    game.title = req.body.title || game.title;
    game.status = req.body.status || game.status;
    game.settings = req.body.settings || game.settings;
    game.stages = req.body.stages || game.stages;

    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    console.error('Update Game Error:', error);
    res.status(500).json({ error: 'Oyun güncellenirken hata oluştu' });
  }
});

// ─── DELETE /api/games/:id ────────────────────────────────────
// Delete a game (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(403).json({ error: 'Misafir modunda oyun silemezsiniz.' });
    }
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Oyun bulunamadı' });
    }

    // Verify ownership
    if (game.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Bu oyunu silme yetkiniz yok' });
    }

    await game.deleteOne();
    res.json({ message: 'Oyun başarıyla silindi' });
  } catch (error) {
    console.error('Delete Game Error:', error);
    res.status(500).json({ error: 'Oyun silinirken hata oluştu' });
  }
});

// ─── POST /api/games/:id/clone ────────────────────────────────
// Clone a public game (Protected)
router.post('/:id/clone', protect, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(403).json({ error: 'Misafir modunda oyun kopyalayamazsınız.' });
    }
    const originalGame = await Game.findById(req.params.id);

    if (!originalGame) {
      return res.status(404).json({ error: 'Orijinal oyun bulunamadı' });
    }

    if (originalGame.status !== 'published') {
      return res.status(400).json({ error: 'Yalnızca yayınlanmış oyunları kütüphanenize kopyalayabilirsiniz' });
    }

    // Helper to recursively remove all _id fields from object structures
    const stripIds = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => stripIds(item));
      } else if (obj !== null && typeof obj === 'object') {
        // If it's a Mongoose ObjectId, keep it as is (should not happen inside our settings/stages, but safe fallback)
        if (obj.constructor && obj.constructor.name === 'ObjectId') {
          return obj;
        }
        const clean = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === '_id' || key === 'id') continue;
          clean[key] = stripIds(value);
        }
        return clean;
      }
      return obj;
    };

    const originalObj = originalGame.toObject();
    const cleanSettings = stripIds(originalObj.settings);
    const cleanStages = stripIds(originalObj.stages);

    // Create copy with new IDs for all subdocuments
    const clonedGame = await Game.create({
      title: `${originalGame.title} (Kopyası)`,
      creatorId: req.user._id,
      status: 'draft', // Cloned game starts as draft
      settings: cleanSettings,
      stages: cleanStages
    });

    res.status(201).json({
      message: 'Oyun kütüphanenize başarıyla kopyalandı',
      game: clonedGame
    });
  } catch (error) {
    console.error('Clone Game Error:', error);
    res.status(500).json({ error: 'Oyun kopyalanırken hata oluştu' });
  }
});

module.exports = router;
