// controllers/history.controller.js - COMPLETE VERSION
import Selection from '../models/selection.js';
import UserHistory from '../models/UserHistory.js';
import User from '../models/user.js';
import Analytics from '../models/analytics.js';
import { redisClient } from '../config/redis.js';

// Get user history
export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      type = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (type !== 'all') {
      query.type = type;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Determine sort
    const sort = {};
    if (sortBy === 'date') {
      sort.timestamp = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'type') {
      sort.type = sortOrder === 'asc' ? 1 : -1;
      sort.timestamp = -1;
    }

    const history = await UserHistory.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await UserHistory.countDocuments(query);

    // Calculate statistics
    const stats = await UserHistory.aggregate([
      { $match: query },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          recentActivity: [
            { $sort: { timestamp: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userId,
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { type, startDate, endDate },
        stats: {
          byType: stats[0]?.byType || [],
          recentDays: stats[0]?.byDay || [],
          recentActivity: stats[0]?.recentActivity || []
        },
        summary: {
          totalEntries: total,
          firstEntry: total > 0 ? history[history.length - 1]?.timestamp : null,
          lastEntry: total > 0 ? history[0]?.timestamp : null
        }
      }
    });
  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user history', error: error.message });
  }
};

// Get selection history
export const getSelectionHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      sport = 'all',
      result = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      minOdds,
      maxOdds
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (sport !== 'all') query.sport = sport;
    if (result !== 'all') query.result = result;

    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Odds range
    if (minOdds || maxOdds) {
      query.odds = {};
      if (minOdds) query.odds.$gte = parseFloat(minOdds);
      if (maxOdds) query.odds.$lte = parseFloat(maxOdds);
    }

    // Determine sort
    const sort = {};
    if (sortBy === 'date') {
      sort.createdAt = -1;
    } else if (sortBy === 'odds') {
      sort.odds = -1;
    } else if (sortBy === 'units') {
      sort.units = -1;
    }

    const selections = await Selection.find(query)
      .populate('playerId', 'name position team')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Selection.countDocuments(query);

    // Calculate performance metrics
    const performance = await calculateSelectionPerformance(query);

    res.json({
      success: true,
      data: {
        selections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { sport, result, startDate, endDate },
        performance,
        summary: {
          totalSelections: total,
          winRate: performance.winRate,
          totalUnits: performance.totalUnits,
          roi: performance.roi
        }
      }
    });
  } catch (error) {
    console.error('Get selection history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get selection history', error: error.message });
  }
};

// Get betting history
export const getBettingHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      type = 'all',
      status = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId, type: 'bet' };

    if (type !== 'all') {
      query.subType = type;
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const bets = await UserHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await UserHistory.countDocuments(query);

    // Calculate betting statistics
    const stats = await UserHistory.aggregate([
      { $match: { ...query, status: { $in: ['won', 'lost', 'push'] } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalStake: { $sum: '$metadata.stake' },
          totalPayout: { $sum: '$metadata.payout' }
        }
      }
    ]);

    const wonStats = stats.find(s => s._id === 'won') || { count: 0, totalStake: 0, totalPayout: 0 };
    const lostStats = stats.find(s => s._id === 'lost') || { count: 0, totalStake: 0, totalPayout: 0 };
    const pushStats = stats.find(s => s._id === 'push') || { count: 0, totalStake: 0, totalPayout: 0 };

    const totalBets = wonStats.count + lostStats.count + pushStats.count;
    const winRate = totalBets > 0 ? (wonStats.count / totalBets) * 100 : 0;
    const totalStake = wonStats.totalStake + lostStats.totalStake + pushStats.totalStake;
    const totalPayout = wonStats.totalPayout + lostStats.totalPayout + pushStats.totalPayout;
    const profitLoss = totalPayout - totalStake;
    const roi = totalStake > 0 ? (profitLoss / totalStake) * 100 : 0;

    res.json({
      success: true,
      data: {
        bets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { type, status, startDate, endDate },
        stats: {
          totalBets,
          won: wonStats.count,
          lost: lostStats.count,
          push: pushStats.count,
          winRate: winRate.toFixed(2),
          totalStake,
          totalPayout,
          profitLoss,
          roi: roi.toFixed(2)
        },
        summary: {
          bestBet: await findBestBet(userId, startDate, endDate),
          worstBet: await findWorstBet(userId, startDate, endDate),
          averageOdds: await calculateAverageOdds(userId, startDate, endDate)
        }
      }
    });
  } catch (error) {
    console.error('Get betting history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get betting history', error: error.message });
  }
};

