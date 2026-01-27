import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  userEmail: {
    type: String,
    index: true
  },
  
  userName: {
    type: String
  },
  
  // Generation Configuration
  generationType: {
    type: String,
    enum: ['daily', 'custom', 'quick', 'advanced', 'ai', 'batch', 'premium', 'recurring'],
    required: true,
    index: true
  },
  
  generationMode: {
    type: String,
    enum: ['single', 'multi_sport', 'cross_sport', 'combo'],
    default: 'single'
  },
  
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'All', 'Mixed'],
    required: true,
    index: true
  },
  
  // Detailed Parameters
  parameters: {
    // Selection Configuration
    winnersPerSelection: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    selectionsCount: {
      type: Number,
      default: 2,
      min: 1,
      max: 20
    },
    maxSelectionsPerGeneration: {
      type: Number,
      default: 100
    },
    
    // Confidence & Scoring Filters
    minConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    },
    maxConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    minEdgeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 40
    },
    maxEdgeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    minOddsValue: {
      type: Number,
      default: -200
    },
    maxOddsValue: {
      type: Number,
      default: +500
    },
    
    // Risk & Strategy
    bumpRisk: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high', 'any'],
      default: 'medium'
    },
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    
    // Time & Date Filters
    timeRange: {
      startTime: Date,
      endTime: Date
    },
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    upcomingHours: {
      type: Number,
      default: 24
    },
    
    // Advanced Filters
    minVolume: {
      type: Number,
      default: 1000
    },
    maxVolume: {
      type: Number,
      default: 1000000
    },
    includeInjuries: {
      type: Boolean,
      default: true
    },
    includeWeather: {
      type: Boolean,
      default: true
    },
    includeTrends: {
      type: Boolean,
      default: true
    },
    
    // AI & Customization
    customPrompt: String,
    aiModel: {
      type: String,
      enum: ['gpt4', 'claude', 'gemini', 'custom'],
      default: 'gpt4'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    creativityLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  
  // Generated Selections
  generatedSelections: [{
    selectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Selection'
    },
    selectionData: mongoose.Schema.Types.Mixed,
    confidenceScore: Number,
    edgeScore: Number,
    riskLevel: String,
    odds: mongoose.Schema.Types.Mixed,
    expectedValue: Number,
    rank: Number,
    inclusionReason: String
  }],
  
  // Generation Results & Metrics
  resultMetrics: {
    totalGenerated: {
      type: Number,
      default: 0
    },
    totalFiltered: {
      type: Number,
      default: 0
    },
    avgConfidence: Number,
    avgEdgeScore: Number,
    bestConfidence: Number,
    worstConfidence: Number,
    executionTime: Number,
    memoryUsage: Number
  },
  
  // Performance Tracking
  performanceTracking: {
    selectionsPlaced: Number,
    selectionsWon: Number,
    selectionsLost: Number,
    selectionsPending: Number,
    totalWagered: Number,
    totalWon: Number,
    totalLost: Number,
    netProfit: Number,
    roi: Number,
    bestPick: mongoose.Schema.Types.Mixed,
    worstPick: mongoose.Schema.Types.Mixed
  },
  
  // Status & Progress
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'partial', 'cancelled', 'queued'],
    default: 'pending',
    index: true
  },
  
  progress: {
    current: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 100
    },
    percentage: {
      type: Number,
      default: 0
    },
    stage: {
      type: String,
      enum: ['initializing', 'fetching_data', 'analyzing', 'filtering', 'ranking', 'finalizing', 'complete']
    }
  },
  
  // Error Handling
  error: {
    code: String,
    message: String,
    stackTrace: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetry: Date
  },
  
  // Timing & Duration
  startTime: Date,
  endTime: Date,
  duration: Number,
  estimatedDuration: Number,
  
  // Generation Source & Context
  source: {
    type: String,
    enum: ['web_app', 'mobile_app', 'api', 'cli', 'scheduled', 'manual'],
    default: 'web_app'
  },
  
  sessionId: {
    type: String,
    index: true
  },
  
  requestId: {
    type: String,
    index: true
  },
  
  ipAddress: String,
  userAgent: String,
  
  // Recurring & Batch Configuration
  recurringConfig: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    nextRun: Date,
    lastRun: Date,
    runCount: {
      type: Number,
      default: 0
    }
  },
  
  batchInfo: {
    batchId: String,
    batchSize: Number,
    batchIndex: Number,
    totalBatches: Number
  },
  
  // Notifications & Alerts
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    pushSent: {
      type: Boolean,
      default: false
    },
    emailAddress: String,
    sentAt: Date
  },
  
  // Tags & Categories
  tags: [{
    type: String,
    enum: ['premium', 'featured', 'trending', 'popular', 'test', 'production']
  }],
  
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'pro']
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  dailyReset: {
    type: Boolean,
    default: false
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: Date,
  
  // Expiration (for cleanup)
  expiresAt: {
    type: Date,
    index: true,
    expires: 90 * 24 * 60 * 60 // 90 days in seconds
  }
}, {
  timestamps: true,
  
  // Indexes
  indexes: [
    // Composite indexes for common queries
    { userId: 1, timestamp: -1 },
    { generationType: 1, sport: 1, status: 1 },
    { userId: 1, status: 1, timestamp: -1 },
    { timestamp: -1, sport: 1 },
    
    // Text search index for custom prompts
    { 'parameters.customPrompt': 'text' }
  ],
  
  // Virtuals
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for generation name/description
generationSchema.virtual('generationName').get(function() {
  return `${this.generationType.charAt(0).toUpperCase() + this.generationType.slice(1)} ${this.sport} Generation`;
});

// Virtual for success rate
generationSchema.virtual('successRate').get(function() {
  const perf = this.performanceTracking;
  if (!perf || !perf.selectionsPlaced || perf.selectionsPlaced === 0) return 0;
  return ((perf.selectionsWon || 0) / perf.selectionsPlaced * 100).toFixed(2);
});

// Virtual for isActive
generationSchema.virtual('isActive').get(function() {
  return this.status === 'processing' || this.status === 'queued';
});

// Virtual for duration in human readable format
generationSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return null;
  const seconds = Math.floor(this.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
});

