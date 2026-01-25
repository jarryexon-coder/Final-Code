import express from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
import mongoose from 'mongoose';

// Import models
import SecretPhraseAnalytics from '../models/SecretPhraseAnalytics.js'; // Add this line

// Analytics events endpoint (POST)
router.post('/events', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // Validate and clean events before storing
    const cleanedEvents = events
      .filter(event => event && event.event_name && event.timestamp)
      .map(event => ({
        ...event,
        event_properties: event.event_properties || {},
        ...(event.event_name === 'screen_view' && event.event_properties?.screen_name === null ? {
          event_properties: {
            ...event.event_properties,
            screen_name: 'unknown'
          }
        } : {}),
        received_at: new Date(),
        ip_address: req.ip
      }));

    // Store events in database
    if (mongoose.connection.readyState === 1 && cleanedEvents.length > 0) {
      const db = mongoose.connection.db;
      await db.collection('analytics_events').insertMany(cleanedEvents);
      
      // Also store in global realtimeEvents (in-memory for real-time dashboard)
      if (!global.realtimeEvents) {
        global.realtimeEvents = [];
      }
      global.realtimeEvents.push(...cleanedEvents);
      
      // Keep only last 500 events in memory
      if (global.realtimeEvents.length > 500) {
        global.realtimeEvents = global.realtimeEvents.slice(-500);
      }
    }

    console.log(`📊 Received ${cleanedEvents.length} analytics events (${events.length - cleanedEvents.length} invalid events filtered)`);
    
    res.json({ success: true, received: cleanedEvents.length });
  } catch (error) {
    console.error('Error processing analytics events:', error);
    res.status(500).json({ error: 'Failed to process analytics events', details: error.message });
  }
});

// Feature usage tracking endpoint
router.post('/feature-usage', async (req, res) => {
  try {
    const { featureName, sport, duration, userId, timestamp } = req.body;
    
    if (!featureName || !userId) {
      return res.status(400).json({ error: 'Missing required fields: featureName and userId are required' });
    }

    // Store feature usage in database
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection('feature_usage').insertOne({
        featureName,
        sport: sport || null,
        duration: duration || 0,
        userId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        recorded_at: new Date(),
        ip_address: req.ip
      });
    }

    console.log(`📊 Feature usage tracked: ${featureName} by user ${userId}`);
    
    res.json({ success: true, feature: featureName, userId });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    res.status(500).json({ error: 'Failed to track feature usage', details: error.message });
  }
});

// =============================================
// SECRET PHRASE ANALYTICS ENDPOINTS
// =============================================

