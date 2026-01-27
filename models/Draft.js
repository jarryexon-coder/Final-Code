import mongoose from 'mongoose';

const DraftPickSchema = new mongoose.Schema({
  // Player Information
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  
  playerName: {
    type: String,
    required: true
  },
  
  playerTeam: String,
  
  playerPosition: {
    type: String,
    required: true,
    enum: ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL']
  },
  
  // Draft Details
  round: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  
  pickNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  overallPick: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Value & Pricing
  salary: {
    type: Number,
    min: 0,
    required: true
  },
  
  projectedSalary: {
    type: Number,
    min: 0
  },
  
  salaryCapPercentage: Number,
  
  averageDraftPosition: {
    type: Number,
    min: 1
  },
  
  expertConsensusRank: Number,
  
  // Performance Metrics
  valueScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  tier: {
    type: Number,
    min: 1,
    max: 10
  },
  
  projectedPoints: Number,
  
  floor: Number,
  
  ceiling: Number,
  
  volatility: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Analytics
  expectedValue: Number,
  
  surplusValue: Number,
  
  positionalScarcity: {
    type: Number,
    min: 0,
    max: 100
  },
  
  byeWeek: Number,
  
  injuryRisk: {
    type: String,
    enum: ['low', 'medium', 'high', 'out']
  },
  
  // Draft Strategy
  reachScore: {
    type: Number,
    min: -50,
    max: 50
  },
  
  isReach: Boolean,
  
  isSteal: Boolean,
  
  recommendedPickRange: {
    min: Number,
    max: Number
  },
  
  // Context
  platform: {
    type: String,
    enum: ['FanDuel', 'DraftKings', 'Yahoo', 'ESPN', 'Underdog', 'Sleeper', 'Fantrax']
  },
  
  scoringFormat: {
    type: String,
    enum: ['standard', 'ppr', 'half-ppr', 'points', 'category', 'roto']
  },
  
  // Reasoning & Analysis
  reasoning: {
    type: String,
    maxlength: 500
  },
  
  keyFactors: [String],
  
  concerns: [String],
  
  comparablePlayers: [{
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    valueDifference: Number
  }],
  
  // Timing
  pickTime: {
    type: Date,
    default: Date.now
  },
  
  decisionTime: Number, // Time taken to make this pick in seconds
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
});