// Pre-save middleware
generationSchema.pre('save', function(next) {
  // Auto-calculate duration if startTime and endTime are set
  if (this.startTime && this.endTime) {
    this.duration = this.endTime - this.startTime;
  }
  
  // Auto-calculate progress percentage
  if (this.progress && this.progress.current && this.progress.total) {
    this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100);
  }
  
  // Set expiresAt for cleanup (90 days from creation)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  
  // Update performance metrics if selections are tracked
  if (this.generatedSelections && this.generatedSelections.length > 0) {
    if (!this.resultMetrics) this.resultMetrics = {};
    this.resultMetrics.totalGenerated = this.generatedSelections.length;
    
    // Calculate average confidence
    const validConfidences = this.generatedSelections
      .filter(s => s.confidenceScore)
      .map(s => s.confidenceScore);
    if (validConfidences.length > 0) {
      this.resultMetrics.avgConfidence = validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length;
    }
  }
  
  next();
});

// Static methods
generationSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId, isDeleted: false })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'email name')
    .populate('generatedSelections.selectionId');
};

generationSchema.statics.getStatsByUser = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        completedGenerations: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pendingGenerations: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        avgDuration: { $avg: '$duration' },
        totalSelectionsGenerated: { $sum: { $size: '$generatedSelections' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalGenerations: 0,
    completedGenerations: 0,
    pendingGenerations: 0,
    avgDuration: 0,
    totalSelectionsGenerated: 0
  };
};

// Instance methods
generationSchema.methods.getSelectionSummary = function() {
  if (!this.generatedSelections || this.generatedSelections.length === 0) {
    return { count: 0, sports: [], avgConfidence: 0 };
  }
  
  const sports = [...new Set(this.generatedSelections.map(s => s.selectionData?.sport))];
  const validConfidences = this.generatedSelections
    .filter(s => s.confidenceScore)
    .map(s => s.confidenceScore);
  const avgConfidence = validConfidences.length > 0 
    ? validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length
    : 0;
  
  return {
    count: this.generatedSelections.length,
    sports: sports.filter(Boolean),
    avgConfidence: Math.round(avgConfidence * 10) / 10
  };
};

generationSchema.methods.markAsCompleted = function(selections = []) {
  this.status = 'completed';
  this.endTime = new Date();
  if (selections.length > 0) {
    this.generatedSelections = selections;
  }
  return this.save();
};

generationSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.endTime = new Date();
  this.error = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error occurred',
    stackTrace: error.stack
  };
  return this.save();
};

// Query helpers
generationSchema.query.byStatus = function(status) {
  return this.where({ status });
};

generationSchema.query.bySport = function(sport) {
  return this.where({ sport });
};

generationSchema.query.byGenerationType = function(type) {
  return this.where({ generationType: type });
};

generationSchema.query.active = function() {
  return this.where({ isDeleted: false });
};

generationSchema.query.recent = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where({ timestamp: { $gte: date } });
};

const Generation = mongoose.model('Generation', generationSchema);

export default Generation;
