// models/User-fixed-bcrypt.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
    trim: true,
    default: function() {
      if (this.name) {
        const parts = this.name.trim().split(/\s+/);
        return parts[0] || 'User';
      }
      return 'User';
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    default: function() {
      if (this.name) {
        const parts = this.name.trim().split(/\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : 'User';
      }
      return 'User';
    }
  },
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
    status: { type: String, default: 'inactive' },
    plan: { type: String, default: 'free' },
    tier: { type: String, default: 'free' }
  },
  stats: {
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null }
  },
  refreshTokens: [{
    token: String,
    device: String,
    ip: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resetToken: String,
  resetTokenExpiry: Date,
  emailVerified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// FIXED: Password hashing middleware - SIMPLIFIED
userSchema.pre('save', function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash the password synchronously to avoid async issues
  try {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  try {
    if (!this.password) return false;
    return bcrypt.compareSync(candidatePassword, this.password);
  } catch (error) {
    console.error('Password compare error:', error);
    return false;
  }
};

// Method to generate tokens - FIXED require issue
userSchema.methods.generateAuthTokens = function(device = 'unknown', ip = 'unknown') {
  try {
    // Use dynamic import instead of require
    import('../utils/jwt.js').then(jwtModule => {
      const jwtService = jwtModule.default;
      
      const userData = {
        userId: this._id.toString(),
        email: this.email,
        role: this.role,
        name: this.name
      };
      
      const accessToken = jwtService.generateAccessToken(userData);
      const refreshToken = jwtService.generateRefreshToken(userData);
      
      this.refreshTokens.push({
        token: refreshToken,
        device,
        ip,
        createdAt: new Date()
      });
      
      return { accessToken, refreshToken };
    }).catch(error => {
      console.error('Error importing jwt module:', error);
      throw error;
    });
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw error;
  }
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = (this.refreshTokens || []).filter(rt => rt.token !== token);
};

// Remove duplicate indexes - keep only schema.index() calls
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
