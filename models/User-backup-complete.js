// models/User.js - COMPLETE INTEGRATED VERSION
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwtService from '../utils/jwt.js';

const userSchema = new mongoose.Schema({
  // Basic Information (from both models)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    trim: true,
    default: function() {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null/multiple nulls
    trim: true,
    default: function() {
      const base = this.email.split('@')[0];
      const random = Math.floor(Math.random() * 10000);
      return `${base}${random}`;
    }
  },
  
  // Authentication & Roles (integrated from both)
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin', 'premium', 'moderator'],
    index: true
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'suspended', 'inactive', 'pending_verification']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false,
    set: function(v) {
      // Keep both fields in sync
      this.isVerified = v;
      return v;
    }
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  
  // Subscription (merged both models)
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'trial', 'pending'],
      default: 'inactive'
    },
    plan: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly', 'premium', 'pro'],
      default: 'free'
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'premium', 'elite'],
      default: 'free',
      set: function(v) {
        // Auto-set plan based on tier
        if (v === 'free') this.subscription.plan = 'free';
        else if (v === 'pro') this.subscription.plan = 'pro_monthly';
        else if (v === 'premium') this.subscription.plan = 'elite_monthly';
        else if (v === 'elite') this.subscription.plan = 'elite_yearly';
        return v;
      }
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Set default expiry based on plan
        const now = new Date();
        if (this.subscription.plan === 'pro_yearly' || this.subscription.plan === 'elite_yearly') {
          return new Date(now.setFullYear(now.getFullYear() + 1));
        } else if (this.subscription.plan.includes('monthly')) {
          return new Date(now.setMonth(now.getMonth() + 1));
        } else if (this.subscription.plan === 'trial') {
          return new Date(now.setDate(now.getDate() + 7)); // 7-day trial
        }
        return null; // Free plan has no expiry
      }
    },
    stripeCustomerId: String,
    revenuecatId: String,
    appleReceipt: String,
    googlePlayToken: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'apple', 'google', 'manual', 'none'],
      default: 'none'
    }
  },
  
  // User Preferences (from new model)
  preferences: {
    notifications: {
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
      frequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly'],
        default: 'instant'
      }
    },
    favoriteTeams: [{
      type: String,
      trim: true
    }],
    favoritePlayers: [{
      type: String,
      trim: true
    }],
    theme: {
      type: String,
      enum: ['light', 'dark', 'system', 'auto'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'pt', 'zh']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    displayUnits: {
      type: String,
      enum: ['imperial', 'metric'],
      default: 'imperial'
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showActivity: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // User Stats (from new model)
  stats: {
    loginCount: {
      type: Number,
      default: 0
    },
    lastLogin: {
      type: Date,
      default: null
    },
    totalPredictions: {
      type: Number,
      default: 0
    },
    correctPredictions: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0,
      set: function() {
        if (this.stats.totalPredictions > 0) {
          return (this.stats.correctPredictions / this.stats.totalPredictions) * 100;
        }
        return 0;
      }
    },
    totalWagered: {
      type: Number,
      default: 0
    },
    totalWon: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0,
      set: function() {
        if (this.stats.totalWagered > 0) {
          return ((this.stats.totalWon - this.stats.totalWagered) / this.stats.totalWagered) * 100;
        }
        return 0;
      }
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      best: {
        type: Number,
        default: 0
      }
    },
    badges: [{
      name: String,
      earnedAt: Date,
      description: String
    }],
    achievements: [{
      name: String,
      unlockedAt: Date,
      points: Number
    }],
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  
  // Authentication Tokens (from new model)
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    device: {
      type: String,
      default: 'unknown'
    },
    deviceId: String,
    ip: {
      type: String,
      default: 'unknown'
    },
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String
    },
    lastUsed: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Password Reset (from new model)
  resetToken: String,
  resetTokenExpiry: Date,
  resetRequestCount: {
    type: Number,
    default: 0
  },
  lastResetRequest: Date,
  
  // Profile Information
  avatar: {
    type: String,
    default: function() {
      // Generate default avatar URL
      const initials = `${this.firstName?.[0] || ''}${this.lastName?.[0] || ''}`.toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=007AFF&color=fff`;
    }
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    city: String,
    state: String,
    country: String,
    timezone: String
  },
  socialLinks: {
    twitter: String,
    instagram: String,
    youtube: String,
    twitch: String,
    discord: String
  },
  
  // App-specific Features
  bankroll: {
    type: Number,
    default: 1000, // Starting bankroll
    min: 0
  },
  riskTolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate'
  },
  bettingStrategy: {
    type: String,
    enum: ['flat', 'martingale', 'percentage', 'value'],
    default: 'flat'
  },
  maxBetSize: {
    type: Number,
    default: 100
  },
  
  // Analytics & Tracking
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    lastUsed: Date
  }],
  
  // Timestamps (from both)
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive information from JSON output
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.resetToken;
      delete ret.resetTokenExpiry;
      delete ret.verificationToken;
      delete ret.verificationTokenExpiry;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.resetToken;
      delete ret.resetTokenExpiry;
      delete ret.verificationToken;
      delete ret.verificationTokenExpiry;
      delete ret.__v;
      return ret;
    }
  }
});

// ====================
// VIRTUAL PROPERTIES
// ====================
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('initials').get(function() {
  return `${this.firstName?.[0] || ''}${this.lastName?.[0] || ''}`.toUpperCase();
});

userSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

userSchema.virtual('isPremium').get(function() {
  return this.subscription.status === 'active' && 
         this.subscription.tier !== 'free' && 
         (!this.subscription.expiresAt || this.subscription.expiresAt > new Date());
});

userSchema.virtual('subscriptionExpired').get(function() {
  return this.subscription.expiresAt && this.subscription.expiresAt < new Date();
});

userSchema.virtual('daysSinceLastLogin').get(function() {
  if (!this.stats.lastLogin) return null;
  const diff = Date.now() - this.stats.lastLogin.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ====================
// MIDDLEWARE (PRE/ POST HOOKS)
// ====================

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Update timestamps
    this.updatedAt = new Date();
    
    // Hash password if modified
    if (this.isModified('password')) {
      if (this.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Auto-generate username if not set
    if (!this.username || this.username === '') {
      const base = this.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const random = Math.floor(Math.random() * 10000);
      this.username = `${base}${random}`;
    }
    
    // Set name from firstName and lastName if not set
    if ((!this.name || this.name === '') && this.firstName && this.lastName) {
      this.name = `${this.firstName} ${this.lastName}`;
    }
    
    // Sync email verification fields
    if (this.isModified('emailVerified')) {
      this.isVerified = this.emailVerified;
    }
    if (this.isModified('isVerified')) {
      this.emailVerified = this.isVerified;
    }
    
    // Set subscription tier based on plan
    if (this.isModified('subscription.plan')) {
      const plan = this.subscription.plan;
      if (plan === 'free') this.subscription.tier = 'free';
      else if (plan.includes('pro')) this.subscription.tier = 'pro';
      else if (plan.includes('elite')) this.subscription.tier = 'elite';
      else if (plan === 'premium') this.subscription.tier = 'premium';
    }
    
    // Update stats
    if (this.isModified('stats.correctPredictions') || this.isModified('stats.totalPredictions')) {
      this.stats.winRate = this.stats.totalPredictions > 0 
        ? (this.stats.correctPredictions / this.stats.totalPredictions) * 100 
        : 0;
    }
    
    if (this.isModified('stats.totalWagered') || this.isModified('stats.totalWon')) {
      this.stats.roi = this.stats.totalWagered > 0 
        ? ((this.stats.totalWon - this.stats.totalWagered) / this.stats.totalWagered) * 100 
        : 0;
    }
    
    // Update streak
    if (this.isModified('stats.streak.current')) {
      if (this.stats.streak.current > this.stats.streak.best) {
        this.stats.streak.best = this.stats.streak.current;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastSeen on login
userSchema.methods.updateLastSeen = async function() {
  this.lastSeen = new Date();
  await this.save();
};

// ====================
// INSTANCE METHODS
// ====================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate authentication tokens
userSchema.methods.generateAuthTokens = function(deviceInfo = {}) {
  const userData = {
    _id: this._id,
    email: this.email,
    role: this.role,
    name: this.name,
    subscription: this.subscription
  };
  
  const accessToken = jwtService.generateAccessToken(userData);
  const refreshToken = jwtService.generateRefreshToken(userData);
  
  // Store refresh token
  this.refreshTokens.push({
    token: refreshToken,
    device: deviceInfo.device || 'unknown',
    deviceId: deviceInfo.deviceId,
    ip: deviceInfo.ip || 'unknown',
    userAgent: deviceInfo.userAgent,
    location: deviceInfo.location,
    lastUsed: new Date()
  });
  
  // Keep only last 10 refresh tokens
  if (this.refreshTokens.length > 10) {
    this.refreshTokens = this.refreshTokens.slice(-10);
  }
  
  return { accessToken, refreshToken };
};

// Remove specific refresh token (for logout)
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Clear all refresh tokens (for security)
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
};

// Generate password reset token
userSchema.methods.generateResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  this.resetToken = resetToken;
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  this.resetRequestCount += 1;
  this.lastResetRequest = new Date();
  return resetToken;
};

// Clear reset token after use
userSchema.methods.clearResetToken = function() {
  this.resetToken = undefined;
  this.resetTokenExpiry = undefined;
};

// Verify reset token
userSchema.methods.verifyResetToken = function(token) {
  return this.resetToken === token && 
         this.resetTokenExpiry && 
         this.resetTokenExpiry > Date.now();
};

// Add prediction result
userSchema.methods.addPredictionResult = async function(isCorrect, wager = 0, winnings = 0) {
  this.stats.totalPredictions += 1;
  
  if (isCorrect) {
    this.stats.correctPredictions += 1;
    this.stats.streak.current += 1;
  } else {
    this.stats.streak.current = 0;
  }
  
  this.stats.totalWagered += wager;
  this.stats.totalWon += winnings;
  
  // Update bankroll
  this.bankroll += (winnings - wager);
  
  await this.save();
};

// Add achievement/badge
userSchema.methods.addAchievement = async function(name, description, points = 10) {
  this.stats.achievements.push({
    name,
    description,
    points,
    unlockedAt: new Date()
  });
  
  this.stats.experience += points;
  
  // Level up every 100 experience points
  const newLevel = Math.floor(this.stats.experience / 100) + 1;
  if (newLevel > this.stats.level) {
    this.stats.level = newLevel;
  }
  
  await this.save();
};

// Update subscription
userSchema.methods.updateSubscription = async function(plan, status = 'active', paymentMethod = 'stripe') {
  this.subscription.plan = plan;
  this.subscription.status = status;
  this.subscription.paymentMethod = paymentMethod;
  this.subscription.lastPaymentDate = new Date();
  
  // Set expiry based on plan
  const now = new Date();
  if (plan.includes('yearly')) {
    this.subscription.expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
    this.subscription.nextPaymentDate = new Date(now.setFullYear(now.getFullYear() + 1));
  } else if (plan.includes('monthly')) {
    this.subscription.expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    this.subscription.nextPaymentDate = new Date(now.setMonth(now.getMonth() + 1));
  } else if (plan === 'trial') {
    this.subscription.expiresAt = new Date(now.setDate(now.getDate() + 7));
  }
  
  // Set tier
  if (plan === 'free') this.subscription.tier = 'free';
  else if (plan.includes('pro')) this.subscription.tier = 'pro';
  else if (plan.includes('elite') || plan === 'premium') this.subscription.tier = 'premium';
  
  await this.save();
};

// Check subscription status
userSchema.methods.hasActiveSubscription = function() {
  return this.subscription.status === 'active' && 
         (!this.subscription.expiresAt || this.subscription.expiresAt > new Date());
};

// ====================
// STATIC METHODS
// ====================

// Find by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: new RegExp(`^${email}$`, 'i') });
};

// Find by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

// Find by reset token
userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });
};

// Find by verification token
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: Date.now() }
  });
};

// Find by referral code
userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ referralCode: code });
};

// Find premium users
userSchema.statics.findPremiumUsers = function() {
  return this.find({
    'subscription.status': 'active',
    'subscription.expiresAt': { $gt: new Date() },
    'subscription.tier': { $ne: 'free' }
  });
};

// Get user leaderboard
userSchema.statics.getLeaderboard = function(limit = 100, timeRange = 'all') {
  const query = {};
  
  // Add time range filter if needed
  if (timeRange === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    // You'd need to store prediction dates to filter by time
  }
  
  return this.find(query)
    .select('name username avatar stats subscription')
    .sort({ 'stats.winRate': -1, 'stats.totalPredictions': -1 })
    .limit(limit);
};

// Get user stats summary
userSchema.statics.getStatsSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        premiumUsers: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$subscription.status', 'active'] },
                  { $ne: ['$subscription.tier', 'free'] }
                ]
              },
              1,
              0
            ]
          }
        },
        avgWinRate: { $avg: '$stats.winRate' },
        totalPredictions: { $sum: '$stats.totalPredictions' },
        avgBankroll: { $avg: '$bankroll' }
      }
    }
  ]);
};

// ====================
// INDEXES
// ====================
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ 'subscription.status': 1, 'subscription.expiresAt': 1 });
userSchema.index({ 'stats.winRate': -1 });
userSchema.index({ 'stats.totalPredictions': -1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'lastSeen': -1 });
userSchema.index({ 'preferences.favoriteTeams': 1 });
userSchema.index({ 'preferences.favoritePlayers': 1 });

// ====================
// COMPOUND INDEXES
// ====================
userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, 'subscription.tier': 1 });
userSchema.index({ 
  'subscription.status': 1, 
  'subscription.expiresAt': 1, 
  'subscription.tier': 1 
});

// ====================
// CREATE/GET MODEL
// ====================
let User;
try {
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', userSchema);
}

export default User;
