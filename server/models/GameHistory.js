const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String,
      required: true
    },
    team: {
      type: String,
      enum: ['A', 'B'],
      required: true
    }
  }],
  teamNames: {
    A: {
      type: String,
      default: 'Takım A'
    },
    B: {
      type: String,
      default: 'Takım B'
    }
  },
  result: {
    winner: {
      type: String,
      enum: ['A', 'B'],
      required: true
    },
    teamA_finalHP: {
      type: Number,
      required: true
    },
    teamB_finalHP: {
      type: Number,
      required: true
    }
  },
  expireAt: {
    type: Date,
    required: true,
    // TTL index: MongoDB will automatically delete documents after the expireAt date
    index: { expires: 0 }
  }
});

// Auto-populate expireAt to 7 days in the future if not provided
gameHistorySchema.pre('validate', function(next) {
  if (!this.expireAt) {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    this.expireAt = sevenDaysLater;
  }
  next();
});

module.exports = mongoose.model('GameHistory', gameHistorySchema);
