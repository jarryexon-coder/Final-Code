import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema({
  // ====================
  // CORE IDENTIFICATION
  // ====================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  userEmail: {
    type: String,
    index: true
  },
  
  userName: {
    type: String
  },
  
  // ====================
  // SPORTS & GAME DATA
  // ====================
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer', 'Tennis', 'Golf', 'MMA', 'Boxing', 'CBB', 'CFB', 'Mixed'],
    index: true
  },
  
  league: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'UEFA', 'Other']
  },
  
  gameId: {
    type: String,
    index: true
  },
  
  gameDate: {
    type: Date,
    index: true
  },
  
  homeTeam: {
    name: String,
    abbreviation: String,
    id: String
  },
  
  awayTeam: {
    name: String,
    abbreviation: String,
    id: String
  },
  
  venue: String,
  
  // ====================
  // PREDICTION DETAILS
  // ====================
  prediction: {
    type: String,
    required: true,
    trim: true
  },
  
  predictionType: {
    type: String,
    enum: [
      'moneyline', 
      'spread', 
      'total', 
      'player_prop', 
      'team_prop', 
      'game_prop',
      'parlay',
      'teaser',
      'futures',
      'live_bet',
      'custom'
    ],
    required: true,
    index: true
  },
  
  predictionSubtype: {
    type: String,
    enum: [
      'home_win', 'away_win', 'draw',
      'over', 'under',
      'player_points', 'player_rebounds', 'player_assists', 'player_3pt',
      'first_quarter', 'first_half', 'second_half',
      'exact_score', 'margin_of_victory',
      'mvp', 'champion', 'award'
    ]
  },
  
  selection: {
    type: String,
    required: true
  },
  
  // For spreads and totals
  line: {
    value: Number,
    odds: Number
  },
  
  // For player props
  playerName: String,
  playerId: String,
  statType: String,
  statValue: Number,
  
  // ====================
  // CONFIDENCE & ANALYSIS
  // ====================
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
    index: true
  },
  
  edgeScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  analysis: {
    modelVersion: String,
    features: [String],
    reasoning: String,
    keyFactors: [String],
    modelConfidence: Number,
    humanOverride: Boolean
  },
  
  // ====================
  // ODDS & BETTING INFO
  // ====================
  odds: {
    bookmaker: {
      type: String,
      enum: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'Barstool', 'Other']
    },
    decimal: Number,
    american: Number,
    impliedProbability: Number,
    openingOdds: Number,
    currentOdds: Number,
    bestAvailable: Number,
    movement: {
      type: String,
      enum: ['up', 'down', 'stable']
    }
  },
  
  stake: {
    amount: Number,
    unitSize: Number,
    units: Number
  },
  
  // ====================
  // OUTCOME & RESULTS
  // ====================
  outcome: {
    type: String,
    enum: ['win', 'loss', 'push', 'void', 'pending', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  result: {
    actual: mongoose.Schema.Types.Mixed,
    vsLine: Number,
    margin: Number,
    settledAt: Date,
    settledBy: String
  },
  
  payout: {
    amount: Number,
    profit: Number,
    roi: Number,
    paidOut: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  },
  
  // ====================
  // PERFORMANCE METRICS
  // ====================
  metrics: {
    expectedValue: Number,
    kellyCriterion: Number,
    sharpeRatio: Number,
    riskAdjustedReturn: Number,
    winProbability: Number,
    closingLineValue: Number
  },
  
  // ====================
  // TRACKING & CATEGORIZATION
  // ====================
  tags: [{
    type: String,
    enum: [
      'premium', 'featured', 'lock', 'value', 'fade',
      'public', 'sharp', 'contrarian', 'trending',
      'injury_related', 'weather_affected', 'revenge_game',
      'b2b', 'rest', 'motivation', 'system_play'
    ]
  }],
  
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'pro']
  },
  
  source: {
    type: String,
    enum: ['ai_model', 'expert', 'crowd', 'statistical', 'manual', 'composite']
  },
  
  strategy: {
    type: String,
    enum: ['momentum', 'contrarian', 'arbitrage', 'middling', 'hedging']
  },
  
  // ====================
  // SOCIAL & COMMUNITY
  // ====================
  visibility: {
    type: String,
    enum: ['private', 'followers', 'public', 'premium_only'],
    default: 'private'
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  comments: {
    type: Number,
    default: 0
  },
  
  shares: {
    type: Number,
    default: 0
  },
  
  followers: [{
    userId: mongoose.Schema.Types.ObjectId,
    followedAt: Date
  }],
  
  // ====================
  // TIMING & STATUS
  // ====================
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  gameTime: Date,
  
  predictionTime: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['active', 'settled', 'expired', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  
  expiration: Date,
  
  // ====================
  // AUDIT & VERSIONING
  // ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  // ====================
  // SOFT DELETE
  // ====================
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: Date,
  
  // ====================
  // ANALYTICS & TRACKING
  // ====================
  views: {
    type: Number,
    default: 0
  },
  
  impressions: {
    type: Number,
    default: 0
  },
  
  clickThroughRate: Number,
  
  conversionRate: Number,
  
  // ====================
  // RELATED DATA
  // ====================
  relatedPredictions: [{
    predictionId: mongoose.Schema.Types.ObjectId,
    relationship: {
      type: String,
      enum: ['parlay_component', 'hedge', 'correlated', 'similar']
    }
  }],
  
  notes: String,
  
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  
  // Indexes for common queries
  indexes: [
    { userId: 1, outcome: 1, timestamp: -1 },
    { sport: 1, gameDate: 1, predictionType: 1 },
    { confidence: -1, timestamp: -1 },
    { 'odds.bookmaker': 1, sport: 1 },
    { userId: 1, sport: 1, outcome: 1 },
    { tags: 1, timestamp: -1 }
  ],
  
  // Enable virtuals
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ====================
// VIRTUAL PROPERTIES
// ====================
PredictionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.expiration || this.expiration > new Date());
});

