// controllers/bumpRisk.controller.js - FIXED VERSION (duplicate function fixed)
import BumpRisk from '../models/BumpRisk.js';
import Selection from '../models/selection.js';
import Player from '../models/Player.js';
import User from '../models/user.js';

// Get bump risks
export const getBumpRisks = async (req, res) => {
  try {
    const {
      sport = 'all',
      status = 'active',
      severity = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (sport !== 'all') query.sport = sport;
    if (status !== 'all') query.status = status;
    if (severity !== 'all') query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const risks = await BumpRisk.find(query)
      .populate('playerId', 'name position team')
      .populate('createdBy', 'username')
      .sort({ severity: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await BumpRisk.countDocuments(query);

    // Calculate statistics
    const stats = await BumpRisk.aggregate([
      { $match: query },
      {
        $facet: {
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          bySport: [
            { $group: { _id: '$sport', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        risks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { sport, status, severity },
        stats: {
          bySeverity: stats[0]?.bySeverity || [],
          bySport: stats[0]?.bySport || [],
          byStatus: stats[0]?.byStatus || []
        }
      }
    });
  } catch (error) {
    console.error('Get bump risks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bump risks', error: error.message });
  }
};

// Get bump risk by ID
export const getBumpRiskById = async (req, res) => {
  try {
    const { riskId } = req.params;

    const risk = await BumpRisk.findById(riskId)
      .populate('playerId', 'name position team stats')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username')
      .lean();

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Bump risk not found'
      });
    }

    // Get related selections
    const relatedSelections = await Selection.find({
      playerId: risk.playerId,
      createdAt: {
        $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)) // Last 7 days
      }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Get similar risks
    const similarRisks = await BumpRisk.find({
      _id: { $ne: riskId },
      $or: [
        { playerId: risk.playerId },
        { sport: risk.sport },
        { riskType: risk.riskType }
      ]
    })
    .populate('playerId', 'name team')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: {
        risk,
        relatedSelections,
        similarRisks,
        impact: calculateRiskImpact(risk)
      }
    });
  } catch (error) {
    console.error('Get bump risk by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bump risk', error: error.message });
  }
};

// Create bump risk
export const createBumpRisk = async (req, res) => {
  try {
    const {
      playerId,
      sport,
      riskType,
      severity,
      probability,
      impact,
      description,
      evidence,
      mitigation,
      status = 'active'
    } = req.body;

    const userId = req.user.userId || req.user._id;

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Calculate risk score using helper function
    const riskScore = calculateRiskScoreHelper(severity, probability, impact);

    // Create risk
    const risk = new BumpRisk({
      playerId,
      sport,
      riskType,
      severity,
      probability,
      impact,
      riskScore,
      description,
      evidence: evidence || [],
      mitigation: mitigation || [],
      status,
      createdBy: userId,
      updatedBy: userId
    });

    await risk.save();

    // Populate for response
    const populatedRisk = await BumpRisk.findById(risk._id)
      .populate('playerId', 'name position team')
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Bump risk created successfully',
      data: populatedRisk
    });
  } catch (error) {
    console.error('Create bump risk error:', error);
    res.status(500).json({ success: false, message: 'Failed to create bump risk', error: error.message });
  }
};

// Update bump risk
export const updateBumpRisk = async (req, res) => {
  try {
    const { riskId } = req.params;
    const updates = req.body;
    const userId = req.user.userId || req.user._id;

    // Find risk
    const risk = await BumpRisk.findById(riskId);
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Bump risk not found'
      });
    }

    // Recalculate risk score if relevant fields updated
    if (updates.severity || updates.probability || updates.impact) {
      const severity = updates.severity || risk.severity;
      const probability = updates.probability || risk.probability;
      const impact = updates.impact || risk.impact;
      updates.riskScore = calculateRiskScoreHelper(severity, probability, impact);
    }

    // Update risk
    updates.updatedBy = userId;
    updates.updatedAt = new Date();

    const updatedRisk = await BumpRisk.findByIdAndUpdate(
      riskId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('playerId', 'name position team')
    .populate('updatedBy', 'username');

    res.json({
      success: true,
      message: 'Bump risk updated successfully',
      data: updatedRisk
    });
  } catch (error) {
    console.error('Update bump risk error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bump risk', error: error.message });
  }
};

// Delete bump risk
export const deleteBumpRisk = async (req, res) => {
  try {
    const { riskId } = req.params;

    const risk = await BumpRisk.findByIdAndDelete(riskId);

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Bump risk not found'
      });
    }

    res.json({
      success: true,
      message: 'Bump risk deleted successfully'
    });
  } catch (error) {
    console.error('Delete bump risk error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bump risk', error: error.message });
  }
};

