import mongoose from 'mongoose';

const apiUsageSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  source: { type: String, enum: ['real', 'mock', 'cache', 'fallback'] },
  responseTime: Number,
  statusCode: Number,
  userId: String,
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  indexes: [
    { timestamp: -1 },
    { endpoint: 1, timestamp: -1 },
    { source: 1, timestamp: -1 }
  ]
});

export default mongoose.model('ApiUsage', apiUsageSchema);
