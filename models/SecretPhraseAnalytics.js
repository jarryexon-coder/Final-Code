// models/SecretPhraseAnalytics.js
import mongoose from 'mongoose';

const secretPhraseAnalyticsSchema = new mongoose.Schema({
  // User Information
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
  
  // Phrase Information
  secretCode: {
    type: String,
    required: true,
    index: true
  },
  phraseTitle: {
    type: String,
    required: true
  },
  phraseCategory: {
    type: String,
    enum: [
      'Advanced Analytics & Models',
      'Advanced Injury Analytics', 
      'NHL-Specific Analytics',
      'Game Situation Analytics',
      'Player-Specific Analytics',
      'Market & Betting Analytics',
      'NFL-Specific Analytics',
      'NBA-Specific Analytics',
      'MLB-Specific Analytics'
    ],
    required: true
  },
  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Legendary', 'Epic'],
    default: 'Common'
  },
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'All', 'Mixed'],
    required: true
  },
  
  // Usage Data
  eventType: {
    type: String,
    enum: [
      'search',
      'view',
      'select',
      'generate',
      'copy',
      'share',
      'activate',
      'preview'
    ],
    required: true
  },
  searchQuery: {
    type: String,
    default: null
  },
  inputText: {
    type: String,
    default: null
  },
  generatedOutput: {
    type: String,
    default: null
  },
  
  // Sports Specific Data
  playerName: {
    type: String,
    default: null
  },
  playerPosition: {
    type: String,
    default: null
  },
  team: {
    type: String,
    default: null
  },
  
  // Analytics Metadata
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  accuracyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  unitsGained: {
    type: Number,
    default: 0
  },
  outcome: {
    type: String,
    enum: ['win', 'loss', 'push', 'pending', 'cancelled'],
    default: null
  },
  
  // Performance Metrics
  responseTime: {
    type: Number, // milliseconds
    default: null
  },
  modelUsed: {
    type: String,
    default: 'default'
  },
  modelVersion: {
    type: String,
    default: '1.0'
  },
  
  // Session Information
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  deviceInfo: {
    platform: String,
    osVersion: String,
    appVersion: String,
    screenResolution: String
  },
  
  // Location & Network
  ipAddress: {
    type: String,
    default: null
  },
  region: {
    type: String,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD for daily aggregation
    index: true
  },
  hour: {
    type: Number, // 0-23 for hourly analysis
    index: true
  },
  
  // Flags
  isPremium: {
    type: Boolean,
    default: false,
    index: true
  },
  isSuccessful: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'secret_phrase_analytics'
});

// Compound Indexes for common queries
secretPhraseAnalyticsSchema.index({ userId: 1, timestamp: -1 });
secretPhraseAnalyticsSchema.index({ secretCode: 1, eventType: 1 });
secretPhraseAnalyticsSchema.index({ phraseCategory: 1, sport: 1 });
secretPhraseAnalyticsSchema.index({ timestamp: -1, outcome: 1 });
secretPhraseAnalyticsSchema.index({ date: 1, sport: 1 });

// Pre-save middleware to populate date and hour fields
secretPhraseAnalyticsSchema.pre('save', function(next) {
  if (this.timestamp) {
    const date = new Date(this.timestamp);
    this.date = date.toISOString().split('T')[0]; // YYYY-MM-DD
    this.hour = date.getUTCHours();
  }
  next();
});

// Static methods for analytics queries
secretPhraseAnalyticsSchema.statics = {
  // Get user's recent activity
  async getUserActivity(userId, limit = 50) {
    return this.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },
  
  // Get popular phrases
  async getPopularPhrases(limit = 10, days = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.aggregate([
      {
        $match: {
          timestamp: { $gte: date },
          eventType: { $in: ['select', 'generate', 'activate'] }
        }
      },
      {
        $group: {
          _id: '$secretCode',
          count: { $sum: 1 },
          title: { $first: '$phraseTitle' },
          category: { $first: '$phraseCategory' },
          sport: { $first: '$sport' },
          avgConfidence: { $avg: '$confidenceScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
  },
  
  // Get category distribution
  async getCategoryDistribution(userId = null, days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const match = { timestamp: { $gte: date } };
    if (userId) {
      match.userId = userId;
    }
    
    return this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$phraseCategory',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidenceScore' },
          totalUnits: { $sum: '$unitsGained' },
          winRate: {
            $avg: {
              $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  },
  
  // Get daily stats
  async getDailyStats(userId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const match = { timestamp: { $gte: today } };
    if (userId) {
      match.userId = userId;
    }
    
    const results = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          uniquePhrases: { $addToSet: '$secretCode' },
          totalUnits: { $sum: '$unitsGained' },
          winCount: {
            $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] }
          },
          lossCount: {
            $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);
    
    if (results.length === 0) {
      return {
        todaysEvents: 0,
        todaysUnits: 0,
        accuracyRate: '0%',
        winRate: '0%'
      };
    }
    
    const stats = results[0];
    const totalDecided = stats.winCount + stats.lossCount;
    const accuracyRate = totalDecided > 0 
      ? ((stats.winCount / totalDecided) * 100).toFixed(1)
      : 0;
    
    return {
      todaysEvents: stats.totalEvents,
      todaysUnits: stats.totalUnits || 0,
      accuracyRate: `${accuracyRate}%`,
      winRate: `${accuracyRate}%`,
      uniquePhrases: stats.uniquePhrases?.length || 0,
      winCount: stats.winCount,
      lossCount: stats.lossCount,
      pendingCount: stats.pendingCount
    };
  },
  
  // Track a new analytics event
  async trackEvent(eventData) {
    try {
      const event = new this({
        ...eventData,
        timestamp: eventData.timestamp || new Date()
      });
      
      return await event.save();
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't throw to prevent breaking user flow
      return null;
    }
  }
};

// Instance methods
secretPhraseAnalyticsSchema.methods = {
  toClientFormat() {
    const obj = this.toObject();
    
    // Remove sensitive/internal fields
    delete obj.__v;
    delete obj.ipAddress;
    delete obj.deviceInfo;
    delete obj.sessionId;
    
    // Format timestamps
    if (obj.timestamp) {
      obj.timestamp = obj.timestamp.toISOString();
    }
    if (obj.createdAt) {
      obj.createdAt = obj.createdAt.toISOString();
    }
    if (obj.updatedAt) {
      obj.updatedAt = obj.updatedAt.toISOString();
    }
    
    return obj;
  }
};

// Virtual for win/loss status
secretPhraseAnalyticsSchema.virtual('isWin').get(function() {
  return this.outcome === 'win';
});

secretPhraseAnalyticsSchema.virtual('isLoss').get(function() {
  return this.outcome === 'loss';
});

secretPhraseAnalyticsSchema.virtual('isPending').get(function() {
  return this.outcome === 'pending';
});

const SecretPhraseAnalytics = mongoose.model('SecretPhraseAnalytics', secretPhraseAnalyticsSchema);

export default SecretPhraseAnalytics;
