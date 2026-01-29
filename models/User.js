// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'premium'] },
  avatar: String,
  fantasyTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FantasyTeam' }],
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
  stats: {
    predictions: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    wins: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
