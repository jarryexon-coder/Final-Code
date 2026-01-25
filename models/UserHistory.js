// models/UserHistory.js
import mongoose from 'mongoose';

const userHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['selection', 'bet', 'deposit', 'withdrawal', 'login', 'logout', 'profile_update', 'preference_change', 'subscription_change']
  },
  subType: {
    type: String
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'won', 'lost', 'push'],
    default: 'completed'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const UserHistory = mongoose.model('UserHistory', userHistorySchema);

export default UserHistory;
