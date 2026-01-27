import mongoose from 'mongoose';

const LineupPlayerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  name: String,
  position: String,
  team: String,
  salary: Number,
  projection: Number,
  actualScore: Number,
  ownership: Number,
  valueRatio: Number,
  isCaptain: {
    type: Boolean,
    default: false
  },
  multiplier: {
    type: Number,
    default: 1
  }
});

const FantasyLineupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB'],
    required: true
  },
  platform: {
    type: String,
    enum: ['FanDuel', 'DraftKings', 'Yahoo', 'ESPN', 'PrizePicks', 'Underdog'],
    required: true
  },
  contestType: {
    type: String,
    enum: ['cash', 'tournament', 'head2head', '50-50', 'double-up', 'multi-entry']
  },
  players: [LineupPlayerSchema],
  totalSalary: Number,
  salaryRemaining: Number,
  totalProjection: Number,
  optimalityScore: Number,
  exposure: {
    total: Number,
    byPosition: mongoose.Schema.Types.Mixed,
    byTeam: mongoose.Schema.Types.Mixed
  },
  constraints: {
    maxPlayersPerTeam: {
      type: Number,
      default: 4
    },
    requiredPositions: [String],
    stackRequired: Boolean
  },
  aiAnalysis: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    riskLevel: String,
    projectedRank: Number,
    uniquenessScore: Number
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

// Pre-save hook to calculate totals
FantasyLineupSchema.pre('save', function(next) {
  this.totalSalary = this.players.reduce((sum, player) => sum + (player.salary || 0), 0);
  
  if (this.platform === 'FanDuel') {
    this.salaryRemaining = 60000 - this.totalSalary;
  } else if (this.platform === 'DraftKings') {
    this.salaryRemaining = 50000 - this.totalSalary;
  }
  
  this.totalProjection = this.players.reduce((sum, player) => sum + (player.projection || 0), 0);
  
  // Calculate optimality score
  const valueScores = this.players.map(p => p.valueRatio || 0);
  this.optimalityScore = valueScores.length > 0 
    ? (valueScores.reduce((a, b) => a + b, 0) / valueScores.length).toFixed(2)
    : 0;
  
  this.updatedAt = new Date();
  next();
});

const FantasyLineup = mongoose.model('FantasyLineup', FantasyLineupSchema);
export default FantasyLineup;