// Calculate risk score - Controller version
export const calculateRiskScore = async (req, res) => {
  try {
    const { severity, probability, impact, customWeights } = req.body;

    // Use custom weights if provided, otherwise use defaults
    const weights = customWeights || {
      severity: 0.4,
      probability: 0.3,
      impact: 0.3
    };

    // Normalize inputs (assuming they're on scale 1-10)
    const normalizedSeverity = Math.min(Math.max(severity, 1), 10);
    const normalizedProbability = Math.min(Math.max(probability, 1), 10);
    const normalizedImpact = Math.min(Math.max(impact, 1), 10);

    // Calculate weighted score
    const riskScore = (
      (normalizedSeverity * weights.severity) +
      (normalizedProbability * weights.probability) +
      (normalizedImpact * weights.impact)
    ) * 10; // Scale to 0-100

    // Determine risk level
    const riskLevel = determineRiskLevel(riskScore);

    res.json({
      success: true,
      data: {
        riskScore: Math.round(riskScore),
        riskLevel,
        components: {
          severity: normalizedSeverity,
          probability: normalizedProbability,
          impact: normalizedImpact,
          weights
        },
        interpretation: getRiskInterpretation(riskLevel)
      }
    });
  } catch (error) {
    console.error('Calculate risk score error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate risk score', error: error.message });
  }
};

// Get risk analysis
export const getRiskAnalysis = async (req, res) => {
  try {
    const { timeframe = '30d', sport = 'all', analysisType = 'overview' } = req.query;

    const cutoffDate = new Date();
    if (timeframe === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    const matchStage = { createdAt: { $gte: cutoffDate } };
    if (sport !== 'all') {
      matchStage.sport = sport;
    }

    const analysis = await BumpRisk.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Overall statistics
          summary: [
            {
              $group: {
                _id: null,
                totalRisks: { $sum: 1 },
                averageRiskScore: { $avg: '$riskScore' },
                highRiskCount: {
                  $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] }
                },
                mediumRiskCount: {
                  $sum: { $cond: [
                    { $and: [
                      { $gte: ['$riskScore', 40] },
                      { $lt: ['$riskScore', 70] }
                    ]}, 1, 0
                  ]}
                },
                lowRiskCount: {
                  $sum: { $cond: [{ $lt: ['$riskScore', 40] }, 1, 0] }
                }
              }
            }
          ],

          // By risk type
          byRiskType: [
            { $group: { 
              _id: '$riskType', 
              count: { $sum: 1 },
              avgScore: { $avg: '$riskScore' }
            }},
            { $sort: { count: -1 } }
          ],

          // By severity
          bySeverity: [
            { $group: { 
              _id: '$severity', 
              count: { $sum: 1 }
            }},
            { $sort: { _id: -1 } }
          ],

          // By sport
          bySport: [
            { $group: { 
              _id: '$sport', 
              count: { $sum: 1 },
              avgScore: { $avg: '$riskScore' }
            }},
            { $sort: { count: -1 } }
          ],

          // Temporal analysis
          temporal: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 },
                avgScore: { $avg: '$riskScore' }
              }
            },
            { $sort: { _id: 1 } }
          ],

          // Top risky players
          topRiskyPlayers: [
            {
              $lookup: {
                from: 'players',
                localField: 'playerId',
                foreignField: '_id',
                as: 'player'
              }
            },
            { $unwind: '$player' },
            {
              $group: {
                _id: '$playerId',
                playerName: { $first: '$player.name' },
                team: { $first: '$player.team' },
                riskCount: { $sum: 1 },
                maxRiskScore: { $max: '$riskScore' },
                avgRiskScore: { $avg: '$riskScore' }
              }
            },
            { $sort: { maxRiskScore: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const summary = analysis[0]?.summary[0] || {};
    const byRiskType = analysis[0]?.byRiskType || [];
    const bySeverity = analysis[0]?.bySeverity || [];
    const bySport = analysis[0]?.bySport || [];
    const temporal = analysis[0]?.temporal || [];
    const topRiskyPlayers = analysis[0]?.topRiskyPlayers || [];

    // Calculate risk trends
    const riskTrends = calculateRiskTrends(temporal);

    res.json({
      success: true,
      data: {
        timeframe,
        sport,
        analysisType,
        summary,
        breakdown: { byRiskType, bySeverity, bySport },
        temporal,
        topRiskyPlayers,
        riskTrends,
        recommendations: generateRiskRecommendations(summary, byRiskType, topRiskyPlayers)
      }
    });
  } catch (error) {
    console.error('Get risk analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to get risk analysis', error: error.message });
  }
};

