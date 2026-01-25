// models/BumpRisk.js
import mongoose from 'mongoose';

const bumpRiskSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'PGA', 'Tennis', 'Soccer']
  },
  riskType: {
    type: String,
    required: true,
    enum: ['injury', 'performance', 'matchup', 'trend', 'schedule', 'personal', 'other']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  evidence: [{
    type: String
  }],
  mitigation: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'monitoring', 'false_positive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
bumpRiskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-calculate risk score
  if (this.isModified('severity') || this.isModified('probability') || this.isModified('impact')) {
    const severityScore = { low: 25, medium: 50, high: 75, critical: 100 }[this.severity] || 50;
    const impactScore = { low: 25, medium: 50, high: 75 }[this.impact] || 50;
    
    this.riskScore = (severityScore * 0.4) + (this.probability * 0.3) + (impactScore * 0.3);
  }
  
  next();
});

const BumpRisk = mongoose.model('BumpRisk', bumpRiskSchema);

export default BumpRisk;
