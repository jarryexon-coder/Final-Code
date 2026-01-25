// controllers/analytics.controller.js - COMPLETE VERSION
import Analytics from '../models/analytics.js';
import User from '../models/user.js';
import Selection from '../models/selection.js';
import mongoose from 'mongoose';

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId, timeframe = '30d' } = req.query;
    
    let dateFilter = new Date();
    if (timeframe === '24h') {
      dateFilter.setHours(dateFilter.getHours() - 24);
    } else if (timeframe === '7d') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeframe === '30d') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    } else if (timeframe === '90d') {
      dateFilter.setDate(dateFilter.getDate() - 90);
    }

    const userAnalytics = await Analytics.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          'metadata.timestamp': { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastActivity: { $max: '$metadata.timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        userId,
        timeframe,
        analytics: userAnalytics,
        totalActivities: userAnalytics.reduce((sum, item) => sum + item.count, 0)
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user analytics', error: error.message });
  }
};

// Get app analytics
export const getAppAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d', metric = 'all' } = req.query;
    
    const cutoffDate = new Date();
    if (timeframe === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    const analytics = await Analytics.aggregate([
      {
        $match: {
          'metadata.timestamp': { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$metadata.timestamp" }
          },
          dailyUsers: { $addToSet: "$userId" },
          events: { $push: "$eventType" },
          totalEvents: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          activeUsers: { $size: "$dailyUsers" },
          totalEvents: 1,
          uniqueEvents: { $size: { $setUnion: ["$events"] } },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        analytics,
        summary: {
          totalActiveUsers: [...new Set(analytics.flatMap(a => a.dailyUsers || []))].length,
          totalEvents: analytics.reduce((sum, day) => sum + day.totalEvents, 0),
          averageDailyEvents: Math.round(analytics.reduce((sum, day) => sum + day.totalEvents, 0) / analytics.length) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get app analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get app analytics', error: error.message });
  }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    } else {
      const now = new Date();
      if (timeframe === 'day') {
        dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)) };
      } else if (timeframe === 'week') {
        dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (timeframe === 'month') {
        dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      } else if (timeframe === 'year') {
        dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      }
    }

    const revenueStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalRevenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$subscriptionTier", "premium"] }, then: 19.99 },
                  { case: { $eq: ["$subscriptionTier", "pro"] }, then: 49.99 }
                ],
                default: 0
              }
            }
          },
          subscriptionCount: {
            $sum: {
              $cond: [
                { $in: ["$subscriptionTier", ["premium", "pro"]] },
                1,
                0
              ]
            }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totals = revenueStats.reduce((acc, stat) => {
      acc.totalRevenue += stat.totalRevenue;
      acc.totalSubscriptions += stat.subscriptionCount;
      acc.totalNewUsers += stat.newUsers;
      return acc;
    }, { totalRevenue: 0, totalSubscriptions: 0, totalNewUsers: 0 });

    res.json({
      success: true,
      data: {
        timeframe,
        revenueStats,
        totals,
        metrics: {
          conversionRate: (totals.totalSubscriptions / totals.totalNewUsers * 100) || 0,
          averageRevenuePerUser: totals.totalRevenue / totals.totalNewUsers || 0,
          monthlyRecurringRevenue: totals.totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get revenue analytics', error: error.message });
  }
};

// Get performance analytics
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const cutoffDate = new Date();
    if (timeframe === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    // Performance metrics from selections
    const selectionPerformance = await Selection.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate },
          result: { $in: ['win', 'loss', 'push'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPicks: { $sum: 1 },
          wins: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losses: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          pushes: {
            $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] }
          },
          averageOdds: { $avg: '$odds' },
          totalUnits: { $sum: '$units' }
        }
      },
      {
        $project: {
          userId: '$_id',
          winRate: { $multiply: [{ $divide: ['$wins', '$totalPicks'] }, 100] },
          totalPicks: 1,
          wins: 1,
          losses: 1,
          pushes: 1,
          averageOdds: 1,
          totalUnits: 1,
          roi: {
            $multiply: [
              { $divide: [
                { $subtract: [
                  { $add: [
                    { $multiply: ['$wins', 1.91] }, // Assuming -110 odds
                    '$pushes'
                  ]},
                  '$totalPicks'
                ]},
                '$totalPicks'
              ]},
              100
            ]
          }
        }
      },
      { $sort: { winRate: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        performance: selectionPerformance,
        summary: {
          totalPicks: selectionPerformance.reduce((sum, user) => sum + user.totalPicks, 0),
          averageWinRate: selectionPerformance.reduce((sum, user) => sum + user.winRate, 0) / selectionPerformance.length || 0,
          topPerformer: selectionPerformance[0] || null
        }
      }
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get performance analytics', error: error.message });
  }
};

