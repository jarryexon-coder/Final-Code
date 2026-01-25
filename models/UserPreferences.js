// models/UserPreferences.js
import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'daily' },
      types: {
        selectionAlerts: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: false },
        systemAlerts: { type: Boolean, default: true },
        promotional: { type: Boolean, default: false },
        security: { type: Boolean, default: true }
      }
    },
    push: {
      enabled: { type: Boolean, default: true },
      types: {
        selectionAlerts: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
        social: { type: Boolean, default: false }
      }
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      types: {
        all: { type: Boolean, default: true }
      }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      types: {
        urgentAlerts: { type: Boolean, default: true },
        security: { type: Boolean, default: true }
      }
    },
    sound: {
      enabled: { type: Boolean, default: true },
      volume: { type: Number, min: 0, max: 100, default: 80 }
    },
    doNotDisturb: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    }
  },
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    activityVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    selectionVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
    dataSharing: {
      analytics: { type: Boolean, default: true },
      improveService: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    thirdPartySharing: { type: Boolean, default: false },
    dataRetention: { type: String, enum: ['30days', '90days', '1year', 'forever'], default: '30days' },
    locationSharing: { type: Boolean, default: false },
    contactVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    searchVisibility: { type: Boolean, default: true }
  },
  theme: {
    mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#10B981' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    density: { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
    animations: { type: Boolean, default: true },
    reduceMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false }
  },
  display: {
    defaultView: { type: String, enum: ['dashboard', 'selections', 'analytics', 'profile'], default: 'dashboard' },
    cardsPerRow: { type: Number, min: 1, max: 5, default: 3 },
    showImages: { type: Boolean, default: true },
    imageQuality: { type: String, enum: ['low', 'medium', 'high', 'auto'], default: 'auto' },
    autoPlayVideos: { type: Boolean, default: false },
    showTrending: { type: Boolean, default: true },
    showRecommendations: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'auto' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' }
  },
  betting: {
    defaultUnits: { type: Number, min: 0.1, max: 10, default: 1 },
    maxUnitsPerDay: { type: Number, min: 1, max: 100, default: 10 },
    maxRiskPerDay: { type: Number, min: 1, max: 10000, default: 100 },
    autoCashOut: {
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, min: 50, max: 100, default: 80 }
    },
    bankrollManagement: {
      method: { type: String, enum: ['fixed', 'percentage', 'kelly'], default: 'fixed' },
      percentage: { type: Number, min: 0.1, max: 10, default: 2 }
    },
    preferredSports: [{ type: String }],
    excludedSports: [{ type: String }],
    oddsFormat: { type: String, enum: ['american', 'decimal', 'fractional'], default: 'american' },
    defaultSort: { type: String, enum: ['value', 'confidence', 'odds', 'date'], default: 'value' },
    showAdvancedStats: { type: Boolean, default: true },
    showTrendLines: { type: Boolean, default: true }
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
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;
