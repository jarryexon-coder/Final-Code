import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  query: {
    type: String,
    required: true,
    trim: true
  },
  
  filters: {
    sport: String,
    type: String,
    minConfidence: Number,
    maxConfidence: Number,
    minEdgeScore: Number,
    maxEdgeScore: Number,
    bumpRisk: String,
    timeframe: String
  },
  
  resultsCount: {
    type: Number,
    default: 0
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  sessionId: String,
  
  deviceInfo: {
    platform: String,
    userAgent: String,
    screenSize: String
  }
}, {
  timestamps: true
});

// Index for getting recent searches
searchHistorySchema.index({ userId: 1, timestamp: -1 });

// TTL index to auto-delete old searches after 90 days
searchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
