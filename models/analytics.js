// models/analytics.js
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventData: mongoose.Schema.Types.Mixed,
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Index for common queries
analyticsSchema.index({ userId: 1, eventType: 1, 'metadata.timestamp': -1 });
analyticsSchema.index({ 'metadata.timestamp': -1 });

let Analytics;
try {
  Analytics = mongoose.model('Analytics');
} catch {
  Analytics = mongoose.model('Analytics', analyticsSchema);
}

export default Analytics;
