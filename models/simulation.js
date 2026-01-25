import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  // User who ran the simulation
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Selection being simulated (if applicable)
  selectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Selection',
    index: true
  },
  
  // Simulation configuration
  simulationType: {
    type: String,
    enum: [
      'prizepicks_selection',
      'custom_selection',
      'what_if',
      'historical',
      'monte_carlo',
      'scenario',
      'comparison',
      'optimization'
    ],
    required: true,
    default: 'prizepicks_selection',
    index: true
  },
  
  // Sport being simulated
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'MMA', 'Mixed', 'All'],
    required: true,
    index: true
  },
  
  // Simulation parameters
  parameters: {
    // Selection parameters
    selectionType: String, // '3-Winner Parlay', '3-Winner Flex Play', etc.
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    edgeScore: {
      type: Number,
      min: 0,
      max: 10
    },
    bumpRisk: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High']
    },
    
    // Winners configuration
    winners: [{
      player: String,
      playerId: String,
      team: String,
      position: String,
      pick: String, // e.g., 'Over 32.5 Points'
      line: Number,
      type: String, // 'points', 'rebounds', 'assists', 'strikeouts', 'yards', etc.
      odds: String, // e.g., '-145', '+120'
      probability: Number, // 0-100
      edge: Number, // calculated edge
      playerCondition: String // 'active', 'injured', 'questionable'
    }],
    winnersCount: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    
    // Simulation settings
    simulationDuration: {
      type: Number,
      default: 3000, // milliseconds
      min: 1000,
      max: 30000
    },
    iterations: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000
    },
    includeInjuries: {
      type: Boolean,
      default: true
    },
    includeTrends: {
      type: Boolean,
      default: true
    },
    includeWeather: {
      type: Boolean,
      default: false
    },
    includeVegasMovement: {
      type: Boolean,
      default: true
    },
    
    // Advanced settings
    monteCarloEnabled: Boolean,
    confidenceInterval: {
      type: Number,
      default: 95,
      min: 50,
      max: 99
    },
    randomSeed: Number,
    customVariables: mongoose.Schema.Types.Mixed
  },
  
  // Simulation results
  results: {
    // Overall results
    outcome: {
      type: String,
      enum: ['win', 'loss', 'push', 'partial', 'cancelled', 'pending'],
      index: true
    },
    winnersHit: {
      type: Number,
      min: 0,
      max: 10
    },
    totalWinners: {
      type: Number,
      default: 3
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Detailed results per winner
    winnerResults: [{
      player: String,
      pick: String,
      simulatedResult: String, // 'hit', 'miss', 'push'
      actualResult: String, // if available from real games
      difference: Number, // how much over/under the line
      probabilityAchieved: Number, // 0-100
      edgeRealized: Number,
      notes: String
    }],
    
    // Performance metrics
    performance: {
      simulationAccuracy: Number, // 0-100
      confidenceAccuracy: Number, // 0-100
      edgeAccuracy: Number, // 0-100
      totalAccuracy: Number, // 0-100
      calibrationScore: Number, // 0-10
    },
    
    // Statistical analysis
    statistics: {
      expectedValue: Number,
      probabilityOfWin: Number,
      probabilityOfLoss: Number,
      probabilityOfPush: Number,
      averageReturn: Number,
      riskAdjustedReturn: Number,
      sharpeRatio: Number,
      valueAtRisk: Number,
      monteCarloResults: [{
        outcome: String,
        frequency: Number,
        probability: Number
      }]
    },
    
    // Bump risk analysis
    bumpAnalysis: {
      bumpedCount: Number,
      bumpProbability: Number,
      riskLevel: String,
      riskFactors: [String]
    },
    
    // Line movement analysis
    lineAnalysis: {
      openingLine: String,
      closingLine: String,
      lineMovement: String,
      movementImpact: Number
    },
    
    // Simulation metadata
    simulatedAt: Date,
    simulationDuration: Number, // actual duration in ms
    processingTime: Number,
    algorithmVersion: String,
    modelUsed: String
  },
  
  // Real-time updates (if simulating ongoing events)
  realTimeUpdates: [{
    timestamp: Date,
    updateType: String,
    data: mongoose.Schema.Types.Mixed,
    status: String
  }],
  
  // Comparison with actual results (if available)
  actualComparison: {
    actualOutcome: String,
    actualWinnersHit: Number,
    actualSuccessRate: Number,
    comparisonAccuracy: Number,
    notes: String,
    comparedAt: Date
  },
  
  // Simulation status
  status: {
    type: String,
    enum: [
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled',
      'paused',
      'archived'
    ],
    default: 'pending',
    index: true
  },
  
  // Error information (if simulation failed)
  error: {
    code: String,
    message: String,
    stack: String,
    occurredAt: Date
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    index: true
  }],
  
  // Analytics and tracking
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
  },
  
  // Privacy settings
  privacy: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowSharing: {
      type: Boolean,
      default: true
    },
    allowExport: {
      type: Boolean,
      default: true
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable timestamps
  timestamps: true,
  
  // Enable versioning
  versionKey: false,
  
  // Enable strict mode
  strict: true,
  
  // Custom collection name
  collection: 'simulations'
});

