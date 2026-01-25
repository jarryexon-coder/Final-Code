// models/SportsCache.js
import mongoose from 'mongoose';

const sportsCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'ALL'],
    default: 'ALL'
  },
  dataType: {
    type: String,
    enum: [
      'live-scores',
      'schedule',
      'standings',
      'player-stats',
      'team-stats',
      'game-details',
      'odds',
      'search',
      'injuries',
      'news',
      'roster',
      'game-log',
      'league-leaders'
    ]
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'sports_cache'
});

// Create TTL index for automatic cleanup
sportsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
sportsCacheSchema.statics.findByKey = function(key) {
  return this.findOne({ key });
};

sportsCacheSchema.statics.clearExpired = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

sportsCacheSchema.statics.clearBySport = function(sport) {
  return this.deleteMany({ sport });
};

const SportsCache = mongoose.model('SportsCache', sportsCacheSchema);

export default SportsCache;