// Get activity history
export const getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      eventType = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (eventType !== 'all') {
      query.eventType = eventType;
    }

    if (startDate || endDate) {
      query['metadata.timestamp'] = {};
      if (startDate) query['metadata.timestamp'].$gte = new Date(startDate);
      if (endDate) query['metadata.timestamp'].$lte = new Date(endDate);
    }

    const activities = await Analytics.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Analytics.countDocuments(query);

    // Calculate activity statistics
    const stats = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastActivity: { $max: '$metadata.timestamp' },
          uniqueDays: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$metadata.timestamp" }
            }
          }
        }
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          lastActivity: 1,
          uniqueDays: { $size: '$uniqueDays' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { eventType, startDate, endDate },
        stats,
        summary: {
          totalActivities: total,
          mostFrequentActivity: stats[0] || null,
          activityDays: stats.reduce((sum, stat) => sum + stat.uniqueDays, 0),
          lastActivity: activities[0]?.metadata?.timestamp || null
        }
      }
    });
  } catch (error) {
    console.error('Get activity history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get activity history', error: error.message });
  }
};

// Clear history
export const clearHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { type = 'all', confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm history deletion by setting confirm: true'
      });
    }

    let deletedCount = 0;
    let query = { userId };

    if (type === 'selections') {
      deletedCount = await Selection.deleteMany(query);
    } else if (type === 'activities') {
      deletedCount = await Analytics.deleteMany(query);
    } else if (type === 'user_history') {
      deletedCount = await UserHistory.deleteMany(query);
    } else if (type === 'all') {
      // Delete from all collections
      const [sels, acts, hist] = await Promise.all([
        Selection.deleteMany(query),
        Analytics.deleteMany(query),
        UserHistory.deleteMany(query)
      ]);
      deletedCount = sels.deletedCount + acts.deletedCount + hist.deletedCount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid history type. Must be: selections, activities, user_history, or all'
      });
    }

    // Log the action
    await Analytics.create({
      userId,
      eventType: 'history_cleared',
      eventData: {
        type,
        deletedCount,
        timestamp: new Date()
      },
      metadata: { timestamp: new Date() }
    });

    // Clear cache if exists
    if (redisClient) {
      const cacheKeys = [`history:${userId}:*`, `stats:${userId}:*`];
      for (const pattern of cacheKeys) {
        const keys = await redisClient.keys(pattern);
        for (const key of keys) {
          await redisClient.del(key);
        }
      }
    }

    res.json({
      success: true,
      message: `History cleared successfully`,
      data: {
        type,
        deletedCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear history', error: error.message });
  }
};

// Export history
export const exportHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { 
      format = 'json',
      type = 'all',
      startDate,
      endDate 
    } = req.query;

    const query = { userId };
    
    if (startDate || endDate) {
      const dateField = type === 'selections' ? 'createdAt' : 'timestamp';
      query[dateField] = {};
      if (startDate) query[dateField].$gte = new Date(startDate);
      if (endDate) query[dateField].$lte = new Date(endDate);
    }

    let data = [];
    let filename = '';

    if (type === 'selections' || type === 'all') {
      const selections = await Selection.find(type === 'all' ? query : { ...query })
        .populate('playerId', 'name position team')
        .sort({ createdAt: -1 })
        .lean();
      
      if (type === 'selections') {
        data = selections;
        filename = `selections-export-${Date.now()}`;
      } else {
        data.push(...selections.map(s => ({ type: 'selection', ...s })));
      }
    }

    if (type === 'activities' || type === 'all') {
      const activities = await Analytics.find(type === 'all' ? query : { ...query })
        .sort({ 'metadata.timestamp': -1 })
        .lean();
      
      if (type === 'activities') {
        data = activities;
        filename = `activities-export-${Date.now()}`;
      } else {
        data.push(...activities.map(a => ({ type: 'activity', ...a })));
      }
    }

    if (type === 'user_history' || type === 'all') {
      const userHistory = await UserHistory.find(type === 'all' ? query : { ...query })
        .sort({ timestamp: -1 })
        .lean();
      
      if (type === 'user_history') {
        data = userHistory;
        filename = `user-history-export-${Date.now()}`;
      } else {
        data.push(...userHistory.map(h => ({ type: 'user_history', ...h })));
      }
    }

    if (type === 'all') {
      filename = `complete-history-export-${Date.now()}`;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        type,
        data
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const csvData = convertToCSV(data, type);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use "json" or "csv"'
      });
    }
  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({ success: false, message: 'Failed to export history', error: error.message });
  }
};