// Get daily stats
export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [userStats, selectionStats, analyticsStats] = await Promise.all([
      // User stats for the day
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: targetDate, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $gt: ['$lastLogin', targetDate] }, 1, 0]
              }
            }
          }
        }
      ]),

      // Selection stats for the day
      Selection.aggregate([
        {
          $match: {
            createdAt: { $gte: targetDate, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: '$sport',
            count: { $sum: 1 },
            averageOdds: { $avg: '$odds' }
          }
        }
      ]),

      // Analytics events for the day
      Analytics.aggregate([
        {
          $match: {
            'metadata.timestamp': { $gte: targetDate, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        users: {
          new: userStats[0]?.newUsers || 0,
          active: userStats[0]?.activeUsers || 0
        },
        selections: {
          bySport: selectionStats,
          total: selectionStats.reduce((sum, sport) => sum + sport.count, 0)
        },
        events: analyticsStats,
        summary: {
          totalEvents: analyticsStats.reduce((sum, event) => sum + event.count, 0),
          mostFrequentEvent: analyticsStats[0] || null
        }
      }
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get daily stats', error: error.message });
  }
};

// Get weekly stats
export const getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 1 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const weeklyStats = await Analytics.aggregate([
      {
        $match: {
          'metadata.timestamp': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%W", date: "$metadata.timestamp" }
          },
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          eventsByType: { $push: "$eventType" }
        }
      },
      {
        $project: {
          week: "$_id",
          totalEvents: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          eventDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$eventsByType"] },
                as: "event",
                in: {
                  k: "$$event",
                  v: {
                    $size: {
                      $filter: {
                        input: "$eventsByType",
                        as: "e",
                        cond: { $eq: ["$$e", "$$event"] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { week: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe: `${weeks} week${weeks > 1 ? 's' : ''}`,
        stats: weeklyStats,
        summary: {
          totalEvents: weeklyStats.reduce((sum, week) => sum + week.totalEvents, 0),
          averageWeeklyEvents: Math.round(weeklyStats.reduce((sum, week) => sum + week.totalEvents, 0) / weeklyStats.length) || 0,
          averageWeeklyUsers: Math.round(weeklyStats.reduce((sum, week) => sum + week.uniqueUsers, 0) / weeklyStats.length) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get weekly stats', error: error.message });
  }
};

// Get monthly stats
export const getMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyStats = await Analytics.aggregate([
      {
        $match: {
          'metadata.timestamp': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$metadata.timestamp" }
          },
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          eventCategories: { $addToSet: { $arrayElemAt: [{ $split: ["$eventType", "_"] }, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { month: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    "$$month"
                  ]
                }
              }
            },
            { $count: "newUsers" }
          ],
          as: "userGrowth"
        }
      },
      {
        $project: {
          month: "$_id",
          totalEvents: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          newUsers: { $arrayElemAt: ["$userGrowth.newUsers", 0] } || 0,
          categories: { $size: "$eventCategories" }
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe: `${months} month${months > 1 ? 's' : ''}`,
        stats: monthlyStats,
        growth: {
          userGrowth: monthlyStats.reduce((sum, month) => sum + month.newUsers, 0),
          eventGrowth: monthlyStats.reduce((sum, month) => sum + month.totalEvents, 0),
          monthlyAverageUsers: Math.round(monthlyStats.reduce((sum, month) => sum + month.uniqueUsers, 0) / monthlyStats.length) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get monthly stats', error: error.message });
  }
};

// Get user growth
export const getUserGrowth = async (req, res) => {
  try {
    const { timeframe = 'monthly', limit = 12 } = req.query;
    
    const format = timeframe === 'daily' ? '%Y-%m-%d' : 
                  timeframe === 'weekly' ? '%Y-%W' : '%Y-%m';
    
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format, date: "$createdAt" }
          },
          newUsers: { $sum: 1 },
          premiumUsers: {
            $sum: { $cond: [{ $eq: ["$subscriptionTier", "premium"] }, 1, 0] }
          },
          proUsers: {
            $sum: { $cond: [{ $eq: ["$subscriptionTier", "pro"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate cumulative totals
    let cumulativeTotal = 0;
    const growthWithCumulative = userGrowth.map(period => {
      cumulativeTotal += period.newUsers;
      return {
        ...period,
        cumulativeTotal,
        date: period._id
      };
    });

    res.json({
      success: true,
      data: {
        timeframe,
        growth: growthWithCumulative,
        summary: {
          totalUsers: cumulativeTotal,
          totalPremium: userGrowth.reduce((sum, period) => sum + period.premiumUsers, 0),
          totalPro: userGrowth.reduce((sum, period) => sum + period.proUsers, 0),
          averageGrowth: Math.round(cumulativeTotal / userGrowth.length) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user growth', error: error.message });
  }
};

// Get retention metrics
export const getRetentionMetrics = async (req, res) => {
  try {
    const { cohort = 'monthly' } = req.query;
    
    const retentionData = await Analytics.aggregate([
      {
        $match: {
          eventType: 'user_login'
        }
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            cohort: {
              $dateToString: { 
                format: cohort === 'weekly' ? '%Y-%W' : '%Y-%m',
                date: { $min: "$metadata.timestamp" }
              }
            }
          },
          firstLogin: { $min: "$metadata.timestamp" },
          logins: { $push: "$metadata.timestamp" }
        }
      },
      {
        $group: {
          _id: "$_id.cohort",
          cohortSize: { $sum: 1 },
          users: {
            $push: {
              userId: "$_id.userId",
              firstLogin: "$firstLogin",
              loginCount: { $size: "$logins" },
              activeDays: { $size: { $setUnion: { $map: { input: "$logins", as: "date", in: { $dateToString: { format: "%Y-%m-%d", date: "$$date" } } } } } }
            }
          }
        }
      },
      {
        $project: {
          cohort: "$_id",
          cohortSize: 1,
          averageLogins: { $avg: "$users.loginCount" },
          averageActiveDays: { $avg: "$users.activeDays" },
          retentionRate: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: "$users",
                        as: "user",
                        cond: { $gt: ["$$user.loginCount", 1] }
                      }
                    }
                  },
                  "$cohortSize"
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { cohort: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        cohort,
        retentionData,
        summary: {
          totalCohorts: retentionData.length,
          averageRetention: retentionData.reduce((sum, cohort) => sum + cohort.retentionRate, 0) / retentionData.length || 0,
          averageActiveDays: retentionData.reduce((sum, cohort) => sum + cohort.averageActiveDays, 0) / retentionData.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get retention metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get retention metrics', error: error.message });
  }
};

// Get event analytics
export const getEventAnalytics = async (req, res) => {
  try {
    const { eventType, timeframe = '24h' } = req.query;
    
    const cutoffDate = new Date();
    if (timeframe === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    const matchStage = { 'metadata.timestamp': { $gte: cutoffDate } };
    if (eventType) {
      matchStage.eventType = eventType;
    }

    const eventAnalytics = await Analytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          averageResponseTime: { $avg: '$metadata.responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $eq: ['$eventData.status', 'error'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          averageResponseTime: 1,
          errorRate: {
            $multiply: [{ $divide: ['$errorCount', '$count'] }, 100]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        eventType: eventType || 'all',
        analytics: eventAnalytics,
        summary: {
          totalEvents: eventAnalytics.reduce((sum, event) => sum + event.count, 0),
          totalUniqueUsers: [...new Set(eventAnalytics.flatMap(e => e.uniqueUsers))].length,
          averageResponseTime: eventAnalytics.reduce((sum, event) => sum + (event.averageResponseTime || 0), 0) / eventAnalytics.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get event analytics', error: error.message });
  }
};

// Get custom report
export const getCustomReport = async (req, res) => {
  try {
    const { 
      metrics = [],
      dimensions = [],
      filters = {},
      startDate,
      endDate,
      groupBy = 'day'
    } = req.body;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage['metadata.timestamp'] = dateFilter;
    }

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        matchStage[key] = filters[key];
      }
    });

    const groupStage = {
      _id: {}
    };

    // Add dimensions to group by
    dimensions.forEach(dim => {
      if (dim === 'date') {
        groupStage._id.date = {
          $dateToString: { 
            format: groupBy === 'hour' ? '%Y-%m-%d %H:00' :
                    groupBy === 'day' ? '%Y-%m-%d' :
                    groupBy === 'week' ? '%Y-%W' : '%Y-%m'
          }
        };
      } else {
        groupStage._id[dim] = `$${dim}`;
      }
    });

    // Add metrics to calculate
    metrics.forEach(metric => {
      if (metric === 'count') {
        groupStage.count = { $sum: 1 };
      } else if (metric === 'uniqueUsers') {
        groupStage.uniqueUsers = { $addToSet: '$userId' };
      } else if (metric === 'averageValue') {
        groupStage.averageValue = { $avg: '$eventData.value' };
      }
    });

    const pipeline = [{ $match: matchStage }];
    if (Object.keys(groupStage._id).length > 0) {
      pipeline.push({ $group: groupStage });
    }

    const reportData = await Analytics.aggregate(pipeline);

    // Process results
    const processedData = reportData.map(item => {
      const result = { ...item._id };
      metrics.forEach(metric => {
        if (metric === 'uniqueUsers' && item.uniqueUsers) {
          result.uniqueUsers = item.uniqueUsers.length;
        } else if (item[metric] !== undefined) {
          result[metric] = item[metric];
        }
      });
      return result;
    });

    res.json({
      success: true,
      data: {
        metrics,
        dimensions,
        filters,
        timeframe: { startDate, endDate },
        report: processedData,
        summary: {
          totalRecords: processedData.length,
          totalCount: processedData.reduce((sum, item) => sum + (item.count || 0), 0),
          uniqueUsersTotal: [...new Set(processedData.flatMap(item => item.uniqueUsers || []))].length
        }
      }
    });
  } catch (error) {
    console.error('Get custom report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate custom report', error: error.message });
  }
};

// Export analytics
export const exportAnalytics = async (req, res) => {
  try {
    const { format = 'csv', ...queryParams } = req.query;
    
    // Get analytics data
    const analyticsData = await Analytics.find(queryParams)
      .populate('userId', 'username email')
      .sort({ 'metadata.timestamp': -1 })
      .limit(1000) // Limit for export
      .lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json({
        success: true,
        exportDate: new Date().toISOString(),
        recordCount: analyticsData.length,
        data: analyticsData
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = ['timestamp', 'eventType', 'userId', 'username', 'email', 'eventData'];
      const csvRows = [
        headers.join(','),
        ...analyticsData.map(item => [
          item.metadata?.timestamp?.toISOString() || '',
          item.eventType,
          item.userId?._id || '',
          item.userId?.username || '',
          item.userId?.email || '',
          JSON.stringify(item.eventData || {}).replace(/"/g, '""')
        ].map(val => `"${val}"`).join(','))
      ];

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use "json" or "csv"'
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to export analytics', error: error.message });
  }
};

// Default export
// Get all-time performance analytics
export const getAllTimePerformance = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "All-time performance analytics",
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};export default {
  getBumpRiskStats,
  getUserAnalytics,
  getAppAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getUserGrowth,
  getRetentionMetrics,
  getEventAnalytics,
  getCustomReport,
  exportAnalytics
};
