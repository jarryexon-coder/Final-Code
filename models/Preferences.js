// models/Preferences.js
import mongoose from 'mongoose';

const preferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Sports preferences
  sports: {
    type: [String],
    enum: ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer', 'Tennis', 'Golf', 'UFC'],
    default: ['NBA', 'NFL', 'NHL', 'MLB']
  },

  // Favorite teams by sport
  favoriteTeams: {
    NBA: [String],
    NFL: [String],
    NHL: [String],
    MLB: [String],
    Soccer: [String],
    Tennis: [String],
    Golf: [String],
    UFC: [String]
  },

  // Favorite players by sport
  favoritePlayers: {
    NBA: [String],
    NFL: [String],
    NHL: [String],
    MLB: [String],
    Soccer: [String],
    Tennis: [String],
    Golf: [String],
    UFC: [String]
  },

  // Betting preferences
  betPreferences: {
    unitSize: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 100
    },
    maxUnitsPerBet: {
      type: Number,
      default: 5,
      min: 0.1,
      max: 50
    },
    riskTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    favoriteBetTypes: {
      type: [String],
      enum: [
        'moneyline',
        'spread',
        'overunder',
        'parlay',
        'teaser',
        'player-props',
        'team-props',
        'futures',
        'live-betting'
      ],
      default: ['moneyline', 'spread', 'overunder']
    },
    maxDailyBets: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    bankrollSize: {
      type: Number,
      default: 1000,
      min: 10,
      max: 100000
    },
    sportsbooks: [String]
  },

  // App settings
  appSettings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    soundEffects: {
      type: Boolean,
      default: true
    },
    hapticFeedback: {
      type: Boolean,
      default: true
    },
    dataSaver: {
      type: Boolean,
      default: false
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    defaultSport: {
      type: String,
      enum: ['NBA', 'NFL', 'NHL', 'MLB'],
      default: 'NBA'
    },
    defaultView: {
      type: String,
      enum: ['predictions', 'analytics', 'secret-phrases', 'dashboard', 'games'],
      default: 'predictions'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'auto'
    }
  },

  // Notification settings
  notificationSettings: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    dailyDigest: {
      type: Boolean,
      default: true
    },
    predictionReminders: {
      type: Boolean,
      default: true
    },
    breakingNews: {
      type: Boolean,
      default: true
    },
    gameAlerts: {
      type: Boolean,
      default: true
    },
    injuryUpdates: {
      type: Boolean,
      default: true
    },
    lineupChanges: {
      type: Boolean,
      default: true
    },
    betSettled: {
      type: Boolean,
      default: true
    }
  },

  // Analytics preferences
  analyticsPreferences: {
    showAdvancedStats: {
      type: Boolean,
      default: false
    },
    showConfidenceScores: {
      type: Boolean,
      default: true
    },
    showHistoricalData: {
      type: Boolean,
      default: true
    },
    autoAnalyzeFavorites: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  collection: 'user_preferences'
});

// Pre-save middleware
preferencesSchema.pre('save', function(next) {
  // Ensure arrays are not too long
  ['NBA', 'NFL', 'NHL', 'MLB'].forEach(sport => {
    if (this.favoriteTeams && this.favoriteTeams[sport]) {
      this.favoriteTeams[sport] = this.favoriteTeams[sport].slice(0, 10);
    }
    if (this.favoritePlayers && this.favoritePlayers[sport]) {
      this.favoritePlayers[sport] = this.favoritePlayers[sport].slice(0, 15);
    }
  });

  next();
});

// Static methods
preferencesSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

preferencesSchema.statics.getPopularTeams = async function(sport) {
  const result = await this.aggregate([
    { $match: { [`favoriteTeams.${sport}`]: { $exists: true, $ne: [] } } },
    { $unwind: `$favoriteTeams.${sport}` },
    {
      $group: {
        _id: `$favoriteTeams.${sport}`,
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return result.map(item => ({ team: item._id, count: item.count }));
};

const Preferences = mongoose.model('Preferences', preferencesSchema);

export default Preferences;