// Indexes for common queries
simulationSchema.index({ userId: 1, createdAt: -1 });
simulationSchema.index({ sport: 1, status: 1, createdAt: -1 });
simulationSchema.index({ simulationType: 1, createdAt: -1 });
simulationSchema.index({ 'results.outcome': 1, createdAt: -1 });
simulationSchema.index({ 'parameters.winnersCount': 1, createdAt: -1 });
simulationSchema.index({ status: 1, createdAt: -1 });
simulationSchema.index({ tags: 1, createdAt: -1 });

// Pre-save middleware
simulationSchema.pre('save', function(next) {
  const simulation = this;
  
  // Set startedAt when status changes to running
  if (simulation.isModified('status') && simulation.status === 'running') {
    simulation.startedAt = new Date();
  }
  
  // Set completedAt when status changes to completed
  if (simulation.isModified('status') && simulation.status === 'completed') {
    simulation.completedAt = new Date();
    
    // Calculate simulation duration
    if (simulation.startedAt) {
      simulation.results.simulationDuration = simulation.completedAt - simulation.startedAt;
    }
  }
  
  // Add tags based on simulation characteristics
  if (simulation.isModified('parameters')) {
    simulation.tags = simulation.tags || [];
    
    // Add sport tag
    if (simulation.sport) {
      simulation.tags.push(simulation.sport.toLowerCase());
    }
    
    // Add winner count tag
    simulation.tags.push(`winners_${simulation.parameters.winnersCount}`);
    
    // Add confidence tag
    if (simulation.parameters.confidence) {
      if (simulation.parameters.confidence >= 85) simulation.tags.push('high_confidence');
      else if (simulation.parameters.confidence >= 70) simulation.tags.push('medium_confidence');
      else simulation.tags.push('low_confidence');
    }
    
    // Add edge score tag
    if (simulation.parameters.edgeScore) {
      if (simulation.parameters.edgeScore >= 8) simulation.tags.push('high_edge');
      else if (simulation.parameters.edgeScore >= 6) simulation.tags.push('medium_edge');
      else simulation.tags.push('low_edge');
    }
  }
  
  simulation.updatedAt = new Date();
  next();
});

// Instance methods
simulationSchema.methods.getFormattedResults = function() {
  const simulation = this;
  
  const formatted = {
    id: simulation._id,
    type: simulation.simulationType,
    sport: simulation.sport,
    status: simulation.status,
    createdAt: simulation.createdAt,
    duration: simulation.results?.simulationDuration || 0,
    
    // Summary
    summary: {
      outcome: simulation.results?.outcome || 'pending',
      winnersHit: simulation.results?.winnersHit || 0,
      totalWinners: simulation.results?.totalWinners || 3,
      successRate: simulation.results?.successRate || 0,
      confidence: simulation.parameters?.confidence || 0,
      edgeScore: simulation.parameters?.edgeScore || 0
    },
    
    // Detailed results
    details: simulation.results?.winnerResults || [],
    
    // Performance
    performance: simulation.results?.performance || {},
    
    // Statistics
    statistics: simulation.results?.statistics || {}
  };
  
  return formatted;
};

simulationSchema.methods.isSuccessful = function() {
  const simulation = this;
  return simulation.results?.outcome === 'win' || 
         simulation.results?.successRate >= 70;
};

simulationSchema.methods.getSimulationTime = function() {
  const simulation = this;
  if (simulation.completedAt && simulation.startedAt) {
    return simulation.completedAt - simulation.startedAt;
  }
  return 0;
};