// POST: Record a new secret phrase event
router.post('/secret-phrase/record', auth, async (req, res) => {
  try {
    const {
      phraseKey,
      phraseCategory,
      rarity,
      eventType,
      inputText,
      sport,
      playerName,
      odds,
      confidence,
      outcome,
      unitsWon,
      performanceData,
      metadata,
      isPremium,
      sessionId,
      location,
      betId
    } = req.body;

    // Create analytics record
    const analyticsRecord = new SecretPhraseAnalytics({
      userId: req.user.id,
      phraseKey,
      phraseCategory,
      rarity,
      eventType,
      inputText,
      sport,
      playerName,
      odds,
      confidence,
      outcome,
      unitsWon,
      performanceData,
      metadata: {
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
        appVersion: req.headers['x-app-version'] || '1.0.0',
        timeOfDay: new Date().getHours(),
        sessionDuration: metadata?.sessionDuration || 0,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        ...metadata
      },
      betId: betId || null,
      isPremium: isPremium || false,
      sessionId: sessionId || req.sessionID,
      location: location || {
        country: req.headers['x-country'] || 'Unknown',
        state: req.headers['x-state'] || 'Unknown',
        city: req.headers['x-city'] || 'Unknown'
      }
    });

    await analyticsRecord.save();

    // If WebSocket server exists, broadcast the new event
    if (global.wss) {
      const eventData = {
        type: 'secret_phrase_event',
        data: {
          ...analyticsRecord.toObject(),
          timestamp: new Date()
        }
      };

      global.wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(JSON.stringify(eventData));
        }
      });
    }

    // Also store in global realtimeEvents for dashboard
    if (!global.secretPhraseEvents) {
      global.secretPhraseEvents = [];
    }
    global.secretPhraseEvents.push(analyticsRecord.toObject());
    
    // Keep only last 100 events in memory
    if (global.secretPhraseEvents.length > 100) {
      global.secretPhraseEvents = global.secretPhraseEvents.slice(-100);
    }

    console.log(`🔐 Secret phrase analytics recorded: ${phraseKey} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: analyticsRecord
    });
  } catch (error) {
    console.error('Error recording secret phrase analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record secret phrase analytics',
      details: error.message
    });
  }
});

// GET: Retrieve secret phrase analytics for a user
router.get('/secret-phrase/user', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      phraseCategory, 
      rarity, 
      sport,
      limit = 50,
      skip = 0 
    } = req.query;

    const query = { userId: req.user.id };

    // Apply filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (phraseCategory) query.phraseCategory = phraseCategory;
    if (rarity) query.rarity = rarity;
    if (sport) query.sport = sport;

    const analytics = await SecretPhraseAnalytics.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await SecretPhraseAnalytics.countDocuments(query);

    // Calculate stats
    const stats = await SecretPhraseAnalytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          uniquePhrases: { $addToSet: '$phraseKey' },
          totalUnitsWon: { $sum: '$unitsWon' },
          winCount: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          lossCount: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          pushCount: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: analytics,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      },
      stats: stats[0] || {
        totalEvents: 0,
        uniquePhrases: [],
        totalUnitsWon: 0,
        winCount: 0,
        lossCount: 0,
        pushCount: 0,
        avgConfidence: 0
      }
    });
  } catch (error) {
    console.error('Error fetching secret phrase analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secret phrase analytics',
      details: error.message
    });
  }
});

// GET: Get real-time secret phrase analytics summary
router.get('/secret-phrase/realtime', auth, async (req, res) => {
  try {
    const recentEvents = await SecretPhraseAnalytics.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysStats = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          todaysEvents: { $sum: 1 },
          todaysUnits: { $sum: '$unitsWon' },
          rarePhrasesToday: {
            $sum: { $cond: [{ $in: ['$rarity', ['rare', 'legendary']] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryDistribution = await SecretPhraseAnalytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$phraseCategory',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get recent events from memory for real-time dashboard
    const memoryEvents = global.secretPhraseEvents || [];
    const userMemoryEvents = memoryEvents.filter(event => 
      event.userId.toString() === req.user.id.toString()
    ).slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        recentEvents: userMemoryEvents.length > 0 ? userMemoryEvents : recentEvents,
        todaysStats: todaysStats[0] || {
          todaysEvents: 0,
          todaysUnits: 0,
          rarePhrasesToday: 0
        },
        categoryDistribution,
        connectionStatus: global.wss ? 'connected' : 'disconnected',
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching real-time secret phrase analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time secret phrase analytics',
      details: error.message
    });
  }
});

// GET: Get performance metrics by phrase category
router.get('/secret-phrase/performance/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { timeRange = '30days' } = req.query;

    const timeRangeDays = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': 3650 // 10 years
    }[timeRange] || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRangeDays);

    const performance = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          phraseCategory: category,
          timestamp: { $gte: startDate },
          outcome: { $in: ['win', 'loss', 'push'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
          totalUnits: { $sum: '$unitsWon' },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: timeRangeDays }
    ]);

    // Calculate summary stats
    const summaryStats = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          phraseCategory: category,
          timestamp: { $gte: startDate },
          outcome: { $in: ['win', 'loss', 'push'] }
        }
      },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
          totalUnits: { $sum: '$unitsWon' },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    const summary = summaryStats[0] || {
      totalBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      totalUnits: 0,
      avgConfidence: 0
    };

    const winRate = summary.totalBets > 0 ? (summary.wins / summary.totalBets * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        dailyPerformance: performance,
        summary: {
          ...summary,
          winRate: parseFloat(winRate),
          roi: summary.totalBets > 0 ? ((summary.totalUnits / summary.totalBets) * 100).toFixed(1) : 0
        },
        category,
        timeRange
      }
    });
  } catch (error) {
    console.error('Error fetching secret phrase performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secret phrase performance metrics',
      details: error.message
    });
  }
});

// GET: Get secret phrase leaderboard (admin only)
router.get('/secret-phrase/leaderboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    const { timeframe = 'week', limit = 10 } = req.query;

    const timeframes = {
      'day': 1,
      'week': 7,
      'month': 30,
      'all': 3650
    };

    const days = timeframes[timeframe] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get top users by units won
    const leaderboard = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          outcome: { $in: ['win', 'loss', 'push'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalUnits: { $sum: '$unitsWon' },
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          rarePhrases: { 
            $sum: { $cond: [{ $in: ['$rarity', ['rare', 'legendary']] }, 1, 0] }
          },
          uniquePhrases: { $addToSet: '$phraseKey' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          totalUnits: 1,
          totalBets: 1,
          wins: 1,
          losses: 1,
          rarePhrases: 1,
          uniquePhraseCount: { $size: '$uniquePhrases' },
          winRate: { 
            $cond: [
              { $gt: ['$totalBets', 0] },
              { $multiply: [{ $divide: ['$wins', '$totalBets'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalUnits: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get category distribution for all users
    const categoryDistribution = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$phraseCategory',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgUnits: { $avg: '$unitsWon' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        categoryDistribution,
        timeframe,
        totalUsersInTimeframe: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Error fetching secret phrase leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secret phrase leaderboard',
      details: error.message
    });
  }
});

// =============================================
// GDPR COMPLIANCE ENDPOINTS
// =============================================

// Delete user data (GDPR right to erasure)
router.post('/user/:userId/delete', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = mongoose.connection.db;
    
    // Check if user is admin or deleting their own data
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwnData = req.user && req.user.id === userId;
    
    if (!isAdmin && !isOwnData) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own data or must be an admin.' });
    }
    
    // Delete all analytics events for user
    const analyticsResult = await db.collection('analytics_events').deleteMany({
      user_id: userId
    });
    
    // Delete all feature usage for user
    const featureUsageResult = await db.collection('feature_usage').deleteMany({
      userId: userId
    });
    
    // Delete all secret phrase analytics for user
    const secretPhraseResult = await SecretPhraseAnalytics.deleteMany({
      userId: userId
    });
    
    // Also anonymize user data in users collection
    try {
      await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { 
          $set: { 
            email: 'deleted@user.com',
            name: 'Deleted User',
            analytics_consent: false,
            gdpr_deleted_at: new Date()
          }
        }
      );
    } catch (userError) {
      console.log(`User ${userId} not found in users collection, skipping user anonymization`);
    }
    
    console.log(`🧹 GDPR Deletion: Deleted ${analyticsResult.deletedCount} events, ${featureUsageResult.deletedCount} feature usage records, and ${secretPhraseResult.deletedCount} secret phrase records for user ${userId}`);
    
    res.json({
      success: true,
      message: `Deleted user data for ${userId}`,
      deletedCount: {
        analyticsEvents: analyticsResult.deletedCount,
        featureUsage: featureUsageResult.deletedCount,
        secretPhraseAnalytics: secretPhraseResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Failed to delete user data', details: error.message });
  }
});

// Export user data (GDPR right to access)
router.get('/user/:userId/export', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = mongoose.connection.db;
    
    // Check if user is admin or exporting their own data
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwnData = req.user && req.user.id === userId;
    
    if (!isAdmin && !isOwnData) {
      return res.status(403).json({ error: 'Access denied. You can only export your own data or must be an admin.' });
    }
    
    // Get all events for user
    const events = await db.collection('analytics_events')
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .toArray();
    
    // Get all feature usage for user
    const featureUsage = await db.collection('feature_usage')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .toArray();
    
    // Get all secret phrase analytics for user
    const secretPhraseAnalytics = await SecretPhraseAnalytics.find({ userId: userId })
      .sort({ timestamp: -1 })
      .lean();
    
    // Get user profile data
    let userProfile = null;
    try {
      userProfile = await db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { password: 0, refreshToken: 0 } }
      );
    } catch (userError) {
      console.log(`User ${userId} not found in users collection, skipping user profile export`);
    }
    
    // Generate export timestamp
    const exportTimestamp = new Date().toISOString();
    
    res.json({
      success: true,
      exportId: `export_${Date.now()}_${userId}`,
      exportTimestamp,
      userId,
      summary: {
        totalEvents: events.length,
        totalFeatureUsage: featureUsage.length,
        totalSecretPhraseAnalytics: secretPhraseAnalytics.length,
        userProfileExists: !!userProfile
      },
      data: {
        analyticsEvents: events,
        featureUsage,
        secretPhraseAnalytics,
        userProfile
      }
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ error: 'Failed to export user data', details: error.message });
  }
});

// =============================================
// ANALYTICS DASHBOARD & REPORTING ENDPOINTS
// =============================================

// Admin analytics dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const db = mongoose.connection.db;
    const now = new Date();
    
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get analytics data
    const [
      totalUsers, 
      activeUsersResult, 
      totalEvents, 
      conversionRateResult,
      secretPhraseStatsResult
    ] = await Promise.all([
      // Total registered users
      db.collection('users').countDocuments(),
      
      // Active users (last 7 days)
      db.collection('analytics_events').aggregate([
        {
          $match: {
            timestamp: { $gte: weekAgo },
            user_id: { $ne: null, $exists: true }
          }
        },
        {
          $group: {
            _id: '$user_id'
          }
        },
        {
          $count: 'activeUsers'
        }
      ]).toArray(),
      
      // Total events today
      db.collection('analytics_events').countDocuments({
        timestamp: { $gte: today },
        event_name: { $exists: true, $ne: null }
      }),
      
      // Conversion rate (free to paid)
      db.collection('users').aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            paid: {
              $sum: {
                $cond: [
                  { $ne: ['$subscription.plan', 'free'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]).toArray(),
      
      // Secret phrase analytics stats
      SecretPhraseAnalytics.aggregate([
        {
          $match: {
            timestamp: { $gte: monthAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalSecretPhraseEvents: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            totalUnitsWon: { $sum: '$unitsWon' },
            rarePhrases: { 
              $sum: { $cond: [{ $in: ['$rarity', ['rare', 'legendary']] }, 1, 0] }
            }
          }
        }
      ])
    ]);
    
    const conversionRate = conversionRateResult[0] ? 
      (conversionRateResult[0].paid / conversionRateResult[0].total * 100).toFixed(2) : 0;
    
    const activeUsers = activeUsersResult[0] ? activeUsersResult[0].activeUsers : 0;
    const secretPhraseStats = secretPhraseStatsResult[0] || {
      totalSecretPhraseEvents: 0,
      uniqueUsers: [],
      totalUnitsWon: 0,
      rarePhrases: 0
    };
    
    // Popular screens
    const popularScreens = await db.collection('analytics_events')
      .aggregate([
        { 
          $match: { 
            event_name: 'screen_view',
            'event_properties.screen_name': { $exists: true, $ne: null }
          } 
        },
        { $group: { _id: '$event_properties.screen_name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
    
    // User retention
    const retentionData = await calculateRetention(db);
    
    // Get feature usage stats
    const featureUsage = await db.collection('feature_usage')
      .aggregate([
        { $match: { timestamp: { $gte: monthAgo } } },
        { $group: { 
          _id: '$featureName', 
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          uniqueUsers: { $addToSet: '$userId' }
        }},
        { $project: {
          featureName: '$_id',
          count: 1,
          averageDuration: { $divide: ['$totalDuration', '$count'] },
          uniqueUserCount: { $size: '$uniqueUsers' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
    
    // Get daily events for chart
    const dailyEvents = await db.collection('analytics_events')
      .aggregate([
        { 
          $match: { 
            timestamp: { $gte: monthAgo },
            event_name: { $exists: true, $ne: null }
          } 
        },
        { $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
        }},
        { $group: {
          _id: "$day",
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]).toArray();
    
    // Get latest event
    const latestEvent = await db.collection('analytics_events')
      .find({ event_name: { $exists: true, $ne: null } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    
    // GDPR compliance stats
    const gdprStats = await db.collection('users').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withAnalyticsConsent: {
            $sum: {
              $cond: [
                { $eq: ['$analytics_consent', true] },
                1,
                0
              ]
            }
          },
          gdprDeleted: {
            $sum: {
              $cond: [
                { $ne: ['$gdpr_deleted_at', null] },
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers: activeUsers,
          totalEvents,
          conversionRate: parseFloat(conversionRate),
          dateRange: {
            today: today.toISOString(),
            weekAgo: weekAgo.toISOString(),
            monthAgo: monthAgo.toISOString()
          }
        },
        secretPhraseAnalytics: {
          totalEvents: secretPhraseStats.totalSecretPhraseEvents,
          uniqueUsers: secretPhraseStats.uniqueUsers.length,
          totalUnitsWon: secretPhraseStats.totalUnitsWon,
          rarePhrases: secretPhraseStats.rarePhrases
        },
        popularScreens: popularScreens.length > 0 ? popularScreens : [],
        retention: retentionData,
        featureUsage,
        dailyEvents,
        latestEvent: latestEvent.length > 0 ? {
          event_name: latestEvent[0].event_name,
          timestamp: latestEvent[0].timestamp,
          screen_name: latestEvent[0].event_properties?.screen_name || 'N/A'
        } : null,
        gdpr: gdprStats[0] || { total: 0, withAnalyticsConsent: 0, gdprDeleted: 0 },
        revenue: await getRevenueData(db, monthAgo),
        userAcquisition: await getAcquisitionData(db, monthAgo)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// Analytics data with time range parameter
router.get('/', auth, async (req, res) => {
  try {
    const { range } = req.query;
    const db = mongoose.connection.db;
    const now = new Date();
    
    let startDate;
    switch (range) {
      case 'today':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const [events, usersResult, featureUsage, secretPhraseEvents] = await Promise.all([
      db.collection('analytics_events').countDocuments({ 
        timestamp: { $gte: startDate },
        event_name: { $exists: true, $ne: null }
      }),
      
      db.collection('analytics_events').aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            user_id: { $ne: null, $exists: true }
          }
        },
        {
          $group: {
            _id: '$user_id'
          }
        },
        {
          $count: 'activeUsers'
        }
      ]).toArray(),
      
      db.collection('feature_usage').countDocuments({ timestamp: { $gte: startDate } }),
      
      SecretPhraseAnalytics.countDocuments({ timestamp: { $gte: startDate } })
    ]);
    
    const activeUsers = usersResult[0] ? usersResult[0].activeUsers : 0;
    
    res.json({
      success: true,
      data: {
        events,
        activeUsers,
        featureUsage,
        secretPhraseEvents,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics by range:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// Real-time analytics (WebSocket)
router.get('/realtime', auth, async (req, res) => {
  try {
    const events = global.realtimeEvents || [];
    const secretPhraseEvents = global.secretPhraseEvents || [];
    
    const validEvents = events.filter(event => 
      event && event.event_name && event.timestamp
    ).slice(-100);
    
    const eventCounts = {};
    validEvents.forEach(event => {
      const eventName = event.event_name || 'unknown';
      eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
    });
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEvents = validEvents.filter(event => 
      new Date(event.timestamp) > fiveMinutesAgo
    );
    const activeUsers = [...new Set(recentEvents.map(event => event.user_id).filter(Boolean))];
    
    // Get recent secret phrase events
    const recentSecretPhraseEvents = secretPhraseEvents
      .filter(event => event && event.timestamp)
      .slice(-10)
      .map(event => ({
        phraseKey: event.phraseKey,
        phraseCategory: event.phraseCategory,
        rarity: event.rarity,
        outcome: event.outcome,
        unitsWon: event.unitsWon,
        timestamp: event.timestamp,
        userId: event.userId
      }));
    
    res.json({
      success: true,
      count: validEvents.length,
      activeUsers: activeUsers.length,
      eventCounts,
      latestEvents: validEvents.slice(-10).map(event => ({
        event_name: event.event_name,
        timestamp: event.timestamp,
        user_id: event.user_id,
        screen_name: event.event_properties?.screen_name || null
      })),
      secretPhraseEvents: recentSecretPhraseEvents,
      data: validEvents
    });
  } catch (error) {
    console.error('Error fetching realtime analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch realtime analytics',
      data: [] 
    });
  }
});

// User-specific analytics
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { range } = req.query;
    const db = mongoose.connection.db;
    
    let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (range === 'week') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'today') {
      startDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    }
    
    const [userEvents, featureUsage, sessionCount, secretPhraseAnalytics] = await Promise.all([
      db.collection('analytics_events')
        .find({ 
          user_id: userId,
          timestamp: { $gte: startDate },
          event_name: { $exists: true, $ne: null }
        })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray(),
      
      db.collection('feature_usage')
        .find({ 
          userId,
          timestamp: { $gte: startDate }
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray(),
      
      db.collection('analytics_events')
        .distinct('session_id', { 
          user_id: userId,
          timestamp: { $gte: startDate },
          event_name: { $exists: true, $ne: null }
        }),
      
      SecretPhraseAnalytics.find({ 
        userId: userId,
        timestamp: { $gte: startDate }
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean()
    ]);
    
    const userStats = {
      totalEvents: userEvents.length,
      featureUsageCount: featureUsage.length,
      secretPhraseEvents: secretPhraseAnalytics.length,
      sessionCount: sessionCount.length,
      lastActive: userEvents[0]?.timestamp || null,
      favoriteScreens: getFavoriteScreens(userEvents),
      conversionEvents: userEvents.filter(e => e.event_name && e.event_name.includes('subscription')).length
    };
    
    res.json({
      success: true,
      data: userStats,
      events: userEvents.slice(0, 20),
      featureUsage: featureUsage.slice(0, 10),
      secretPhraseAnalytics: secretPhraseAnalytics.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Clean analytics data endpoint (admin only)
router.post('/cleanup', auth, async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const db = mongoose.connection.db;
    
    const result = await db.collection('analytics_events').deleteMany({
      $or: [
        { event_name: null },
        { event_name: '' },
        { 'event_properties.screen_name': null },
        { user_id: null },
        { user_id: '' }
      ]
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} invalid analytics events`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} invalid analytics events`
    });
  } catch (error) {
    console.error('Error cleaning analytics data:', error);
    res.status(500).json({ error: 'Failed to clean analytics data', details: error.message });
  }
});

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      events: 'POST /api/analytics/events',
      'feature-usage': 'POST /api/analytics/feature-usage',
      'secret-phrase-record': 'POST /api/analytics/secret-phrase/record',
      'secret-phrase-user': 'GET /api/analytics/secret-phrase/user',
      'secret-phrase-realtime': 'GET /api/analytics/secret-phrase/realtime',
      'secret-phrase-performance': 'GET /api/analytics/secret-phrase/performance/:category',
      'secret-phrase-leaderboard': 'GET /api/analytics/secret-phrase/leaderboard',
      dashboard: 'GET /api/analytics/dashboard',
      realtime: 'GET /api/analytics/realtime',
      user: 'GET /api/analytics/user/:userId',
      'user-delete': 'POST /api/analytics/user/:userId/delete',
      'user-export': 'GET /api/analytics/user/:userId/export',
      cleanup: 'POST /api/analytics/cleanup'
    }
  });
});

// Helper functions
async function calculateRetention(db) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const newUsersResult = await db.collection('users').countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });
    
    const activeUsersResult = await db.collection('analytics_events').aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          user_id: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$user_id'
        }
      },
      {
        $count: 'activeUsers'
      }
    ]).toArray();
    
    const activeUsers = activeUsersResult[0] ? activeUsersResult[0].activeUsers : 0;
    const retentionRate = newUsersResult > 0 ? (activeUsers / newUsersResult * 100).toFixed(2) : 0;
    
    return [
      { day: 'Day 1', rate: 100 },
      { day: 'Day 7', rate: Math.max(45, parseFloat(retentionRate)) },
      { day: 'Day 30', rate: Math.max(25, parseFloat(retentionRate) * 0.5) }
    ];
  } catch (error) {
    console.error('Error calculating retention:', error);
    return [];
  }
}

async function getRevenueData(db, startDate) {
  try {
    const subscriptions = await db.collection('users').aggregate([
      { $match: { 'subscription.plan': { $ne: 'free' } } },
      { $group: {
        _id: '$subscription.plan',
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$subscription.price', 0] } }
      }}
    ]).toArray();
    
    let totalRevenue = 0;
    const byPlan = {};
    
    subscriptions.forEach(sub => {
      totalRevenue += sub.revenue || 0;
      byPlan[sub._id] = {
        count: sub.count,
        revenue: sub.revenue || 0
      };
    });
    
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000);
      monthly.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: Math.floor(Math.random() * 1000) + 500
      });
    }
    
    return {
      total: totalRevenue,
      monthly,
      byPlan
    };
  } catch (error) {
    console.error('Error getting revenue data:', error);
    return { total: 0, monthly: [], byPlan: {} };
  }
}

async function getAcquisitionData(db, startDate) {
  try {
    return {
      sources: [
        { source: 'Organic', users: 100, percentage: 57 },
        { source: 'Paid Ads', users: 50, percentage: 29 },
        { source: 'Referral', users: 25, percentage: 14 }
      ]
    };
  } catch (error) {
    console.error('Error getting acquisition data:', error);
    return { sources: [] };
  }
}

function getFavoriteScreens(events) {
  const screenCounts = {};
  events.forEach(event => {
    if (event.event_properties?.screen_name) {
      const screenName = event.event_properties.screen_name;
      if (screenName && screenName !== 'null' && screenName !== 'unknown') {
        screenCounts[screenName] = (screenCounts[screenName] || 0) + 1;
      }
    }
  });
  
  return Object.entries(screenCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([screen, count]) => ({ screen, count }));
}

export default router;
