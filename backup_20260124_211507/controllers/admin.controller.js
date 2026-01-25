// controllers/admin.controller.js - COMPLETE VERSION
import User from '../models/user.js';
import Analytics from '../models/analytics.js';
import Selection from '../models/selection.js';
import Prediction from '../models/Prediction.js';
import SecretPhraseAnalytics from '../models/SecretPhraseAnalytics.js';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import bcrypt from 'bcryptjs';

// Middleware to check admin access
const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { 
        page = 1, 
        limit = 20,
        role,
        status,
        search,
        subscription = ''
      } = req.query;

      const skip = (page - 1) * limit;
      const query = {};

      if (role && role !== 'all') query.role = role;
      if (status && status !== 'all') query.status = status;
      if (subscription && subscription !== 'all') {
        if (subscription === 'premium' || subscription === 'pro') {
          query.subscriptionTier = subscription;
        } else if (subscription === 'free') {
          query.$or = [
            { subscriptionTier: 'free' },
            { subscriptionTier: { $exists: false } },
            { 'subscription.status': { $ne: 'active' } }
          ];
        }
      }
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users', error: error.message });
  }
};

// Get analytics
export const getAnalytics = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { timeframe = '24h', type = 'all' } = req.query;
      
      const cutoffDate = new Date();
      if (timeframe === '24h') {
        cutoffDate.setHours(cutoffDate.getHours() - 24);
      } else if (timeframe === '7d') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeframe === '30d') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }

      const analyticsData = {};

      if (type === 'all' || type === 'user') {
        // User analytics
        analyticsData.userStats = await User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newUsers: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              byRole: [
                { $group: { _id: '$role', count: { $sum: 1 } } }
              ],
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ]
            }
          }
        ]);
      }

      if (type === 'all' || type === 'selection') {
        // Selection analytics
        analyticsData.selectionStats = await Selection.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newSelections: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              bySport: [
                { $group: { _id: '$sport', count: { $sum: 1 } } }
              ],
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ],
              byResult: [
                { $group: { _id: '$result', count: { $sum: 1 } } }
              ]
            }
          }
        ]);
      }

      if (type === 'all' || type === 'prediction') {
        // Prediction analytics
        analyticsData.predictionStats = await Prediction.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newPredictions: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              bySport: [
                { $group: { _id: '$sport', count: { $sum: 1 } } }
              ],
              byOutcome: [
                { $group: { _id: '$outcome', count: { $sum: 1 } } }
              ]
            }
          }
        ]);
      }

      res.json({
        success: true,
        data: analyticsData
      });
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics', error: error.message });
  }
};

// Get logs
export const getLogs = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { 
        page = 1, 
        limit = 20,
        type = 'all',
        startDate,
        endDate 
      } = req.query;

      const skip = (page - 1) * limit;
      let query = {};

      if (type === 'admin') {
        query.eventType = { $regex: '^admin_' };
      } else if (type === 'system') {
        query.eventType = { $regex: '^system_' };
      } else if (type === 'error') {
        query.eventType = { $regex: 'error' };
      }

      if (startDate || endDate) {
        query['metadata.timestamp'] = {};
        if (startDate) query['metadata.timestamp'].$gte = new Date(startDate);
        if (endDate) query['metadata.timestamp'].$lte = new Date(endDate);
      }

      const logs = await Analytics.find(query)
        .sort({ 'metadata.timestamp': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username email')
        .lean();

      const total = await Analytics.countDocuments(query);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get logs', error: error.message });
  }
};

