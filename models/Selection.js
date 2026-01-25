// models/Selection.js
import mongoose from 'mongoose';

const winnerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  playerTeam: String,
  pick: {
    type: String,
    required: true
  },
  market: {
    type: String,
    required: true
  },
  line: Number,
  odds: String,
  confidence: Number,
  result: {
    type: String,
    enum: ['win', 'loss', 'push', 'pending']
  },
  actualValue: Number
});

const selectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Selection Details
  type: {
    type: String,
    enum: ['parlay', 'flex', 'power', 'custom'],
    default: 'parlay'
  },
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'SOCCER']
  },
  
  // Winners (always 3 for PrizePicks)
  winners: [winnerSchema],
  
  // Odds & Metrics
  totalOdds: String,
  confidence: Number,
  edgeScore: Number,
  bumpRisk: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'won', 'lost', 'pushed', 'cancelled', 'bumped'],
    default: 'active'
  },
  
  // Tracking
  stake: Number,
  potentialPayout: Number,
  actualPayout: Number,
  result: {
    type: String,
    enum: ['win', 'loss', 'push', 'pending']
  },
  
  // Bump Risk Monitoring
  isMonitored: {
    type: Boolean,
    default: false
  },
  lastBumpCheck: Date,
  bumpAlerts: [{
    time: Date,
    message: String,
    severity: String
  }],
  
  // Line Movement
  originalLines: [{
    playerId: mongoose.Schema.Types.ObjectId,
    originalLine: Number,
    currentLine: Number,
    movement: Number
  }],
  
  // Analytics
  analytics: {
    correlation: Number,
    variance: Number,
    expectedValue: Number,
    simulationResults: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  gameDate: Date,
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String
});

// Indexes for efficient queries
selectionSchema.index({ userId: 1, createdAt: -1 });
selectionSchema.index({ sport: 1, status: 1 });
selectionSchema.index({ createdAt: 1, status: 1 });
selectionSchema.index({ 'winners.playerId': 1 });

// Update timestamp before saving
selectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate if all winners won
selectionSchema.methods.isCompleteWin = function() {
  return this.winners.every(winner => winner.result === 'win');
};

// Calculate if selection was profitable
selectionSchema.virtual('isProfitable').get(function() {
  if (!this.actualPayout || !this.stake) return null;
  return this.actualPayout > this.stake;
});

// FIXED: Check if model already exists before compiling
// This prevents the "Cannot overwrite model once compiled" error
let Selection;
try {
  // Check if the model is already defined
  Selection = mongoose.model('Selection');
} catch {
  // If not, define it
  Selection = mongoose.model('Selection', selectionSchema);
}

export default Selection;
