const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.appleId;
    }
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'influencer', 'moderator'],
    default: 'user'
  },
  
  // Subscription info
  subscription: {
    planId: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
      default: 'inactive'
    },
    active: {
      type: Boolean,
      default: false
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    expiresAt: Date,
    trialEnd: Date,
    cancelAtPeriodEnd: Boolean,
    cancellationRequestedAt: Date,
    cancellationReason: String,
    pricePaid: Number,
    paymentMethod: String,
    transactionId: String,
    features: [String]
  },
  
  // Social login
  googleId: String,
  appleId: String,
  
  // Profile
  bio: String,
  location: String,
  favoriteTeams: [String],
  favoriteSports: [String],
  
  // Stats
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
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  
  // Settings
  emailVerified: {
    type: Boolean,
    default: false
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    betting: { type: Boolean, default: true },
    fantasy: { type: Boolean, default: true }
  },
  
  // Timestamps
  lastLogin: Date,
  lastActive: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// CORRECTED: Hash password before saving (async without next parameter)
userSchema.pre('save', async function() {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Method to calculate accuracy
userSchema.methods.calculateAccuracy = function() {
  if (this.totalPredictions === 0) return 0;
  return (this.correctPredictions / this.totalPredictions) * 100;
};

// Method to check subscription status
userSchema.methods.hasActiveSubscription = function() {
  if (!this.subscription) return false;
  if (this.subscription.status !== 'active') return false;
  if (this.subscription.expiresAt && this.subscription.expiresAt < new Date()) return false;
  return true;
};

// Method to check feature access
userSchema.methods.canAccessFeature = function(featureName) {
  if (!this.subscription || !this.subscription.features) return false;
  return this.subscription.features.includes(featureName);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