// Static methods
simulationSchema.statics.getUserSimulations = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sport = null,
    type = null,
    status = null,
    outcome = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { userId };
  
  if (sport && sport !== 'all') query.sport = sport;
  if (type && type !== 'all') query.simulationType = type;
  if (status && status !== 'all') query.status = status;
  if (outcome && outcome !== 'all') query['results.outcome'] = outcome;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const simulations = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    simulations,
    pagination: {
      total,
      limit,
      skip,
      hasMore: skip + limit < total
    }
  };
};

simulationSchema.statics.getSimulationStats = async function(userId, timeframe = '30d') {
  const cutoffDate = getCutoffDate(timeframe);
  
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: cutoffDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSimulations: { $sum: 1 },
        successfulSimulations: {
          $sum: {
            $cond: [{ $eq: ['$results.outcome', 'win'] }, 1, 0]
          }
        },
        averageSuccessRate: { $avg: '$results.successRate' },
        averageAccuracy: { $avg: '$results.performance.totalAccuracy' },
        totalDuration: { $sum: '$results.simulationDuration' },
        bySport: {
          $push: {
            sport: '$sport',
            outcome: '$results.outcome',
            successRate: '$results.successRate'
          }
        },
        byType: {
          $push: {
            type: '$simulationType',
            outcome: '$results.outcome',
            successRate: '$results.successRate'
          }
        }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  if (results.length === 0) {
    return {
      totalSimulations: 0,
      successfulSimulations: 0,
      successRate: 0,
      averageAccuracy: 0,
      averageDuration: 0,
      bySport: {},
      byType: {}
    };
  }
  
  const result = results[0];
  
  // Process sport breakdown
  const sportBreakdown = {};
  result.bySport.forEach(item => {
    if (!sportBreakdown[item.sport]) {
      sportBreakdown[item.sport] = { total: 0, wins: 0, totalSuccessRate: 0 };
    }
    sportBreakdown[item.sport].total++;
    if (item.outcome === 'win') sportBreakdown[item.sport].wins++;
    sportBreakdown[item.sport].totalSuccessRate += item.successRate || 0;
  });
  
  // Process type breakdown
  const typeBreakdown = {};
  result.byType.forEach(item => {
    if (!typeBreakdown[item.type]) {
      typeBreakdown[item.type] = { total: 0, wins: 0, totalSuccessRate: 0 };
    }
    typeBreakdown[item.type].total++;
    if (item.outcome === 'win') typeBreakdown[item.type].wins++;
    typeBreakdown[item.type].totalSuccessRate += item.successRate || 0;
  });
  
  return {
    totalSimulations: result.totalSimulations,
    successfulSimulations: result.successfulSimulations,
    successRate: result.totalSimulations > 0 
      ? (result.successfulSimulations / result.totalSimulations) * 100 
      : 0,
    averageAccuracy: result.averageAccuracy || 0,
    averageDuration: result.totalSimulations > 0 
      ? result.totalDuration / result.totalSimulations 
      : 0,
    bySport: Object.entries(sportBreakdown).map(([sport, stats]) => ({
      sport,
      total: stats.total,
      wins: stats.wins,
      successRate: (stats.wins / stats.total) * 100,
      averageSuccessRate: stats.totalSuccessRate / stats.total
    })),
    byType: Object.entries(typeBreakdown).map(([type, stats]) => ({
      type,
      total: stats.total,
      wins: stats.wins,
      successRate: (stats.wins / stats.total) * 100,
      averageSuccessRate: stats.totalSuccessRate / stats.total
    }))
  };
};

simulationSchema.statics.runSimulation = async function(simulationData) {
  const simulation = new this(simulationData);
  simulation.status = 'running';
  
  // Simulate processing (in real app, this would run actual simulation logic)
  await new Promise(resolve => setTimeout(resolve, simulation.parameters.simulationDuration || 3000));
  
  // Generate mock results (in real app, this would calculate actual results)
  const mockResults = generateMockResults(simulation.parameters);
  
  simulation.results = mockResults;
  simulation.status = 'completed';
  
  await simulation.save();
  return simulation;
};

// Virtuals
simulationSchema.virtual('duration').get(function() {
  if (this.completedAt && this.startedAt) {
    return this.completedAt - this.startedAt;
  }
  return 0;
});

simulationSchema.virtual('isHighValue').get(function() {
  return this.parameters?.edgeScore >= 7 && 
         this.parameters?.confidence >= 75 &&
         this.results?.successRate >= 70;
});

simulationSchema.virtual('timeSinceCompletion').get(function() {
  if (!this.completedAt) return null;
  
  const now = new Date();
  const diffMs = now - this.completedAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
});