// Get top risks
export const getTopRisks = async (req, res) => {
  try {
    const { limit = 10, minScore = 70, sport = 'all' } = req.query;

    const query = {
      riskScore: { $gte: parseInt(minScore) },
      status: 'active'
    };

    if (sport !== 'all') {
      query.sport = sport;
    }

    const topRisks = await BumpRisk.find(query)
      .populate('playerId', 'name position team stats')
      .sort({ riskScore: -1, updatedAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Calculate impact scores
    const risksWithImpact = topRisks.map(risk => ({
      ...risk,
      impactScore: calculateImpactScore(risk),
      urgency: calculateRiskUrgency(risk)
    }));

    res.json({
      success: true,
      data: {
        topRisks: risksWithImpact,
        threshold: minScore,
        sport,
        summary: {
          count: risksWithImpact.length,
          averageScore: risksWithImpact.reduce((sum, risk) => sum + risk.riskScore, 0) / risksWithImpact.length || 0,
          highestScore: risksWithImpact[0]?.riskScore || 0
        }
      }
    });
  } catch (error) {
    console.error('Get top risks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get top risks', error: error.message });
  }
};

// Get risk trends
export const getRiskTrends = async (req, res) => {
  try {
    const { 
      timeframe = '30d',
      sport = 'all',
      riskType = 'all',
      interval = 'daily'
    } = req.query;

    const cutoffDate = new Date();
    if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else if (timeframe === '90d') {
      cutoffDate.setDate(cutoffDate.getDate() - 90);
    }

    const matchStage = { createdAt: { $gte: cutoffDate } };
    if (sport !== 'all') matchStage.sport = sport;
    if (riskType !== 'all') matchStage.riskType = riskType;

    const format = interval === 'hourly' ? '%Y-%m-%d %H:00' :
                  interval === 'daily' ? '%Y-%m-%d' :
                  interval === 'weekly' ? '%Y-%W' : '%Y-%m';

    const trends = await BumpRisk.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format, date: "$createdAt" }
          },
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' },
          highRiskCount: {
            $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] }
          },
          uniquePlayers: { $addToSet: '$playerId' },
          riskTypes: { $addToSet: '$riskType' }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          avgRiskScore: { $round: ['$avgRiskScore', 2] },
          highRiskCount: 1,
          uniquePlayersCount: { $size: '$uniquePlayers' },
          riskTypeCount: { $size: '$riskTypes' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate trend metrics
    const trendMetrics = calculateTrendMetrics(trends);

    res.json({
      success: true,
      data: {
        timeframe,
        sport,
        riskType,
        interval,
        trends,
        metrics: trendMetrics,
        analysis: analyzeRiskTrends(trends, trendMetrics)
      }
    });
  } catch (error) {
    console.error('Get risk trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to get risk trends', error: error.message });
  }
};

// Helper functions - CHANGED FUNCTION NAME HERE
const calculateRiskScoreHelper = (severity, probability, impact) => {
  // Convert to numerical values if they're strings
  const severityMap = { low: 3, medium: 6, high: 9 };
  const probabilityMap = { low: 3, medium: 6, high: 9 };
  const impactMap = { low: 3, medium: 6, high: 9 };

  const s = typeof severity === 'string' ? severityMap[severity] || 5 : severity;
  const p = typeof probability === 'string' ? probabilityMap[probability] || 5 : probability;
  const i = typeof impact === 'string' ? impactMap[impact] || 5 : impact;

  // Risk score formula: (Severity × Probability × Impact) / 10
  const score = (s * p * i) / 10;
  return Math.min(Math.round(score), 100);
};

const determineRiskLevel = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const getRiskInterpretation = (level) => {
  const interpretations = {
    high: 'Immediate attention required. Significant impact on selections likely.',
    medium: 'Monitor closely. May require action if conditions worsen.',
    low: 'Low priority. Continue normal monitoring.'
  };
  return interpretations[level] || 'Risk level not determined.';
};

const calculateRiskImpact = (risk) => {
  // Calculate potential impact based on risk score and type
  const baseImpact = risk.riskScore / 100;
  let multiplier = 1;

  switch (risk.riskType) {
    case 'injury':
      multiplier = 1.5;
      break;
    case 'performance':
      multiplier = 1.2;
      break;
    case 'matchup':
      multiplier = 1.3;
      break;
    case 'trend':
      multiplier = 1.1;
      break;
    default:
      multiplier = 1;
  }

  return {
    impactScore: baseImpact * multiplier,
    potentialLoss: (baseImpact * multiplier * 100).toFixed(2) + '%',
    recommendation: generateMitigationRecommendation(risk)
  };
};