// Get historical stats
export const getHistoricalStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { timeframe = 'all', sport = 'all', groupBy = 'month' } = req.query;

    const query = { userId };
    if (sport !== 'all') query.sport = sport;

    // Set date range
    let dateQuery = {};
    if (timeframe === '30d') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      dateQuery = { createdAt: { $gte: cutoffDate } };
    } else if (timeframe === '90d') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      dateQuery = { createdAt: { $gte: cutoffDate } };
    } else if (timeframe === 'year') {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      dateQuery = { createdAt: { $gte: cutoffDate } };
    }

    const selectionQuery = { ...query, ...dateQuery };
    const format = groupBy === 'day' ? '%Y-%m-%d' :
                  groupBy === 'week' ? '%Y-%W' : '%Y-%m';

    const historicalStats = await Selection.aggregate([
      { $match: selectionQuery },
      {
        $group: {
          _id: {
            $dateToString: { format, date: "$createdAt" }
          },
          totalSelections: { $sum: 1 },
          wins: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losses: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          pushes: {
            $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] }
          },
          totalUnits: { $sum: '$units' },
          avgOdds: { $avg: '$odds' },
          totalRisked: {
            $sum: {
              $cond: [
                { $in: ['$result', ['win', 'loss', 'push']] },
                '$units',
                0
              ]
            }
          },
          totalReturned: {
            $sum: {
              $cond: [
                { $eq: ['$result', 'win'] },
                {
                  $multiply: [
                    '$units',
                    { $cond: [{ $gt: ['$odds', 0] }, { $divide: ['$odds', 100] }, { $divide: [100, { $abs: '$odds' }] }] }
                  ]
                },
                { $cond: [{ $eq: ['$result', 'push'] }, '$units', 0] }
              ]
            }
          }
        }
      },
      {
        $project: {
          period: '$_id',
          totalSelections: 1,
          wins: 1,
          losses: 1,
          pushes: 1,
          winRate: {
            $cond: [
              { $gt: ['$totalSelections', 0] },
              { $multiply: [{ $divide: ['$wins', '$totalSelections'] }, 100] },
              0
            ]
          },
          totalUnits: 1,
          avgOdds: { $round: ['$avgOdds', 2] },
          profitLoss: { $subtract: ['$totalReturned', '$totalRisked'] },
          roi: {
            $cond: [
              { $gt: ['$totalRisked', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalReturned', '$totalRisked'] }, '$totalRisked'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { period: 1 } }
    ]);

    // Calculate overall summary
    const summary = historicalStats.reduce((acc, period) => ({
      totalSelections: acc.totalSelections + period.totalSelections,
      totalWins: acc.totalWins + period.wins,
      totalLosses: acc.totalLosses + period.losses,
      totalPushes: acc.totalPushes + period.pushes,
      totalUnits: acc.totalUnits + period.totalUnits,
      totalProfitLoss: acc.totalProfitLoss + period.profitLoss,
      totalRisked: acc.totalRisked + (period.totalSelections * 1) // Assuming 1 unit per selection
    }), {
      totalSelections: 0,
      totalWins: 0,
      totalLosses: 0,
      totalPushes: 0,
      totalUnits: 0,
      totalProfitLoss: 0,
      totalRisked: 0
    });

    summary.winRate = summary.totalSelections > 0 ? 
      (summary.totalWins / summary.totalSelections * 100).toFixed(2) : 0;
    summary.roi = summary.totalRisked > 0 ?
      (summary.totalProfitLoss / summary.totalRisked * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        timeframe,
        sport,
        groupBy,
        historicalStats,
        summary,
        trends: analyzeHistoricalTrends(historicalStats),
        insights: generateHistoricalInsights(historicalStats, summary)
      }
    });
  } catch (error) {
    console.error('Get historical stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get historical stats', error: error.message });
  }
};