PredictionSchema.virtual('isSettled').get(function() {
  return this.outcome !== 'pending' && this.outcome !== 'cancelled';
});

PredictionSchema.virtual('isWinning').get(function() {
  return this.outcome === 'win';
});

PredictionSchema.virtual('isLosing').get(function() {
  return this.outcome === 'loss';
});

PredictionSchema.virtual('profitLoss').get(function() {
  if (!this.payout || !this.stake) return 0;
  return this.payout.profit || 0;
});

PredictionSchema.virtual('formattedOdds').get(function() {
  if (this.odds?.american) {
    return this.odds.american > 0 ? `+${this.odds.american}` : this.odds.american.toString();
  }
  return null;
});

PredictionSchema.virtual('confidenceLevel').get(function() {
  if (this.confidence >= 80) return 'Very High';
  if (this.confidence >= 70) return 'High';
  if (this.confidence >= 60) return 'Medium';
  if (this.confidence >= 50) return 'Low';
  return 'Very Low';
});

PredictionSchema.virtual('predictionSummary').get(function() {
  const parts = [];
  if (this.sport) parts.push(this.sport);
  if (this.predictionType) parts.push(this.predictionType.replace('_', ' '));
  if (this.selection) parts.push(this.selection);
  return parts.join(' - ');
});

// ====================
// PRE-SAVE MIDDLEWARE
// ====================
PredictionSchema.pre('save', function(next) {
  // Auto-calculate implied probability from odds
  if (this.odds?.american && !this.odds.impliedProbability) {
    const odds = this.odds.american;
    if (odds > 0) {
      this.odds.impliedProbability = 100 / (odds + 100);
    } else {
      this.odds.impliedProbability = Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }
  
  // Set expiration if not set (default 7 days after game)
  if (!this.expiration && this.gameDate) {
    this.expiration = new Date(this.gameDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // Auto-calculate ROI if we have stake and payout
  if (this.stake?.amount && this.payout?.profit) {
    this.payout.roi = (this.payout.profit / this.stake.amount) * 100;
  }
  
  // Update status based on outcome
  if (this.outcome === 'pending' && this.expiration && this.expiration < new Date()) {
    this.status = 'expired';
  } else if (this.outcome !== 'pending' && this.outcome !== 'cancelled') {
    this.status = 'settled';
  }
  
  next();
});

// ====================
// STATIC METHODS
// ====================
PredictionSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 50, skip = 0, sport, outcome, predictionType } = options;
  
  const query = { userId, isDeleted: false };
  if (sport) query.sport = sport;
  if (outcome) query.outcome = outcome;
  if (predictionType) query.predictionType = predictionType;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'email name avatar')
    .lean();
};

PredictionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalPredictions: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
        pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] } },
        totalStake: { $sum: '$stake.amount' },
        totalPayout: { $sum: '$payout.amount' },
        totalProfit: { $sum: '$payout.profit' },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    {
      $project: {
        totalPredictions: 1,
        wins: 1,
        losses: 1,
        pushes: 1,
        pending: 1,
        winRate: { $cond: [
          { $gt: ['$totalPredictions', 0] },
          { $multiply: [{ $divide: ['$wins', { $subtract: ['$totalPredictions', '$pending'] }] }, 100] },
          0
        ]},
        totalStake: 1,
        totalPayout: 1,
        totalProfit: 1,
        roi: { $cond: [
          { $gt: ['$totalStake', 0] },
          { $multiply: [{ $divide: ['$totalProfit', '$totalStake'] }, 100] },
          0
        ]},
        avgConfidence: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalPredictions: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
    winRate: 0,
    totalStake: 0,
    totalPayout: 0,
    totalProfit: 0,
    roi: 0,
    avgConfidence: 0
  };
};

PredictionSchema.statics.getTrendingPredictions = async function(limit = 20) {
  return this.aggregate([
    { $match: { isDeleted: false, visibility: { $ne: 'private' }, status: 'active' } },
    {
      $addFields: {
        popularityScore: {
          $add: [
            { $multiply: ['$likes', 2] },
            { $multiply: ['$comments', 1.5] },
            { $multiply: ['$shares', 3] },
            { $multiply: ['$views', 0.1] }
          ]
        }
      }
    },
    { $sort: { popularityScore: -1, confidence: -1 } },
    { $limit: limit }
  ]);
};

// ====================
// INSTANCE METHODS
// ====================
PredictionSchema.methods.settlePrediction = function(result, outcome, payout = null) {
  this.outcome = outcome;
  this.result = { ...this.result, ...result, settledAt: new Date() };
  
  if (payout) {
    this.payout = { ...this.payout, ...payout };
  }
  
  this.status = 'settled';
  return this.save();
};

PredictionSchema.methods.addLike = function(userId) {
  // In a real implementation, you'd want to track who liked it
  this.likes += 1;
  return this.save();
};

PredictionSchema.methods.share = function() {
  this.shares += 1;
  return this.save();
};

PredictionSchema.methods.updateMetrics = function(metrics) {
  this.metrics = { ...this.metrics, ...metrics };
  return this.save();
};

PredictionSchema.methods.getPerformanceInsights = function() {
  const insights = [];
  
  if (this.confidence >= 80 && this.outcome === 'loss') {
    insights.push('High confidence prediction that missed');
  }
  
  if (this.edgeScore > 60 && this.outcome === 'win') {
    insights.push('High edge score accurately predicted win');
  }
  
  if (this.payout?.roi > 100) {
    insights.push('Exceptional ROI achieved');
  }
  
  return insights;
};

// ====================
// QUERY HELPERS
// ====================
PredictionSchema.query.active = function() {
  return this.where({ status: 'active', isDeleted: false });
};

PredictionSchema.query.settled = function() {
  return this.where({ status: 'settled' });
};

PredictionSchema.query.bySport = function(sport) {
  return this.where({ sport });
};

PredictionSchema.query.byOutcome = function(outcome) {
  return this.where({ outcome });
};

PredictionSchema.query.highConfidence = function(minConfidence = 70) {
  return this.where({ confidence: { $gte: minConfidence } });
};

PredictionSchema.query.recent = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where({ timestamp: { $gte: date } });
};

// ====================
// COMPOUND INDEXES
// ====================
PredictionSchema.index({ userId: 1, sport: 1, timestamp: -1 });
PredictionSchema.index({ sport: 1, gameDate: 1, predictionType: 1 });
PredictionSchema.index({ confidence: -1, edgeScore: -1 });
PredictionSchema.index({ tags: 1, timestamp: -1 });
PredictionSchema.index({ status: 1, expiration: 1 });

const Prediction = mongoose.model('Prediction', PredictionSchema);

export default Prediction;