const generateMitigationRecommendation = (risk) => {
  const recommendations = {
    injury: 'Consider benching player or reducing exposure. Monitor injury reports.',
    performance: 'Reduce stake size. Look for supporting statistics.',
    matchup: 'Adjust expectations based on defensive matchup.',
    trend: 'Consider if trend is sustainable. Look for regression indicators.'
  };

  return recommendations[risk.riskType] || 'Monitor risk factors closely.';
};

const calculateImpactScore = (risk) => {
  // Calculate additional impact metrics
  const recencyWeight = 1 - (Date.now() - new Date(risk.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000);
  const evidenceWeight = Math.min(risk.evidence.length / 5, 1);
  
  return (risk.riskScore * 0.6) + (recencyWeight * 20) + (evidenceWeight * 20);
};

const calculateRiskUrgency = (risk) => {
  const daysSinceUpdate = (Date.now() - new Date(risk.updatedAt).getTime()) / (24 * 60 * 60 * 1000);
  
  if (risk.riskScore >= 80) return 'immediate';
  if (risk.riskScore >= 60 && daysSinceUpdate > 2) return 'urgent';
  if (risk.riskScore >= 40 && daysSinceUpdate > 7) return 'soon';
  return 'monitor';
};

const calculateRiskTrends = (temporalData) => {
  if (temporalData.length < 2) return { trend: 'stable', change: 0 };

  const first = temporalData[0];
  const last = temporalData[temporalData.length - 1];
  
  const countChange = ((last.count - first.count) / first.count) * 100;
  const scoreChange = last.avgRiskScore - first.avgRiskScore;

  let trend = 'stable';
  if (countChange > 10) trend = 'increasing';
  if (countChange < -10) trend = 'decreasing';
  if (Math.abs(countChange) <= 10) trend = 'stable';

  return {
    trend,
    countChange: countChange.toFixed(2),
    scoreChange: scoreChange.toFixed(2),
    volatility: calculateVolatility(temporalData.map(d => d.count))
  };
};

const calculateVolatility = (values) => {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance).toFixed(2);
};

const calculateTrendMetrics = (trends) => {
  if (trends.length === 0) return {};

  const counts = trends.map(t => t.count);
  const scores = trends.map(t => t.avgRiskScore);

  return {
    averageCount: counts.reduce((a, b) => a + b, 0) / counts.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    maxCount: Math.max(...counts),
    minCount: Math.min(...counts),
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    totalRisks: counts.reduce((a, b) => a + b, 0)
  };
};

const analyzeRiskTrends = (trends, metrics) => {
  const analysis = {
    keyFindings: [],
    warnings: [],
    opportunities: []
  };

  // Check for spikes
  const recentCounts = trends.slice(-3).map(t => t.count);
  const recentAvg = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length;
  const overallAvg = metrics.averageCount;

  if (recentAvg > overallAvg * 1.3) {
    analysis.warnings.push('Recent spike in risk count detected');
  }

  // Check trend direction
  if (trends.length >= 5) {
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.count, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) {
      analysis.keyFindings.push('Upward trend in risk volume');
    } else if (secondAvg < firstAvg * 0.8) {
      analysis.keyFindings.push('Downward trend in risk volume');
    }
  }

  // Identify opportunities
  if (metrics.averageScore < 50) {
    analysis.opportunities.push('Overall risk scores are low - good conditions for selections');
  }

  return analysis;
};

const generateRiskRecommendations = (summary, byRiskType, topRiskyPlayers) => {
  const recommendations = [];

  if (summary.highRiskCount > 5) {
    recommendations.push({
      priority: 'high',
      action: 'Review all high-risk players immediately',
      reason: `High number of high-risk players detected: ${summary.highRiskCount}`
    });
  }

  const dominantRiskType = byRiskType[0];
  if (dominantRiskType && dominantRiskType.count > summary.totalRisks * 0.4) {
    recommendations.push({
      priority: 'medium',
      action: `Focus on ${dominantRiskType._id} risk mitigation strategies`,
      reason: `${dominantRiskType._id} risks constitute ${Math.round(dominantRiskType.count / summary.totalRisks * 100)}% of all risks`
    });
  }

  if (topRiskyPlayers.length > 0) {
    const topPlayer = topRiskyPlayers[0];
    if (topPlayer.maxRiskScore > 85) {
      recommendations.push({
        priority: 'critical',
        action: `Immediate action required for ${topPlayer.playerName}`,
        reason: `Highest risk score detected: ${topPlayer.maxRiskScore}`
      });
    }
  }

  return recommendations;
};

// Default export
export default {
  getBumpRisks,
  getBumpRiskById,
  createBumpRisk,
  updateBumpRisk,
  deleteBumpRisk,
  calculateRiskScore,
  getRiskAnalysis,
  getTopRisks,
  getRiskTrends
};
