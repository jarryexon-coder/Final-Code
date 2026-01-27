// models/User-simple.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // REQUIRED FIELDS
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  
  // OPTIONAL FIELDS WITH DEFAULTS
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin', 'premium']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'suspended', 'inactive']
  },
  
  subscription: {
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive', 'cancelled', 'expired']
    },
    plan: {
      type: String,
      default: 'free',
      enum: ['free', 'pro', 'premium']
    },
    tier: {
      type: String,
      default: 'free',
      enum: ['free', 'pro', 'premium']
    }
  },
  
  stats: {
    loginCount: {
      type: Number,
      default: 0
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  
  refreshTokens: [{
    token: String,
    device: String,
    ip: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  resetToken: String,
  resetTokenExpiry: Date,
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  minimize: false // Don't strip empty objects
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password - ROBUST VERSION
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Check if this.password exists
    if (!this.password) {
      console.error('Password comparison: No password stored for user:', this.email);
      return false;
    }
    
    // Check if candidatePassword is valid
    if (typeof candidatePassword !== 'string' || candidatePassword.trim() === '') {
      console.error('Password comparison: Invalid candidate password for user:', this.email);
      return false;
    }
    
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error for user:', this.email, error.message);
    return false;
  }
};

// Method to generate tokens
userSchema.methods.generateAuthTokens = function(device = 'unknown', ip = 'unknown') {
  try {
    const jwtService = require('../utils/jwt.js');
    
    const userData = {
      userId: this._id.toString(),
      email: this.email,
      role: this.role,
      name: this.name
    };
    
    const accessToken = jwtService.generateAccessToken(userData);
    const refreshToken = jwtService.generateRefreshToken(userData);
    
    // Store refresh token
    this.refreshTokens = this.refreshTokens || [];
    this.refreshTokens.push({
      token: refreshToken,
      device,
      ip,
      createdAt: new Date()
    });
    
    // Keep only last 5 tokens
    if (this.refreshTokens.length > 5) {
      this.refreshTokens = this.refreshTokens.slice(-5);
    }
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating auth tokens:', error.message);
    throw error;
  }
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = (this.refreshTokens || []).filter(rt => rt.token !== token);
};

// ONLY ADD THESE INDEXES - REMOVE ANY index: true FROM SCHEMA DEFINITION
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