const DraftRecommendationSchema = new mongoose.Schema({
  // Draft Configuration
  type: {
    type: String,
    enum: ['snake', 'turn', 'bestball', 'dynasty', 'auction', 'salary_cap', 'mock', 'live'],
    required: true,
    index: true
  },
  
  draftId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  draftName: String,
  
  draftPosition: {
    type: Number,
    required: true,
    min: 1
  },
  
  totalTeams: {
    type: Number,
    default: 10,
    min: 2,
    max: 20
  },
  
  totalRounds: {
    type: Number,
    default: 15,
    min: 1,
    max: 30
  },
  
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer', 'Mixed'],
    required: true,
    index: true
  },
  
  season: String,
  
  leagueName: String,
  
  // Platform & Settings
  platform: {
    type: String,
    enum: ['FanDuel', 'DraftKings', 'Yahoo', 'ESPN', 'Underdog', 'Sleeper', 'Fantrax', 'Custom'],
    required: true,
    index: true
  },
  
  platformId: String,
  
  scoringFormat: {
    type: String,
    enum: ['standard', 'ppr', 'half-ppr', 'points', 'category', 'roto', 'custom'],
    default: 'standard'
  },
  
  rosterSettings: {
    positions: {
      QB: { type: Number, default: 1 },
      RB: { type: Number, default: 2 },
      WR: { type: Number, default: 2 },
      TE: { type: Number, default: 1 },
      FLEX: { type: Number, default: 1 },
      DEF: { type: Number, default: 1 },
      K: { type: Number, default: 1 },
      BENCH: { type: Number, default: 6 }
    },
    totalSpots: Number,
    salaryCap: Number
  },
  
  // Draft Picks
  picks: [DraftPickSchema],
  
  queue: [{
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    priority: Number,
    targetRound: Number
  }],
  
  // Strategy & Approach
  strategy: {
    type: String,
    enum: [
      'balanced', 'zeroRB', 'heroRB', 'robustRB', 'lateQB', 'earlyTE',
      'zeroWR', 'modified_zeroRB', 'anchorRB', 'hyperfragile',
      'stars_and_scrubs', 'consistent', 'high_ceiling', 'safe_floor'
    ],
    default: 'balanced'
  },
  
  customStrategy: String,
  
  draftPlan: {
    type: String,
    enum: ['prepared', 'adaptive', 'reactive', 'aggressive', 'conservative'],
    default: 'adaptive'
  },
  
  positionPriorities: {
    type: Map,
    of: Number
  },
  
  // Performance Metrics
  totalValue: {
    type: Number,
    default: 0
  },
  
  averagePickScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  teamStrength: {
    overall: Number,
    starters: Number,
    bench: Number,
    byPosition: {
      type: Map,
      of: Number
    }
  },
  
  riskLevel: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  
  consistencyScore: Number,
  
  upsideScore: Number,
  
  projectedRank: Number,
  
  winProbability: Number,
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  userName: String,
  
  userEmail: String,
  
  // Draft State
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'abandoned', 'archived'],
    default: 'upcoming',
    index: true
  },
  
  currentRound: {
    type: Number,
    default: 1
  },
  
  currentPick: {
    type: Number,
    default: 1
  },
  
  timePerPick: Number, // In seconds
  
  draftStartedAt: Date,
  
  draftEndedAt: Date,
  
  draftDuration: Number, // In seconds
  
  // Recommendations
  nextBestPicks: [{
    round: Number,
    picks: [mongoose.Schema.Types.Mixed]
  }],
  
  tradeSuggestions: [{
    type: {
      type: String,
      enum: ['trade_up', 'trade_down', 'stay_put']
    },
    reasoning: String,
    expectedValue: Number
  }],
  
  // Analytics & Insights
  insights: [{
    type: String,
    enum: [
      'value_found', 'overpaid', 'positional_scarcity',
      'bye_week_conflict', 'injury_risk', 'schedule_strength',
      'stack_opportunity', 'handcuff_missing', 'breakout_candidate'
    ],
    description: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical']
    }
  }],
  
  competitorAnalysis: {
    strongestTeams: [{
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      strengthScore: Number
    }],
    weakestTeams: [{
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      weaknessScore: Number
    }]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  savedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastAccessedAt: Date,
  
  expiresAt: {
    type: Date,
    index: { expires: '7d' } // Auto-delete after 7 days for mock drafts
  },
  
  // Share & Collaboration
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public', 'template'],
    default: 'private'
  },
  
  sharedWith: [{
    userId: mongoose.Schema.Types.ObjectId,
    permission: {
      type: String,
      enum: ['view', 'comment', 'edit']
    },
    sharedAt: Date
  }],
  
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  templateName: String,
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  
  parentDraftId: mongoose.Schema.Types.ObjectId,
  
  // Performance Tracking
  simulationResults: {
    totalSimulations: { type: Number, default: 0 },
    averageFinish: Number,
    bestFinish: Number,
    worstFinish: Number,
    playoffProbability: Number,
    championshipProbability: Number
  },
  
  // Metadata
  tags: [String],
  
  notes: String,
  
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  
  // Indexes for common queries
  indexes: [
    // Composite indexes
    { userId: 1, status: 1, createdAt: -1 },
    { sport: 1, platform: 1, type: 1 },
    { totalValue: -1, createdAt: -1 },
    { 'picks.playerPosition': 1, round: 1 },
    
    // Text search
    { draftName: 'text', leagueName: 'text' }
  ],
  
  // Enable virtuals
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ====================
// VIRTUAL PROPERTIES
// ====================
DraftRecommendationSchema.virtual('isActive').get(function() {
  return this.status === 'in_progress';
});

DraftRecommendationSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

DraftRecommendationSchema.virtual('remainingRounds').get(function() {
  return this.totalRounds - this.currentRound + 1;
});

DraftRecommendationSchema.virtual('remainingPicks').get(function() {
  const totalPicks = this.totalRounds * this.totalTeams;
  const picksMade = (this.currentRound - 1) * this.totalTeams + this.currentPick - 1;
  return totalPicks - picksMade;
});

