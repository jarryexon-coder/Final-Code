import mongoose from 'mongoose';

const statSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['NFL', 'NBA', 'NHL', 'MLB', 'SOCCER']
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  statType: String,
  
  // Player stats (if applicable)
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    index: true
  },
  playerName: String,
  
  // Team stats (if applicable)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  teamName: String,
  
  // Game context
  gameId: String,
  season: {
    type: String,
    required: true,
    index: true
  },
  week: Number,
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Statistics data (flexible structure)
  data: mongoose.Schema.Types.Mixed,
  
  // Calculated metrics
  value: Number,
  rank: Number,
  percentile: Number,
  
  // Advanced metrics
  advancedMetrics: mongoose.Schema.Types.Mixed,
  
  // Metadata
  source: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isProjection: {
    type: Boolean,
    default: false
  }
});

// Compound indexes for efficient queries
statSchema.index({ sport: 1, category: 1, season: 1 });
statSchema.index({ sport: 1, playerId: 1, date: -1 });
statSchema.index({ sport: 1, teamId: 1, category: 1 });
statSchema.index({ sport: 1, season: 1, value: -1 });

const Stat = mongoose.model('Stat', statSchema);
export default Stat;
