const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  favoritePlayers: [{
    playerId: String,
    playerName: String,
    position: String,
    team: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pushToken: String,
  preferences: {
    favorite_team: String,
    favorite_players: [String],
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
  profile: {
    experience_level: { type: String, default: 'beginner' },
    fantasy_platforms: [String],
    bankroll_size: { type: String, default: 'medium' }
  },
  subscriptions: {
    premium: { type: Boolean, default: false },
    email_notifications: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
