// models/User-ultimate.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwtService from '../utils/jwt.js';

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
    default: 'user'
  },
  status: {
    type: String,
    default: 'active'
  },
  subscription: {
    status: { type: String, default: 'inactive' },
    plan: { type: String, default: 'free' }
  },
  stats: {
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// SIMPLE password hashing - no async middleware
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    try {
      const salt = bcrypt.genSaltSync(10);
      this.password = bcrypt.hashSync(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// SIMPLE password comparison
userSchema.methods.comparePassword = function(candidatePassword) {
  try {
    return bcrypt.compareSync(candidatePassword, this.password);
  } catch (error) {
    console.error('Password compare error:', error);
    return false;
  }
};

// SIMPLE token generation
userSchema.methods.generateAuthTokens = function() {
  try {
    const userData = {
      userId: this._id.toString(),
      email: this.email,
      role: this.role,
      name: this.name
    };
    
    const accessToken = jwtService.generateAccessToken(userData);
    const refreshToken = jwtService.generateRefreshToken(userData);
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
