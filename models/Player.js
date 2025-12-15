import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  externalId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: String,
  lastName: String,
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  teamAbbreviation: String,
  position: {
    type: String,
    enum: ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G/F', 'F/C']
  },
  jerseyNumber: Number,
  height: String,
  weight: Number,
  birthDate: Date,
  age: Number,
  college: String,
  country: String,
  experience: Number,
  
  // Current season stats
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesStarted: { type: Number, default: 0 },
    minutesPerGame: { type: Number, default: 0 },
    
    // Scoring
    pointsPerGame: { type: Number, default: 0 },
    fieldGoalPercentage: { type: Number, default: 0 },
    threePointPercentage: { type: Number, default: 0 },
    freeThrowPercentage: { type: Number, default: 0 },
    
    // Rebounds
    reboundsPerGame: { type: Number, default: 0 },
    offensiveReboundsPerGame: { type: Number, default: 0 },
    defensiveReboundsPerGame: { type: Number, default: 0 },
    
    // Assists & Turnovers
    assistsPerGame: { type: Number, default: 0 },
    turnoversPerGame: { type: Number, default: 0 },
    
    // Steals & Blocks
    stealsPerGame: { type: Number, default: 0 },
    blocksPerGame: { type: Number, default: 0 },
    
    // Fantasy
    fantasyPointsPerGame: { type: Number, default: 0 },
    playerEfficiencyRating: { type: Number, default: 0 }
  },
  
  // Advanced stats
  advancedStats: {
    usageRate: Number,
    trueShootingPercentage: Number,
    effectiveFieldGoalPercentage: Number,
    winShares: Number,
    valueOverReplacement: Number,
    plusMinus: Number
  },
  
  // Injury status
  injury: {
    status: {
      type: String,
      enum: ['healthy', 'day_to_day', 'out', 'injured_reserve'],
      default: 'healthy'
    },
    description: String,
    date: Date,
    expectedReturn: Date
  },
  
  // Fantasy relevance
  fantasyRank: Number,
  fantasyPositionRank: Number,
  fantasyValue: Number,
  ownershipPercentage: Number,
  
  // Media
  photoUrl: String,
  headshotUrl: String,
  
  // Social
  twitterHandle: String,
  instagramHandle: String,
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  source: String,
  
  // Historical stats (array for multiple seasons)
  seasons: [{
    season: String,
    team: String,
    gamesPlayed: Number,
    pointsPerGame: Number,
    reboundsPerGame: Number,
    assistsPerGame: Number,
    // ... other stats
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
playerSchema.index({ name: 'text', firstName: 'text', lastName: 'text' });
playerSchema.index({ teamAbbreviation: 1 });
playerSchema.index({ position: 1 });
playerSchema.index({ 'stats.fantasyPointsPerGame': -1 });

// Virtual for full name
playerSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for fantasy value tier
playerSchema.virtual('fantasyTier').get(function() {
  const points = this.stats?.fantasyPointsPerGame || 0;
  if (points >= 50) return 'Elite';
  if (points >= 40) return 'Star';
  if (points >= 30) return 'Starter';
  if (points >= 20) return 'Role Player';
  return 'Bench';
});

const Player = mongoose.model('Player', playerSchema);
export default Player;