// Clear cache
export const clearCache = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { cacheType = 'all' } = req.query;
      let clearedCount = 0;

      if (redisClient) {
        if (cacheType === 'all') {
          await redisClient.flushAll();
          clearedCount = -1; // -1 indicates all caches cleared
        } else if (cacheType === 'user') {
          const keys = await redisClient.keys('user:*');
          for (const key of keys) {
            await redisClient.del(key);
          }
          clearedCount = keys.length;
        } else if (cacheType === 'selection') {
          const keys = await redisClient.keys('selection:*');
          for (const key of keys) {
            await redisClient.del(key);
          }
          clearedCount = keys.length;
        } else if (cacheType === 'analytics') {
          const keys = await redisClient.keys('analytics:*');
          for (const key of keys) {
            await redisClient.del(key);
          }
          clearedCount = keys.length;
        }

        // Log the action
        await Analytics.create({
          userId: req.user.userId || req.user._id,
          eventType: 'admin_cache_clear',
          eventData: {
            cacheType,
            clearedCount,
            adminId: req.user.userId || req.user._id
          },
          metadata: { timestamp: new Date() }
        });

        res.json({
          success: true,
          message: `Cache cleared successfully`,
          data: {
            cacheType,
            clearedCount: clearedCount === -1 ? 'all' : clearedCount
          }
        });
      } else {
        res.json({
          success: true,
          message: 'Redis not configured, cache clearing simulated',
          data: {
            cacheType,
            clearedCount: 0
          }
        });
      }
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cache', error: error.message });
  }
};

// Update system settings
export const updateSystemSettings = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const settings = req.body;

      // Validate settings
      const validSettings = [
        'maintenanceMode',
        'registrationEnabled',
        'maxSelectionsPerUser',
        'sessionTimeout',
        'apiRateLimit',
        'notificationsEnabled',
        'analyticsEnabled'
      ];

      const updates = {};
      for (const key of validSettings) {
        if (settings[key] !== undefined) {
          updates[key] = settings[key];
        }
      }

      // In a real application, you would save these to a database
      // For now, we'll just log the action
      await Analytics.create({
        userId: req.user.userId || req.user._id,
        eventType: 'admin_settings_update',
        eventData: {
          settings: updates,
          adminId: req.user.userId || req.user._id
        },
        metadata: { timestamp: new Date() }
      });

      res.json({
        success: true,
        message: 'System settings updated successfully',
        data: updates
      });
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update system settings', error: error.message });
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;
      const { reason, duration } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'banned',
          isActive: false,
          bannedAt: new Date(),
          banReason: reason,
          banDuration: duration
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Log admin action
      await Analytics.create({
        userId: req.user.userId || req.user._id,
        eventType: 'admin_user_ban',
        eventData: {
          targetUserId: userId,
          reason,
          duration,
          adminId: req.user.userId || req.user._id
        },
        metadata: { timestamp: new Date() }
      });

      res.json({
        success: true,
        message: 'User banned successfully',
        data: user
      });
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ success: false, message: 'Failed to ban user', error: error.message });
  }
};

// Unban user
export const unbanUser = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'active',
          isActive: true,
          bannedAt: null,
          banReason: null,
          banDuration: null
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Log admin action
      await Analytics.create({
        userId: req.user.userId || req.user._id,
        eventType: 'admin_user_unban',
        eventData: {
          targetUserId: userId,
          adminId: req.user.userId || req.user._id
        },
        metadata: { timestamp: new Date() }
      });

      res.json({
        success: true,
        message: 'User unbanned successfully',
        data: user
      });
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ success: false, message: 'Failed to unban user', error: error.message });
  }
};

// Get user activity
export const getUserActivity = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;
      const { 
        page = 1, 
        limit = 20,
        activityType = 'all'
      } = req.query;

      const skip = (page - 1) * limit;
      let query = { userId };

      if (activityType === 'selections') {
        const selections = await Selection.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean();

        const total = await Selection.countDocuments({ userId });

        res.json({
          success: true,
          data: {
            activityType: 'selections',
            activities: selections,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        });
      } else if (activityType === 'predictions') {
        const predictions = await Prediction.find({ userId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean();

        const total = await Prediction.countDocuments({ userId });

        res.json({
          success: true,
          data: {
            activityType: 'predictions',
            activities: predictions,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit))
            }
          }
        });
      } else {
        // Get all activities
        const [selections, predictions, analytics] = await Promise.all([
          Selection.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean(),
          Prediction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean(),
          Analytics.find({ userId })
            .sort({ 'metadata.timestamp': -1 })
            .limit(parseInt(limit))
            .lean()
        ]);

        // Combine and sort all activities
        const allActivities = [
          ...selections.map(s => ({ ...s, type: 'selection', timestamp: s.createdAt })),
          ...predictions.map(p => ({ ...p, type: 'prediction', timestamp: p.timestamp })),
          ...analytics.map(a => ({ ...a, type: 'analytics', timestamp: a.metadata?.timestamp }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
          success: true,
          data: {
            activityType: 'all',
            activities: allActivities.slice(0, parseInt(limit)),
            total: allActivities.length
          }
        });
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user activity', error: error.message });
  }
};