// Get trend history
export const getTrendHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { 
      metric = 'winRate',
      timeframe = '90d',
      sport = 'all',
      movingAverage = 7 
    } = req.query;

    const cutoffDate = new Date();
    if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else if (timeframe === '90d') {
      cutoffDate.setDate(cutoffDate.getDate() - 90);
    } else if (timeframe === '180d') {
      cutoffDate.setDate(cutoffDate.getDate() - 180);
    }

    const query = { 
      userId, 
      createdAt: { $gte: cutoffDate } 
    };
    if (sport !== 'all') query.sport = sport;

    const dailyStats = await Selection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          totalSelections: { $sum: 1 },
          wins: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losses: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          pushes: {
            $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] }
          },
          totalUnits: { $sum: '$units' },
          avgOdds: { $avg: '$odds' }
        }
      },
      {
        $project: {
          date: 1,
          totalSelections: 1,
          winRate: {
            $cond: [
              { $gt: ['$totalSelections', 0] },
              { $multiply: [{ $divide: ['$wins', '$totalSelections'] }, 100] },
              0
            ]
          },
          units: '$totalUnits',
          avgOdds: { $round: ['$avgOdds', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate moving average
    const trendData = dailyStats.map((stat, index, array) => {
      const start = Math.max(0, index - movingAverage + 1);
      const slice = array.slice(start, index + 1);
      
      let movingAvg = 0;
      if (metric === 'winRate') {
        const totalSelections = slice.reduce((sum, s) => sum + s.totalSelections, 0);
        const totalWins = slice.reduce((sum, s) => sum + (s.winRate * s.totalSelections / 100), 0);
        movingAvg = totalSelections > 0 ? (totalWins / totalSelections * 100) : 0;
      } else if (metric === 'units') {
        movingAvg = slice.reduce((sum, s) => sum + s.units, 0) / slice.length;
      } else if (metric === 'volume') {
        movingAvg = slice.reduce((sum, s) => sum + s.totalSelections, 0) / slice.length;
      }

      return {
        ...stat,
        movingAverage: parseFloat(movingAvg.toFixed(2)),
        trend: calculateDailyTrend(stat, index > 0 ? array[index - 1] : null, metric)
      };
    });

    // Calculate overall trend
    const overallTrend = calculateOverallTrend(trendData, metric);

    res.json({
      success: true,
      data: {
        metric,
        timeframe,
        sport,
        movingAverage,
        trendData,
        overallTrend,
        analysis: analyzeTrends(trendData, overallTrend),
        predictions: predictFutureTrend(trendData, metric)
      }
    });
  } catch (error) {
    console.error('Get trend history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trend history', error: error.message });
  }
};

// Get performance history
export const getPerformanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { 
      compareWith = 'none',
      benchmark = '50%',
      timeframe = 'all',
      detailed = false 
    } = req.query;

    const query = { userId };
    let dateQuery = {};

    if (timeframe === '30d') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      dateQuery = { createdAt: { $gte: cutoffDate } };
    } else if (timeframe === '90d') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      dateQuery = { createdAt: { $gte: cutoffDate } };
    }

    // Get user performance
    const userPerformance = await calculatePerformanceMetrics({ ...query, ...dateQuery });

    let comparison = null;
    if (compareWith !== 'none') {
      // Get comparison data (could be other users, sports, etc.)
      comparison = await getComparisonData(compareWith, dateQuery);
    }

    // Get benchmark data
    const benchmarkData = getBenchmarkData(benchmark);

    // Calculate performance against benchmark
    const performanceAnalysis = analyzePerformance(
      userPerformance, 
      comparison, 
      benchmarkData
    );

    res.json({
      success: true,
      data: {
        timeframe,
        userPerformance,
        comparison,
        benchmark: benchmarkData,
        analysis: performanceAnalysis,
        detailed: detailed ? await getDetailedPerformance(query, dateQuery) : null,
        recommendations: generatePerformanceRecommendations(performanceAnalysis)
      }
    });
  } catch (error) {
    console.error('Get performance history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get performance history', error: error.message });
  }
};

