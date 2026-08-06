const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: function() {
      // password is required only if googleId is not present
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    default: null
  },
  avatar: {
    type: {
      type: String,
      enum: ['preset', 'custom'],
      default: 'preset'
    },
    value: {
      type: String,
      default: 'avatar_01'
    }
  },
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