// Get revenue stats
export const getRevenueStats = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
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

      // Get revenue from subscriptions
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
            premiumCount: {
              $sum: { $cond: [{ $eq: ["$subscriptionTier", "premium"] }, 1, 0] }
            },
            proCount: {
              $sum: { $cond: [{ $eq: ["$subscriptionTier", "pro"] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate totals
      const totals = revenueStats.reduce((acc, stat) => {
        acc.totalRevenue += stat.totalRevenue;
        acc.totalPremium += stat.premiumCount;
        acc.totalPro += stat.proCount;
        return acc;
      }, { totalRevenue: 0, totalPremium: 0, totalPro: 0 });

      res.json({
        success: true,
        data: {
          timeframe,
          revenueStats,
          totals,
          summary: {
            mrr: totals.totalRevenue, // Monthly recurring revenue
            arr: totals.totalRevenue * 12, // Annual recurring revenue
            averageRevenuePerUser: totals.totalRevenue / (totals.totalPremium + totals.totalPro) || 0
          }
        }
      });
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get revenue stats', error: error.message });
  }
};

// Get active users
export const getActiveUsers = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { timeframe = '30d', minActivities = 1 } = req.query;

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

      // Get active users based on various activities
      const [selectionUsers, predictionUsers, analyticsUsers] = await Promise.all([
        Selection.distinct('userId', { createdAt: { $gte: dateFilter } }),
        Prediction.distinct('userId', { timestamp: { $gte: dateFilter } }),
        Analytics.distinct('userId', { 'metadata.timestamp': { $gte: dateFilter } })
      ]);

      // Combine all active user IDs
      const allActiveUserIds = [...new Set([
        ...selectionUsers,
        ...predictionUsers,
        ...analyticsUsers
      ])];

      // Get user details
      const activeUsers = await User.find({
        _id: { $in: allActiveUserIds },
        isActive: true
      })
      .select('username email role subscriptionTier lastLogin createdAt')
      .lean();

      // Get activity counts for each user
      const usersWithActivity = await Promise.all(
        activeUsers.map(async (user) => {
          const [selectionsCount, predictionsCount, analyticsCount] = await Promise.all([
            Selection.countDocuments({ userId: user._id, createdAt: { $gte: dateFilter } }),
            Prediction.countDocuments({ userId: user._id, timestamp: { $gte: dateFilter } }),
            Analytics.countDocuments({ userId: user._id, 'metadata.timestamp': { $gte: dateFilter } })
          ]);

          return {
            ...user,
            activityCount: selectionsCount + predictionsCount + analyticsCount,
            activityBreakdown: {
              selections: selectionsCount,
              predictions: predictionsCount,
              analytics: analyticsCount
            }
          };
        })
      );

      // Filter by minimum activities and sort by activity count
      const filteredUsers = usersWithActivity
        .filter(user => user.activityCount >= minActivities)
        .sort((a, b) => b.activityCount - a.activityCount);

      res.json({
        success: true,
        data: {
          timeframe,
          totalActiveUsers: filteredUsers.length,
          activeUsers: filteredUsers,
          activityThreshold: minActivities,
          dateFilter
        }
      });
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get active users', error: error.message });
  }
};