// Helper functions
const calculateSelectionPerformance = async (query) => {
  const stats = await Selection.aggregate([
    { $match: { ...query, result: { $in: ['win', 'loss', 'push'] } } },
    {
      $group: {
        _id: null,
        totalSelections: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
        pushes: { $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] } },
        totalUnits: { $sum: '$units' },
        totalRisked: {
          $sum: {
            $cond: [
              { $in: ['$result', ['win', 'loss', 'push']] },
              '$units',
              0
            ]
          }
        },
        totalReturned: {
          $sum: {
            $cond: [
              { $eq: ['$result', 'win'] },
              {
                $multiply: [
                  '$units',
                  { $cond: [{ $gt: ['$odds', 0] }, { $divide: ['$odds', 100] }, { $divide: [100, { $abs: '$odds' }] }] }
                ]
              },
              { $cond: [{ $eq: ['$result', 'push'] }, '$units', 0] }
            ]
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalSelections: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      totalUnits: 0,
      roi: 0,
      profitLoss: 0
    };
  }

  const stat = stats[0];
  const winRate = stat.totalSelections > 0 ? 
    (stat.wins / stat.totalSelections * 100).toFixed(2) : 0;
  const profitLoss = stat.totalReturned - stat.totalRisked;
  const roi = stat.totalRisked > 0 ? 
    (profitLoss / stat.totalRisked * 100).toFixed(2) : 0;

  return {
    totalSelections: stat.totalSelections,
    wins: stat.wins,
    losses: stat.losses,
    pushes: stat.pushes,
    winRate: parseFloat(winRate),
    totalUnits: stat.totalUnits,
    roi: parseFloat(roi),
    profitLoss: profitLoss
  };
};

const findBestBet = async (userId, startDate, endDate) => {
  const query = { 
    userId, 
    type: 'bet', 
    status: 'won' 
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const bestBet = await UserHistory.findOne(query)
    .sort({ 'metadata.payout': -1 })
    .lean();

  return bestBet;
};

const findWorstBet = async (userId, startDate, endDate) => {
  const query = { 
    userId, 
    type: 'bet', 
    status: 'lost' 
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const worstBet = await UserHistory.findOne(query)
    .sort({ 'metadata.stake': -1 })
    .lean();

  return worstBet;
};

const calculateAverageOdds = async (userId, startDate, endDate) => {
  const query = { 
    userId, 
    type: 'bet' 
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const avgOdds = await UserHistory.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgOdds: { $avg: '$metadata.odds' }
      }
    }
  ]);

  return avgOdds.length > 0 ? avgOdds[0].avgOdds.toFixed(2) : 0;
};

const convertToCSV = (data, type) => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'object' ? JSON.stringify(value).replace(/"/g, '""') : value
    ).join(',')
  );

  return [headers, ...rows].join('\n');
};

const analyzeHistoricalTrends = (historicalStats) => {
  if (historicalStats.length < 2) return { trend: 'insufficient data' };

  const firstPeriod = historicalStats[0];
  const lastPeriod = historicalStats[historicalStats.length - 1];

  const winRateChange = lastPeriod.winRate - firstPeriod.winRate;
  const volumeChange = ((lastPeriod.totalSelections - firstPeriod.totalSelections) / firstPeriod.totalSelections) * 100;
  const roiChange = lastPeriod.roi - firstPeriod.roi;

  return {
    winRate: {
      change: winRateChange.toFixed(2),
      direction: winRateChange > 0 ? 'improving' : 'declining',
      significance: Math.abs(winRateChange) > 5 ? 'significant' : 'minor'
    },
    volume: {
      change: volumeChange.toFixed(2),
      direction: volumeChange > 0 ? 'increasing' : 'decreasing',
      significance: Math.abs(volumeChange) > 20 ? 'significant' : 'minor'
    },
    roi: {
      change: roiChange.toFixed(2),
      direction: roiChange > 0 ? 'improving' : 'declining',
      significance: Math.abs(roiChange) > 10 ? 'significant' : 'minor'
    }
  };
};

const generateHistoricalInsights = (historicalStats, summary) => {
  const insights = [];

  if (summary.winRate > 55) {
    insights.push(`Strong win rate of ${summary.winRate}% exceeds typical benchmarks`);
  } else if (summary.winRate < 45) {
    insights.push(`Win rate of ${summary.winRate}% suggests need for strategy adjustment`);
  }

  if (summary.roi > 10) {
    insights.push(`Excellent ROI of ${summary.roi}% indicates profitable strategy`);
  } else if (summary.roi < -5) {
    insights.push(`Negative ROI of ${summary.roi}% suggests reevaluation needed`);
  }

  // Check for consistency
  if (historicalStats.length >= 3) {
    const winRates = historicalStats.map(s => s.winRate);
    const variance = calculateVariance(winRates);
    
    if (variance < 100) {
      insights.push('Consistent performance across periods');
    } else {
      insights.push('High variance in performance - consider stabilizing strategy');
    }
  }

  return insights;
};