DraftRecommendationSchema.virtual('draftProgress').get(function() {
  const totalPicks = this.totalRounds * this.totalTeams;
  const picksMade = (this.currentRound - 1) * this.totalTeams + this.currentPick - 1;
  return totalPicks > 0 ? Math.round((picksMade / totalPicks) * 100) : 0;
});

DraftRecommendationSchema.virtual('estimatedTimeRemaining').get(function() {
  if (!this.timePerPick) return null;
  return this.remainingPicks * this.timePerPick;
});

DraftRecommendationSchema.virtual('rosterSpotsFilled').get(function() {
  const rosterConfig = this.rosterSettings?.positions || {};
  const filledSpots = {};
  const totals = {};
  
  this.picks.forEach(pick => {
    const pos = pick.playerPosition;
    filledSpots[pos] = (filledSpots[pos] || 0) + 1;
  });
  
  // Calculate totals from roster settings
  Object.entries(rosterConfig).forEach(([pos, count]) => {
    totals[pos] = count;
  });
  
  return { filled: filledSpots, totals };
});

DraftRecommendationSchema.virtual('salaryRemaining').get(function() {
  const salaryCap = this.rosterSettings?.salaryCap;
  if (!salaryCap) return null;
  
  const spent = this.picks.reduce((total, pick) => total + (pick.salary || 0), 0);
  return salaryCap - spent;
});

// ====================
// PRE-SAVE MIDDLEWARE
// ====================
DraftRecommendationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-calculate total value
  if (this.picks && this.picks.length > 0) {
    this.totalValue = this.picks.reduce((sum, pick) => sum + (pick.valueScore || 0), 0);
    this.averagePickScore = this.totalValue / this.picks.length;
  }
  
  // Auto-set expiresAt for mock drafts
  if (this.type === 'mock' && !this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for mock drafts
    this.expiresAt = expiryDate;
  }
  
  // Calculate draft duration
  if (this.draftStartedAt && this.draftEndedAt) {
    this.draftDuration = (this.draftEndedAt - this.draftStartedAt) / 1000;
  }
  
  next();
});

// ====================
// STATIC METHODS
// ====================
DraftRecommendationSchema.statics.findByUser = function(userId, options = {}) {
  const { status, sport, limit = 50, skip = 0 } = options;
  
  const query = { userId, isTemplate: false };
  if (status) query.status = status;
  if (sport) query.sport = sport;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .populate('picks.playerId', 'name team position stats')
    .lean();
};

