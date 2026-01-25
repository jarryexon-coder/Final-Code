const express = require('express');
const router = express.Router();
const SecretPhraseAnalytics = require('../models/SecretPhraseAnalytics');
const User = require('../models/User');

// POST: Log a secret phrase event
router.post('/log-event', async (req, res) => {
  try {
    const {
      userId,
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
      metadata
    } = req.body;

    const event = new SecretPhraseAnalytics({
      userId,
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
      metadata
    });

    await event.save();

    // Update user's secret phrase stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'analyticsMetrics.secretPhraseDiscoveries': eventType === 'discovery' ? 1 : 0,
        'analyticsMetrics.secretPhraseUses': eventType === 'usage' ? 1 : 0
      },
      $set: { 
        'analyticsMetrics.lastSecretPhraseUse': new Date(),
        'analyticsMetrics.mostUsedPhrase': phraseKey // This would need logic to track most used
      }
    });

    res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    console.error('Error logging secret phrase event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Aggregate analytics for secret phrases
router.get('/aggregate', async (req, res) => {
  try {
    const { startDate, endDate, userId, category } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }
    if (userId) matchStage.userId = userId;
    if (category) matchStage.phraseCategory = category;

    const aggregation = await SecretPhraseAnalytics.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Overall stats
          overallStats: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                uniquePhrases: { $addToSet: '$phraseKey' },
                totalDiscoveries: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'discovery'] }, 1, 0] }
                },
                totalUsages: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'usage'] }, 1, 0] }
                },
                totalPerformanceUpdates: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'performance_update'] }, 1, 0] }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalEvents: 1,
                uniqueUserCount: { $size: '$uniqueUsers' },
                uniquePhraseCount: { $size: '$uniquePhrases' },
                totalDiscoveries: 1,
                totalUsages: 1,
                totalPerformanceUpdates: 1,
                discoveryRate: {
                  $cond: [
                    { $eq: ['$totalEvents', 0] },
                    0,
                    { $divide: ['$totalDiscoveries', '$totalEvents'] }
                  ]
                }
              }
            }
          ],

          // By phrase key
          byPhrase: [
            {
              $group: {
                _id: '$phraseKey',
                count: { $sum: 1 },
                discoveries: { $sum: { $cond: [{ $eq: ['$eventType', 'discovery'] }, 1, 0] } },
                usages: { $sum: { $cond: [{ $eq: ['$eventType', 'usage'] }, 1, 0] } },
                avgConfidence: { $avg: { $toDouble: '$confidence' } },
                users: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                phraseKey: '$_id',
                _id: 0,
                count: 1,
                discoveries: 1,
                usages: 1,
                userCount: { $size: '$users' },
                avgConfidence: { $round: ['$avgConfidence', 2] }
              }
            },
            { $sort: { count: -1 } }
          ],

          // By category
          byCategory: [
            {
              $group: {
                _id: '$phraseCategory',
                count: { $sum: 1 },
                phrases: { $addToSet: '$phraseKey' }
              }
            },
            {
              $project: {
                category: '$_id',
                _id: 0,
                count: 1,
                uniquePhrases: { $size: '$phrases' }
              }
            },
            { $sort: { count: -1 } }
          ],

          // By rarity
          byRarity: [
            {
              $group: {
                _id: '$rarity',
                count: { $sum: 1 },
                phrases: { $addToSet: '$phraseKey' }
              }
            },
            {
              $project: {
                rarity: '$_id',
                _id: 0,
                count: 1,
                uniquePhrases: { $size: '$phrases' }
              }
            },
            { $sort: { count: -1 } }
          ],

          // By time (hour of day)
          byHour: [
            {
              $group: {
                _id: { $hour: '$timestamp' },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ],

          // Performance metrics (win/loss)
          performance: [
            { $match: { eventType: 'performance_update' } },
            {
              $group: {
                _id: '$phraseKey',
                totalBets: { $sum: 1 },
                wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
                losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
                pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
                totalUnits: { $sum: '$unitsWon' },
                avgOdds: { $avg: { $toDouble: { $substr: ['$odds', 1, -1] } } }
              }
            },
            {
              $project: {
                phraseKey: '$_id',
                _id: 0,
                totalBets: 1,
                wins: 1,
                losses: 1,
                pushes: 1,
                winRate: { 
                  $cond: [
                    { $eq: ['$totalBets', 0] },
                    0,
                    { $divide: ['$wins', '$totalBets'] }
                  ]
                },
                roi: {
                  $cond: [
                    { $eq: ['$totalBets', 0] },
                    0,
                    { $divide: ['$totalUnits', '$totalBets'] }
                  ]
                },
                avgOdds: { $round: ['$avgOdds', 2] }
              }
            },
            { $sort: { winRate: -1 } }
          ],

          // Recent activity
          recentActivity: [
            { $sort: { timestamp: -1 } },
            { $limit: 50 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                phraseKey: 1,
                eventType: 1,
                timestamp: 1,
                sport: 1,
                playerName: 1,
                odds: 1,
                confidence: 1,
                userName: '$user.username',
                userAvatar: '$user.avatar'
              }
            }
          ],

          // User leaderboard
          userLeaderboard: [
            {
              $group: {
                _id: '$userId',
                phraseCount: { $sum: 1 },
                uniquePhrases: { $addToSet: '$phraseKey' },
                lastActivity: { $max: '$timestamp' }
              }
            },
            { $sort: { phraseCount: -1 } },
            { $limit: 20 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                userName: '$user.username',
                userAvatar: '$user.avatar',
                phraseCount: 1,
                uniquePhraseCount: { $size: '$uniquePhrases' },
                lastActivity: 1
              }
            }
          ]
        }
      }
    ]);

    res.json(aggregation[0]);
  } catch (error) {
    console.error('Error fetching secret phrase analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: User-specific analytics
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const [userStats, recentEvents, performance] = await Promise.all([
      // User stats
      SecretPhraseAnalytics.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            discoveries: { $sum: { $cond: [{ $eq: ['$eventType', 'discovery'] }, 1, 0] } },
            usages: { $sum: { $cond: [{ $eq: ['$eventType', 'usage'] }, 1, 0] } },
            uniquePhrases: { $addToSet: '$phraseKey' },
            categories: { $addToSet: '$phraseCategory' },
            firstDiscovery: { $min: '$timestamp' },
            lastActivity: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            _id: 0,
            totalEvents: 1,
            discoveries: 1,
            usages: 1,
            uniquePhraseCount: { $size: '$uniquePhrases' },
            categoryCount: { $size: '$categories' },
            firstDiscovery: 1,
            lastActivity: 1
          }
        }
      ]),

      // Recent events
      SecretPhraseAnalytics.find({ userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('phraseKey eventType timestamp sport playerName odds confidence'),

      // Performance
      SecretPhraseAnalytics.aggregate([
        { $match: { userId, eventType: 'performance_update' } },
        {
          $group: {
            _id: '$phraseKey',
            totalBets: { $sum: 1 },
            wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
            losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
            totalUnits: { $sum: '$unitsWon' }
          }
        },
        {
          $project: {
            phraseKey: '$_id',
            _id: 0,
            totalBets: 1,
            wins: 1,
            losses: 1,
            winRate: {
              $cond: [
                { $eq: ['$totalBets', 0] },
                0,
                { $divide: ['$wins', '$totalBets'] }
              ]
            },
            roi: {
              $cond: [
                { $eq: ['$totalBets', 0] },
                0,
                { $divide: ['$totalUnits', '$totalBets'] }
              ]
            }
          }
        }
      ])
    ]);

    res.json({
      userStats: userStats[0] || {},
      recentEvents,
      performance,
      achievements: calculateUserAchievements(userStats[0])
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function for achievements
function calculateUserAchievements(stats) {
  if (!stats) return [];
  
  const achievements = [];
  
  if (stats.discoveries >= 1) {
    achievements.push({
      name: 'Phrase Hunter',
      description: 'Discover your first secret phrase',
      unlocked: true
    });
  }
  
  if (stats.uniquePhraseCount >= 5) {
    achievements.push({
      name: 'Code Breaker',
      description: 'Discover 5 different secret phrases',
      unlocked: true
    });
  }
  
  if (stats.totalEvents >= 50) {
    achievements.push({
      name: 'Frequent User',
      description: 'Use secret phrases 50+ times',
      unlocked: true
    });
  }
  
  return achievements;
}

// GET: Phrase performance comparison
router.get('/performance/compare', async (req, res) => {
  try {
    const { phrases = [], timeFrame = '30days' } = req.query;
    
    const timeFrameMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': 3650 // 10 years
    };
    
    const days = timeFrameMap[timeFrame] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const matchStage = {
      eventType: 'performance_update',
      timestamp: { $gte: startDate }
    };
    
    if (phrases.length > 0) {
      matchStage.phraseKey = { $in: phrases.split(',') };
    }
    
    const performance = await SecretPhraseAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$phraseKey',
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
          totalUnits: { $sum: '$unitsWon' },
          avgConfidence: { $avg: { $toDouble: '$confidence' } },
          avgOdds: { $avg: { $toDouble: { $substr: ['$odds', 1, -1] } } }
        }
      },
      {
        $project: {
          phraseKey: '$_id',
          _id: 0,
          totalBets: 1,
          wins: 1,
          losses: 1,
          pushes: 1,
          winRate: {
            $cond: [
              { $eq: ['$totalBets', 0] },
              0,
              { $divide: ['$wins', '$totalBets'] }
            ]
          },
          roi: {
            $cond: [
              { $eq: ['$totalBets', 0] },
              0,
              { $divide: ['$totalUnits', '$totalBets'] }
            ]
          },
          avgConfidence: { $round: ['$avgConfidence', 2] },
          avgOdds: { $round: ['$avgOdds', 2] }
        }
      },
      { $sort: { winRate: -1 } }
    ]);
    
    res.json(performance);
  } catch (error) {
    console.error('Error comparing phrase performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
