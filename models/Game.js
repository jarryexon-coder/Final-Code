const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  externalId: {
    type: String,
    unique: true
  },
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer'],
    required: true
  },
  
  // Teams
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  homeTeamName: String,
  awayTeamName: String,
  homeTeamAbbreviation: String,
  awayTeamAbbreviation: String,
  
  // Game details
  date: {
    type: Date,
    required: true
  },
  time: String,
  venue: String,
  city: String,
  state: String,
  attendance: Number,
  duration: String,
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'final', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  period: Number,
  clock: String,
  
  // Scores
  homeScore: {
    type: Number,
    default: 0
  },
  awayScore: {
    type: Number,
    default: 0
  },
  
  // Quarter/Period scores
  periodScores: {
    home: [Number],
    away: [Number]
  },
  
  // Odds and betting
  odds: {
    moneyline: {
      home: Number,
      away: Number
    },
    spread: {
      home: Number,
      away: Number,
      line: Number
    },
    total: {
      points: Number,
      over: Number,
      under: Number
    },
    lastUpdate: Date,
    source: String
  },
  
  // Predictions
  predictions: {
    homeWinPercentage: Number,
    predictedScore: {
      home: Number,
      away: Number
    },
    confidence: Number,
    lastUpdate: Date
  },
  
  // Fantasy relevance
  fantasyProjections: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    projectedPoints: Number,
    value: String, // 'start', 'sit', 'sleeper', 'bust'
    confidence: Number,
    notes: String
  }],
  
  // Live game data
  liveData: {
    lastPlay: String,
    possession: String,
    shotClock: Number,
    timeouts: {
      home: Number,
      away: Number
    },
    fouls: {
      home: Number,
      away: Number
    }
  },
  
  // Statistics
  stats: {
    fieldGoals: {
      home: { made: Number, attempted: Number, percentage: Number },
      away: { made: Number, attempted: Number, percentage: Number }
    },
    threePointers: {
      home: { made: Number, attempted: Number, percentage: Number },
      away: { made: Number, attempted: Number, percentage: Number }
    },
    freeThrows: {
      home: { made: Number, attempted: Number, percentage: Number },
      away: { made: Number, attempted: Number, percentage: Number }
    },
    rebounds: {
      home: { total: Number, offensive: Number, defensive: Number },
      away: { total: Number, offensive: Number, defensive: Number }
    },
    assists: {
      home: Number,
      away: Number
    },
    turnovers: {
      home: Number,
      away: Number
    },
    steals: {
      home: Number,
      away: Number
    },
    blocks: {
      home: Number,
      away: Number
    },
    fastBreakPoints: {
      home: Number,
      away: Number
    },
    pointsInPaint: {
      home: Number,
      away: Number
    }
  },
  
  // Player stats (reference to PlayerGameStats)
  playerStats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlayerGameStats'
  }],
  
  // Media
  broadcast: {
    national: [String],
    home: String,
    away: String,
    radio: String
  },
  
  // Metadata
  season: String,
  seasonType: {
    type: String,
    enum: ['preseason', 'regular', 'playoffs', 'allstar'],
    default: 'regular'
  },
  week: Number,
  day: String,
  
  // Historical
  completedAt: Date,
  recap: String,
  highlights: [String],
  
  // Social
  twitterHashtag: String,
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  predictionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
gameSchema.index({ date: -1 });
gameSchema.index({ sport: 1, date: -1 });
gameSchema.index({ homeTeam: 1, awayTeam: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'odds.moneyline.home': 1 });
gameSchema.index({ 'predictions.homeWinPercentage': -1 });

// Virtual for game result
gameSchema.virtual('result').get(function() {
  if (this.status !== 'final') return null;
  if (this.homeScore > this.awayScore) return 'home';
  if (this.awayScore > this.homeScore) return 'away';
  return 'tie';
});

// Virtual for total points
gameSchema.virtual('totalPoints').get(function() {
  return this.homeScore + this.awayScore;
});

// Virtual for spread result
gameSchema.virtual('spreadResult').get(function() {
  if (!this.odds?.spread?.line || this.status !== 'final') return null;
  const spread = this.odds.spread.line;
  const homeScoreWithSpread = this.homeScore + spread;
  
  if (homeScoreWithSpread > this.awayScore) return 'home';
  if (homeScoreWithSpread < this.awayScore) return 'away';
  return 'push';
});

// Virtual for over/under result
gameSchema.virtual('totalResult').get(function() {
  if (!this.odds?.total?.points || this.status !== 'final') return null;
  const totalPoints = this.homeScore + this.awayScore;
  const totalLine = this.odds.total.points;
  
  if (totalPoints > totalLine) return 'over';
  if (totalPoints < totalLine) return 'under';
  return 'push';
});

// Method to check if game is live
gameSchema.methods.isLive = function() {
  return this.status === 'in_progress';
};

// Method to get time remaining
gameSchema.methods.getTimeRemaining = function() {
  if (!this.isLive()) return null;
  return `${this.period}Q ${this.clock}`;
};

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
