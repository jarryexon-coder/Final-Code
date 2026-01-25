// models/Draft.js
import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['snake', 'auction', 'linear'],
    default: 'snake'
  },
  teams: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  rounds: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'PGA', 'Tennis', 'Soccer']
  },
  platform: {
    type: String,
    enum: ['FanDuel', 'DraftKings', 'Yahoo', 'ESPN', 'Custom'],
    default: 'FanDuel'
  },
  commissioner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentRound: {
    type: Number,
    default: 1
  },
  currentPick: {
    type: Number,
    default: 1
  },
  draftOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    timePerPick: {
      type: Number,
      default: 90
    },
    auctionBudget: {
      type: Number,
      default: 200
    },
    rosterSettings: {
      type: Map,
      of: Number
    },
    scoringSettings: {
      type: Map,
      of: Number
    }
  },
  picks: [{
    round: {
      type: Number,
      required: true
    },
    overallPick: {
      type: Number,
      required: true
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    autoPick: {
      type: Boolean,
      default: false
    },
    cost: {
      type: Number,
      default: 0
    }
  }],
  completedAt: {
    type: Date
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

// Update timestamp on save
draftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Draft = mongoose.model('Draft', draftSchema);

export default Draft;
