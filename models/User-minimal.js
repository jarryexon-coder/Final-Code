import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwtService from '../utils/jwt.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  firstName: { type: String, default: 'User' },
  lastName: { type: String, default: 'User' },
  role: { type: String, default: 'user' }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  if (this.name && (!this.firstName || this.firstName === 'User')) {
    const parts = this.name.split(' ');
    this.firstName = parts[0] || 'User';
    this.lastName = parts.slice(1).join(' ') || 'User';
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
