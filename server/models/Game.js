const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  settings: {
    startingHP: {
      type: Number,
      default: 300
    },
    playerFormat: {
      type: String,
      enum: ['1v1', '2v2'],
      default: '2v2'
    },
    stageOrder: {
      type: [String],
      default: []
    }
  },
  stages: {
    multipleChoice: {
      enabled: { type: Boolean, default: false },
      answerMode: { type: String, enum: ['buzzer', 'turnBased'], default: 'buzzer' },
      timeLimit: { type: Number, default: 15 },
      damagePerQuestion: { type: Number, default: 10 },
      questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true }
      }]
    },
    imageGuess: {
      enabled: { type: Boolean, default: false },
      answerMode: { type: String, default: 'buzzer' },
      revealEffect: { type: String, enum: ['blur', 'pixel', 'puzzle'], default: 'blur' },
      steps: { type: Number, enum: [5, 10, 15], default: 5 },
      items: [{
        imageUrl: { type: String, required: true },
        answer: { type: String, required: true }
      }]
    },
    soundGuess: {
      enabled: { type: Boolean, default: false },
      answerMode: { type: String, default: 'buzzer' },
      playMode: { type: String, enum: ['gradual', 'full'], default: 'gradual' },
      damage: { type: Number, enum: [10, 20], default: 10 },
      items: [{
        audioUrl: { type: String, required: true },
        answer: { type: String, required: true }
      }]
    },
    sayismaca: {
      enabled: { type: Boolean, default: false },
      countdownTime: { type: Number, default: 30 },
      successDamage: { type: Number, default: 15 },
      failDamage: { type: Number, default: 20 },
      items: [{
        theme: { type: String, required: true },
        referenceAnswers: [{ type: String }]
      }]
    },
    wordPuzzle: {
      enabled: { type: Boolean, default: false },
      damage: { type: Number, enum: [10, 20], default: 10 },
      items: [{
        word: { type: String, required: true },
        hint: { type: String, required: true }
      }]
    },
    mapGuess: {
      enabled: { type: Boolean, default: false },
      damage: { type: Number, default: 10 },
      items: [{
        imageUrl: { type: String, required: true },
        answer: { type: String, required: true },
        hint: { type: String }
      }]
    },
    finalDuel: {
      enabled: { type: Boolean, default: false },
      damagePerQuestion: { type: Number, default: 25 },
      lastQuestionMultiplier: { type: Number, default: 2 },
      questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true }
      }]
    },
    classicQA: {
      enabled: { type: Boolean, default: false },
      answerMode: { type: String, enum: ['buzzer', 'turnBased'], default: 'buzzer' },
      damagePerQuestion: { type: Number, default: 10 },
      questions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
gameSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Game', gameSchema);
