const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  playerId: String,
  name: String,
  position: String,
  team: String,
  salary: Number,
  points: Number,
  rebounds: Number,
  assists: Number,
  isStarting: Boolean
});

const FantasyTeamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  players: [PlayerSchema],
  totalSalary: {
    type: Number,
    default: 0
  },
  totalProjectedPoints: {
    type: Number,
    default: 0
  },
  lineup: {
    pointGuard: PlayerSchema,
    shootingGuard: PlayerSchema,
    smallForward: PlayerSchema,
    powerForward: PlayerSchema,
    center: PlayerSchema,
    bench: [PlayerSchema]
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Calculate totals before saving
FantasyTeamSchema.pre('save', function(next) {
  this.totalSalary = this.players.reduce((total, player) => total + (player.salary || 0), 0);
  this.totalProjectedPoints = this.players.reduce((total, player) => total + (player.points || 0), 0);
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('FantasyTeam', FantasyTeamSchema);
