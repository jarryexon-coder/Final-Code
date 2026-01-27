// models/User-no-middleware.js
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
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
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

// NO pre-save middleware - we'll handle hashing manually

// Static method to create user with hashed password
userSchema.statics.createUser = async function(userData) {
  // Hash password before creating
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(userData.password, salt);
  
  // Set firstName and lastName from name
  const nameParts = userData.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
  
  const user = new this({
    ...userData,
    password: hashedPassword,
    firstName,
    lastName
  });
  
  return user.save();
};

// Instance method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