const calculateVariance = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return variance;
};

const calculateDailyTrend = (current, previous, metric) => {
  if (!previous) return 'neutral';

  let currentValue, previousValue;

  if (metric === 'winRate') {
    currentValue = current.winRate;
    previousValue = previous.winRate;
  } else if (metric === 'units') {
    currentValue = current.units;
    previousValue = previous.units;
  } else if (metric === 'volume') {
    currentValue = current.totalSelections;
    previousValue = previous.totalSelections;
  }

  if (currentValue > previousValue * 1.1) return 'up';
  if (currentValue < previousValue * 0.9) return 'down';
  return 'neutral';
};

const calculateOverallTrend = (trendData, metric) => {
  if (trendData.length < 5) return { trend: 'insufficient data', strength: 'weak' };

  const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
  const secondHalf = trendData.slice(Math.floor(trendData.length / 2));

  let firstAvg, secondAvg;

  if (metric === 'winRate') {
    const firstTotal = firstHalf.reduce((sum, d) => sum + (d.winRate * d.totalSelections / 100), 0);
    const firstCount = firstHalf.reduce((sum, d) => sum + d.totalSelections, 0);
    firstAvg = firstCount > 0 ? (firstTotal / firstCount * 100) : 0;

    const secondTotal = secondHalf.reduce((sum, d) => sum + (d.winRate * d.totalSelections / 100), 0);
    const secondCount = secondHalf.reduce((sum, d) => sum + d.totalSelections, 0);
    secondAvg = secondCount > 0 ? (secondTotal / secondCount * 100) : 0;
  } else if (metric === 'units') {
    firstAvg = firstHalf.reduce((sum, d) => sum + d.units, 0) / firstHalf.length;
    secondAvg = secondHalf.reduce((sum, d) => sum + d.units, 0) / secondHalf.length;
  } else if (metric === 'volume') {
    firstAvg = firstHalf.reduce((sum, d) => sum + d.totalSelections, 0) / firstHalf.length;
    secondAvg = secondHalf.reduce((sum, d) => sum + d.totalSelections, 0) / secondHalf.length;
  }

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  let trend = 'stable';
  if (change > 10) trend = 'up';
  if (change < -10) trend = 'down';

  const strength = Math.abs(change) > 20 ? 'strong' : 
                   Math.abs(change) > 5 ? 'moderate' : 'weak';

  return {
    trend,
    strength,
    change: change.toFixed(2),
    firstHalfAvg: firstAvg.toFixed(2),
    secondHalfAvg: secondAvg.toFixed(2)
  };
};

const analyzeTrends = (trendData, overallTrend) => {
  const analysis = {
    keyFindings: [],
    warnings: [],
    opportunities: []
  };

  // Check for recent performance
  const recent = trendData.slice(-3);
  const recentAvg = recent.reduce((sum, d) => sum + d.winRate, 0) / recent.length;
  
  if (recentAvg > 60) {
    analysis.keyFindings.push('Strong recent performance');
  } else if (recentAvg < 40) {
    analysis.warnings.push('Poor recent performance - consider adjustments');
  }

  // Check for volume trends
  const volumeTrend = trendData.slice(-7).map(d => d.totalSelections);
  const avgVolume = volumeTrend.reduce((sum, v) => sum + v, 0) / volumeTrend.length;
  
  if (avgVolume > 10) {
    analysis.keyFindings.push('High selection volume maintained');
  } else if (avgVolume < 3) {
    analysis.warnings.push('Low selection volume - consider increasing activity');
  }

  // Identify opportunities
  if (overallTrend.trend === 'up' && overallTrend.strength === 'strong') {
    analysis.opportunities.push('Strong upward trend - consider increasing stakes');
  }

  return analysis;
};