DraftRecommendationSchema.statics.getUserDraftStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isTemplate: false } },
    {
      $group: {
        _id: null,
        totalDrafts: { $sum: 1 },
        completedDrafts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        inProgressDrafts: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        avgTotalValue: { $avg: '$totalValue' },
        avgPickScore: { $avg: '$averagePickScore' },
        totalPicksMade: { $sum: { $size: '$picks' } }
      }
    },
    {
      $project: {
        totalDrafts: 1,
        completedDrafts: 1,
        inProgressDrafts: 1,
        avgTotalValue: { $round: ['$avgTotalValue', 2] },
        avgPickScore: { $round: ['$avgPickScore', 2] },
        totalPicksMade: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalDrafts', 0] },
            { $multiply: [{ $divide: ['$completedDrafts', '$totalDrafts'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDrafts: 0,
    completedDrafts: 0,
    inProgressDrafts: 0,
    avgTotalValue: 0,
    avgPickScore: 0,
    totalPicksMade: 0,
    completionRate: 0
  };
};

DraftRecommendationSchema.statics.getPopularStrategies = async function(sport, limit = 10) {
  return this.aggregate([
    { $match: { sport, status: 'completed', isTemplate: false } },
    { $group: { _id: '$strategy', count: { $sum: 1 }, avgTotalValue: { $avg: '$totalValue' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// ====================
// INSTANCE METHODS
// ====================
DraftRecommendationSchema.methods.addPick = function(pickData) {
  this.picks.push(pickData);
  this.currentPick++;
  
  // Move to next round if needed
  if (this.currentPick > this.totalTeams) {
    this.currentRound++;
    this.currentPick = 1;
  }
  
  return this.save();
};

DraftRecommendationSchema.methods.removeLastPick = function() {
  if (this.picks.length > 0) {
    this.picks.pop();
    
    // Adjust current pick/round
    this.currentPick--;
    if (this.currentPick < 1) {
      this.currentRound--;
      this.currentPick = this.totalTeams;
    }
    
    return this.save();
  }
  return Promise.resolve(this);
};

DraftRecommendationSchema.methods.startDraft = function() {
  this.status = 'in_progress';
  this.draftStartedAt = new Date();
  return this.save();
};

DraftRecommendationSchema.methods.completeDraft = function() {
  this.status = 'completed';
  this.draftEndedAt = new Date();
  return this.save();
};

DraftRecommendationSchema.methods.getRosterSummary = function() {
  const roster = {};
  
  this.picks.forEach(pick => {
    const pos = pick.playerPosition;
    if (!roster[pos]) roster[pos] = [];
    roster[pos].push({
      name: pick.playerName,
      team: pick.playerTeam,
      valueScore: pick.valueScore,
      salary: pick.salary
    });
  });
  
  return roster;
};

DraftRecommendationSchema.methods.getPositionalNeeds = function() {
  const rosterConfig = this.rosterSettings?.positions || {};
  const currentRoster = {};
  
  // Count current picks by position
  this.picks.forEach(pick => {
    const pos = pick.playerPosition;
    currentRoster[pos] = (currentRoster[pos] || 0) + 1;
  });
  
  // Calculate needs
  const needs = {};
  Object.entries(rosterConfig).forEach(([position, required]) => {
    const current = currentRoster[position] || 0;
    const needed = Math.max(0, required - current);
    if (needed > 0) {
      needs[position] = { required, current, needed, priority: needed * 10 };
    }
  });
  
  return needs;
};

DraftRecommendationSchema.methods.generateRecommendations = function(availablePlayers) {
  const needs = this.getPositionalNeeds();
  const recommendations = [];
  
  // Simple recommendation logic - prioritize positions with highest need
  Object.entries(needs).forEach(([position, data]) => {
    const positionPlayers = availablePlayers.filter(p => 
      p.position === position || (position === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position))
    );
    
    // Sort by value score and take top 3
    const topPlayers = positionPlayers
      .sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
      .slice(0, 3);
    
    topPlayers.forEach(player => {
      recommendations.push({
        position,
        playerId: player._id,
        playerName: player.name,
        valueScore: player.valueScore,
        projectedPoints: player.projectedPoints,
        reasoning: `Fills ${position} need (${data.needed} needed)`
      });
    });
  });
  
  return recommendations.slice(0, 10); // Return top 10 recommendations
};

DraftRecommendationSchema.methods.cloneAsTemplate = function(templateName) {
  const templateData = this.toObject();
  delete templateData._id;
  delete templateData.__v;
  
  templateData.isTemplate = true;
  templateData.templateName = templateName || `${this.draftName} Template`;
  templateData.parentDraftId = this._id;
  templateData.picks = []; // Clear picks for template
  templateData.status = 'upcoming';
  templateData.currentRound = 1;
  templateData.currentPick = 1;
  
  return new this.constructor(templateData);
};

// ====================
// QUERY HELPERS
// ====================
DraftRecommendationSchema.query.active = function() {
  return this.where({ status: 'in_progress' });
};

DraftRecommendationSchema.query.completed = function() {
  return this.where({ status: 'completed' });
};

DraftRecommendationSchema.query.bySport = function(sport) {
  return this.where({ sport });
};

DraftRecommendationSchema.query.byPlatform = function(platform) {
  return this.where({ platform });
};

DraftRecommendationSchema.query.byStrategy = function(strategy) {
  return this.where({ strategy });
};

DraftRecommendationSchema.query.recent = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where({ createdAt: { $gte: date } });
};

DraftRecommendationSchema.query.templates = function() {
  return this.where({ isTemplate: true });
};

// ====================
// COMPOUND INDEXES
// ====================
DraftRecommendationSchema.index({ userId: 1, sport: 1, createdAt: -1 });
DraftRecommendationSchema.index({ sport: 1, platform: 1, type: 1, createdAt: -1 });
DraftRecommendationSchema.index({ totalValue: -1, createdAt: -1 });
DraftRecommendationSchema.index({ status: 1, expiresAt: 1 });

const DraftRecommendation = mongoose.model('DraftRecommendation', DraftRecommendationSchema);

export default DraftRecommendation;