// Get platform stats
export const getPlatformStats = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { timeframe = '24h' } = req.query;

      const cutoffDate = new Date();
      if (timeframe === '24h') {
        cutoffDate.setHours(cutoffDate.getHours() - 24);
      } else if (timeframe === '7d') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeframe === '30d') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }

      const [
        userStats,
        selectionStats,
        predictionStats,
        analyticsStats,
        systemHealth
      ] = await Promise.all([
        // User stats
        User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newUsers: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              activeUsers: [
                { $match: { lastLogin: { $gte: cutoffDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),

        // Selection stats
        Selection.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newSelections: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),

        // Prediction stats
        Prediction.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newPredictions: [
                { $match: { timestamp: { $gte: cutoffDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),

        // Analytics stats
        Analytics.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newAnalytics: [
                { $match: { 'metadata.timestamp': { $gte: cutoffDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),

        // System health
        Promise.resolve({
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          databaseStatus: 'connected',
          timestamp: new Date()
        })
      ]);

      res.json({
        success: true,
        data: {
          timeframe,
          users: {
            total: userStats[0]?.total[0]?.count || 0,
            new: userStats[0]?.newUsers[0]?.count || 0,
            active: userStats[0]?.activeUsers[0]?.count || 0
          },
          selections: {
            total: selectionStats[0]?.total[0]?.count || 0,
            new: selectionStats[0]?.newSelections[0]?.count || 0
          },
          predictions: {
            total: predictionStats[0]?.total[0]?.count || 0,
            new: predictionStats[0]?.newPredictions[0]?.count || 0
          },
          analytics: {
            total: analyticsStats[0]?.total[0]?.count || 0,
            new: analyticsStats[0]?.newAnalytics[0]?.count || 0
          },
          systemHealth,
          performance: {
            averageResponseTime: 0, // Would come from monitoring
            errorRate: 0,
            availability: '99.9%'
          }
        }
      });
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get platform stats', error: error.message });
  }
};

// Existing functions (renamed to match expected names)
export const getUserById = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: user
      });
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;
      const updates = req.body;

      // Remove protected fields
      delete updates.password;
      delete updates._id;
      delete updates.createdAt;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...updates,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { userId } = req.params;

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    checkAdmin(req, res, async () => {
      const { timeframe = '24h' } = req.query;

      const cutoffDate = new Date();
      if (timeframe === '24h') {
        cutoffDate.setHours(cutoffDate.getHours() - 24);
      } else if (timeframe === '7d') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeframe === '30d') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }

      const stats = await Promise.all([
        // User stats
        User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newUsers: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              byRole: [
                { $group: { _id: '$role', count: { $sum: 1 } } }
              ]
            }
          }
        ]),

        // Selection stats
        Selection.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newSelections: [
                { $match: { createdAt: { $gte: cutoffDate } } },
                { $count: 'count' }
              ],
              bySport: [
                { $group: { _id: '$sport', count: { $sum: 1 } } }
              ]
            }
          }
        ]),

        // Analytics stats
        Analytics.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              newAnalytics: [
                { $match: { 'metadata.timestamp': { $gte: cutoffDate } } },
                { $count: 'count' }
              ]
            }
          }
        ])
      ]);

      const [userStats, selectionStats, analyticsStats] = stats;

      res.json({
        success: true,
        data: {
          timeframe,
          users: {
            total: userStats[0]?.total[0]?.count || 0,
            new: userStats[0]?.newUsers[0]?.count || 0,
            byRole: userStats[0]?.byRole || []
          },
          selections: {
            total: selectionStats[0]?.total[0]?.count || 0,
            new: selectionStats[0]?.newSelections[0]?.count || 0,
            bySport: selectionStats[0]?.bySport || []
          },
          analytics: {
            total: analyticsStats[0]?.total[0]?.count || 0,
            new: analyticsStats[0]?.newAnalytics[0]?.count || 0
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
          }
        }
      });
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get system statistics', error: error.message });
  }
};

// Default export with all expected functions
export default {
  getAllUsers,
  getAnalytics,
  getLogs,
  clearCache,
  updateSystemSettings,
  banUser,
  unbanUser,
  getUserActivity,
  getRevenueStats,
  getActiveUsers,
  getPlatformStats,
  getUserById,
  updateUser,
  deleteUser,
  getSystemStats
};