const predictFutureTrend = (trendData, metric) => {
  if (trendData.length < 7) return { prediction: 'insufficient data', confidence: 0 };

  // Simple linear regression for prediction
  const x = trendData.map((_, i) => i);
  const y = trendData.map(d => 
    metric === 'winRate' ? d.winRate :
    metric === 'units' ? d.units :
    d.totalSelections
  );

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next 3 periods
  const predictions = [];
  for (let i = n; i < n + 3; i++) {
    predictions.push(slope * i + intercept);
  }

  // Calculate confidence (R-squared)
  const yMean = sumY / n;
  const ssTot = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
  const ssRes = y.reduce((a, b, i) => a + Math.pow(b - (slope * x[i] + intercept), 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  const confidence = Math.max(0, Math.min(100, r2 * 100));

  return {
    predictions: predictions.map(p => p.toFixed(2)),
    confidence: confidence.toFixed(2),
    direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
    strength: Math.abs(slope) > 1 ? 'strong' : Math.abs(slope) > 0.5 ? 'moderate' : 'weak'
  };
};

const calculatePerformanceMetrics = async (query) => {
  const metrics = await Selection.aggregate([
    { $match: query },
    {
      $facet: {
        basic: [
          {
            $group: {
              _id: null,
              totalSelections: { $sum: 1 },
              wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
              losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
              pushes: { $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] } },
              totalUnits: { $sum: '$units' }
            }
          }
        ],
        bySport: [
          { $group: { 
            _id: '$sport', 
            count: { $sum: 1 },
            wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } }
          }},
          { $sort: { count: -1 } }
        ],
        byResult: [
          { $group: { 
            _id: '$result', 
            count: { $sum: 1 },
            avgOdds: { $avg: '$odds' }
          }}
        ],
        streaks: [
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: null,
              selections: { $push: '$$ROOT' }
            }
          },
          {
            $project: {
              winStreak: calculateStreak('$selections', 'win'),
              lossStreak: calculateStreak('$selections', 'loss')
            }
          }
        ]
      }
    }
  ]);

  const basic = metrics[0]?.basic[0] || {};
  const bySport = metrics[0]?.bySport || [];
  const byResult = metrics[0]?.byResult || [];
  const streaks = metrics[0]?.streaks[0] || {};

  const winRate = basic.totalSelections > 0 ? 
    (basic.wins / basic.totalSelections * 100).toFixed(2) : 0;

  // Calculate ROI (simplified)
  const roi = calculateSimplifiedROI(query);

  return {
    ...basic,
    winRate: parseFloat(winRate),
    roi: roi.toFixed(2),
    bySport,
    byResult,
    streaks,
    consistency: calculateConsistencyScore(bySport, basic.winRate)
  };
};

const calculateStreak = (selections, resultType) => {
  // This would be calculated in application code
  return { current: 0, longest: 0 };
};

const calculateSimplifiedROI = async (query) => {
  const roiData = await Selection.aggregate([
    { $match: { ...query, result: { $in: ['win', 'loss', 'push'] } } },
    {
      $group: {
        _id: null,
        totalRisked: { $sum: '$units' },
        totalReturned: {
          $sum: {
            $cond: [
              { $eq: ['$result', 'win'] },
              {
                $multiply: [
                  '$units',
                  { $cond: [{ $gt: ['$odds', 0] }, { $divide: ['$odds', 100] }, { $divide: [100, { $abs: '$odds' }] }] }
                ]
              },
              { $cond: [{ $eq: ['$result', 'push'] }, '$units', 0] }
            ]
          }
        }
      }
    }
  ]);

  if (roiData.length === 0) return 0;

  const data = roiData[0];
  return data.totalRisked > 0 ? 
    ((data.totalReturned - data.totalRisked) / data.totalRisked * 100) : 0;
};

const calculateConsistencyScore = (bySport, overallWinRate) => {
  if (bySport.length === 0) return 0;

  let consistency = 100;
  bySport.forEach(sport => {
    const sportWinRate = (sport.wins / sport.count * 100);
    const deviation = Math.abs(sportWinRate - overallWinRate);
    consistency -= deviation;
  });

  return Math.max(0, consistency / bySport.length);
};

const getComparisonData = async (compareWith, dateQuery) => {
  // Implement comparison logic based on compareWith parameter
  // This could compare with other users, platform averages, etc.
  
  // For now, return simulated data
  return {
    type: compareWith,
    avgWinRate: 52.5,
    avgVolume: 8.2,
    avgROI: 5.8,
    topPercentile: 65.3
  };
};

