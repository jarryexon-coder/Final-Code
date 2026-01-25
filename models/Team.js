import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['NFL', 'NBA', 'NHL', 'MLB', 'SOCCER']
  },
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  abbreviation: String,
  city: String,
  conference: {
    type: String,
    index: true
  },
  division: {
    type: String,
    index: true
  },
  
  // Venue Information
  stadium: String,
  capacity: Number,
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Performance
  record: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    otLosses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    pointsFor: { type: Number, default: 0 },
    pointsAgainst: { type: Number, default: 0 },
    streak: String,
    last10: String
  },
  
  // Statistics
  stats: mongoose.Schema.Types.Mixed,
  
  // Roster Information (virtual population)
  roster: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  
  // Schedule
  nextGame: Date,
  lastGame: Date,
  homeRecord: String,
  awayRecord: String,
  
  // Team Details
  colors: [String],
  logoUrl: String,
  founded: Number,
  championships: [Number],
  
  // Analytics
  powerRanking: Number,
  playoffOdds: Number,
  
  // Metadata
  externalId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
teamSchema.index({ sport: 1, conference: 1, division: 1 });
teamSchema.index({ name: 'text', city: 'text' });
teamSchema.index({ sport: 1, 'record.winPercentage': -1 });

// Update timestamp
teamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.record.wins + this.record.losses + this.record.ties > 0) {
    const total = this.record.wins + this.record.losses + this.record.ties;
    this.record.winPercentage = this.record.wins / total;
  }
  next();
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
