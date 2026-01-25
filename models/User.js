// models/user.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
  
  // Updated role field from File 1
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  
  // New status field from File 1
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'suspended', 'inactive']
  },
  
  // Subscription info - updated with File 1 structure
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
      default: 'inactive'
    },
    plan: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly'],
      default: 'free'
    },
    expiresAt: Date,
    active: {
      type: Boolean,
      default: false
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
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
  
  // New analytics field from File 1
  analytics: {
    totalSelections: { type: Number, default: 0 },
    successfulSelections: { type: Number, default: 0 },
    totalWinners: { type: Number, default: 0 }
  },
  
  // Settings
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // New preference fields from File 1
  preferences: mongoose.Schema.Types.Mixed,
  notifications: mongoose.Schema.Types.Mixed,
  settings: mongoose.Schema.Types.Mixed,
  generationSettings: mongoose.Schema.Types.Mixed,
  
  // Existing notifications
  notificationPreferences: {
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (error) {
    next(error);
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

// Method to get user status
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to get analytics summary
userSchema.methods.getAnalyticsSummary = function() {
  return {
    totalSelections: this.analytics?.totalSelections || 0,
    successfulSelections: this.analytics?.successfulSelections || 0,
    totalWinners: this.analytics?.totalWinners || 0,
    successRate: this.analytics?.totalSelections 
      ? ((this.analytics.successfulSelections / this.analytics.totalSelections) * 100).toFixed(2)
      : 0
  };
};

// FIXED: Check if model already exists before compiling
// This prevents the "Cannot overwrite model once compiled" error
let User;
try {
  // Check if the model is already defined
  User = mongoose.model('User');
} catch {
  // If not, define it
  User = mongoose.model('User', userSchema);
}

export default User;