const getBenchmarkData = (benchmark) => {
  const benchmarks = {
    '50%': { winRate: 50, roi: 0 },
    '55%': { winRate: 55, roi: 5 },
    '60%': { winRate: 60, roi: 10 },
    'professional': { winRate: 58, roi: 8 }
  };

  return benchmarks[benchmark] || benchmarks['50%'];
};

const analyzePerformance = (userPerformance, comparison, benchmark) => {
  const analysis = {
    vsBenchmark: {
      winRate: userPerformance.winRate - benchmark.winRate,
      roi: parseFloat(userPerformance.roi) - benchmark.roi,
      meetsBenchmark: userPerformance.winRate >= benchmark.winRate && 
                     parseFloat(userPerformance.roi) >= benchmark.roi
    },
    strengths: [],
    weaknesses: [],
    recommendations: []
  };

  // Analyze vs benchmark
  if (userPerformance.winRate > benchmark.winRate) {
    analysis.strengths.push(`Win rate (${userPerformance.winRate}%) exceeds benchmark (${benchmark.winRate}%)`);
  } else if (userPerformance.winRate < benchmark.winRate) {
    analysis.weaknesses.push(`Win rate (${userPerformance.winRate}%) below benchmark (${benchmark.winRate}%)`);
  }

  if (parseFloat(userPerformance.roi) > benchmark.roi) {
    analysis.strengths.push(`ROI (${userPerformance.roi}%) exceeds benchmark (${benchmark.roi}%)`);
  } else if (parseFloat(userPerformance.roi) < benchmark.roi) {
    analysis.weaknesses.push(`ROI (${userPerformance.roi}%) below benchmark (${benchmark.roi}%)`);
  }

  // Analyze consistency
  if (userPerformance.consistency > 80) {
    analysis.strengths.push('High consistency across sports');
  } else if (userPerformance.consistency < 60) {
    analysis.weaknesses.push('Low consistency - performance varies significantly');
  }

  // Generate recommendations
  if (analysis.weaknesses.length > 0) {
    analysis.recommendations.push(
      'Focus on improving consistency across different sports',
      'Review losing selections to identify patterns',
      'Consider reducing volume and focusing on higher confidence picks'
    );
  }

  if (analysis.strengths.length > 0 && userPerformance.totalSelections > 50) {
    analysis.recommendations.push(
      'Strong performance suggests potential for increased stakes',
      'Consider expanding to additional sports or bet types',
      'Document successful strategies for future reference'
    );
  }

  return analysis;
};

const getDetailedPerformance = async (query, dateQuery) => {
  const detailed = await Selection.aggregate([
    { $match: { ...query, ...dateQuery } },
    {
      $group: {
        _id: {
          sport: '$sport',
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        },
        selections: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
        avgOdds: { $avg: '$odds' },
        totalUnits: { $sum: '$units' }
      }
    },
    {
      $project: {
        sport: '$_id.sport',
        month: '$_id.month',
        selections: 1,
        winRate: { $multiply: [{ $divide: ['$wins', '$selections'] }, 100] },
        avgOdds: { $round: ['$avgOdds', 2] },
        totalUnits: 1
      }
    },
    { $sort: { sport: 1, month: 1 } }
  ]);

  return detailed;
};

const generatePerformanceRecommendations = (analysis) => {
  const recommendations = [];

  if (!analysis.vsBenchmark.meetsBenchmark) {
    recommendations.push({
      priority: 'high',
      action: 'Review and adjust selection strategy',
      reason: 'Performance below benchmark targets'
    });
  }

  if (analysis.weaknesses.includes('Low consistency')) {
    recommendations.push({
      priority: 'medium',
      action: 'Focus on specific sports or bet types',
      reason: 'Improve consistency by specializing'
    });
  }

  if (analysis.strengths.length >= 2) {
    recommendations.push({
      priority: 'low',
      action: 'Consider mentoring or sharing strategies',
      reason: 'Strong performance could help others'
    });
  }

  return recommendations;
};

// Default export
export default {
  getUserHistory,
  getSelectionHistory,
  getBettingHistory,
  getActivityHistory,
  clearHistory,
  exportHistory,
  getHistoricalStats,
  getTrendHistory,
  getPerformanceHistory
};