// Helper functions
function getCutoffDate(timeframe) {
  const now = new Date();
  const cutoff = new Date(now);
  
  switch (timeframe) {
    case '24h':
      cutoff.setHours(now.getHours() - 24);
      break;
    case '7d':
      cutoff.setDate(now.getDate() - 7);
      break;
    case '30d':
      cutoff.setDate(now.getDate() - 30);
      break;
    case '90d':
      cutoff.setDate(now.getDate() - 90);
      break;
    case '1y':
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
    default:
      cutoff.setDate(now.getDate() - 30);
  }
  
  return cutoff;
}

function generateMockResults(parameters) {
  const winnersCount = parameters.winnersCount || 3;
  const confidence = parameters.confidence || 70;
  const edgeScore = parameters.edgeScore || 5;
  
  // Simulate winners based on confidence and edge
  const winnersHit = Math.min(
    winnersCount,
    Math.floor((confidence / 100) * winnersCount * (0.8 + (edgeScore / 50)))
  );
  
  const successRate = (winnersHit / winnersCount) * 100;
  const outcome = successRate >= 66.7 ? 'win' : successRate >= 33.3 ? 'partial' : 'loss';
  
  // Generate individual winner results
  const winnerResults = parameters.winners?.map((winner, index) => {
    const hit = index < winnersHit;
    return {
      player: winner.player,
      pick: winner.pick,
      simulatedResult: hit ? 'hit' : 'miss',
      difference: hit ? 
        (Math.random() * 5 + 1).toFixed(1) : // Positive difference for hits
        -(Math.random() * 5 + 1).toFixed(1), // Negative difference for misses
      probabilityAchieved: hit ? 
        Math.min(100, Math.floor(Math.random() * 30 + 70)) : // 70-100% for hits
        Math.floor(Math.random() * 50), // 0-50% for misses
      edgeRealized: hit ? 
        (Math.random() * 3 + 2).toFixed(1) : // 2-5 edge for hits
        -(Math.random() * 2 + 1).toFixed(1), // -1 to -3 edge for misses
      notes: hit ? 'Successfully hit the line' : 'Missed the line'
    };
  }) || [];
  
  // Calculate performance metrics
  const simulationAccuracy = Math.min(100, successRate * (0.8 + Math.random() * 0.4));
  const confidenceAccuracy = Math.min(100, Math.abs(confidence - successRate));
  const edgeAccuracy = Math.min(100, edgeScore * 10 * (0.7 + Math.random() * 0.6));
  
  return {
    outcome,
    winnersHit,
    totalWinners: winnersCount,
    successRate: parseFloat(successRate.toFixed(2)),
    winnerResults,
    performance: {
      simulationAccuracy: parseFloat(simulationAccuracy.toFixed(2)),
      confidenceAccuracy: parseFloat(confidenceAccuracy.toFixed(2)),
      edgeAccuracy: parseFloat(edgeAccuracy.toFixed(2)),
      totalAccuracy: parseFloat(((simulationAccuracy + confidenceAccuracy + edgeAccuracy) / 3).toFixed(2)),
      calibrationScore: parseFloat((confidenceAccuracy / 10).toFixed(1))
    },
    statistics: {
      expectedValue: parseFloat((successRate / 100 * 2 - 1).toFixed(3)), // Simple EV calculation
      probabilityOfWin: parseFloat((successRate / 100).toFixed(3)),
      probabilityOfLoss: parseFloat(((100 - successRate) / 100).toFixed(3)),
      probabilityOfPush: 0.0,
      averageReturn: parseFloat((successRate / 100 * 1.5).toFixed(3)), // Assuming 1.5x average payout
      riskAdjustedReturn: parseFloat(((successRate / 100 * 1.5) / (1 - successRate / 100)).toFixed(3))
    },
    bumpAnalysis: {
      bumpedCount: Math.floor(Math.random() * 2), // 0 or 1
      bumpProbability: parseFloat((Math.random() * 20).toFixed(2)),
      riskLevel: parameters.bumpRisk || 'Medium',
      riskFactors: ['Line movement', 'Player status changes']
    },
    simulatedAt: new Date(),
    algorithmVersion: '1.2.0',
    modelUsed: 'Monte Carlo Simulation v2'
  };
}

// Create the model
const Simulation = mongoose.model('Simulation', simulationSchema);

export default Simulation;
