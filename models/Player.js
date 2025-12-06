const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  team: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  rebounds: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  games_played: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    default: 'api'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster searches
playerSchema.index({ name: 'text' });
playerSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Player', playerSchema);
