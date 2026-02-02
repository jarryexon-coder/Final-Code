// prizepicksLimitsRoutes.js - Updated with Odds API integration and JSDoc documentation
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "prizepicksLimits API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * @swagger
 * /api/prizepicks/limits/odds:
 *   get:
 *     summary: Get odds data with limits information
 *     description: Fetch current odds data with limits analysis to understand betting restrictions and market constraints
 *     tags: [PrizePicks-Limits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport to get odds and limits for
 *       - in: query
 *         name: analyzeLimits
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Analyze betting limits and restrictions
 *       - in: query
 *         name: includeBookmakerLimits
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include individual bookmaker limits analysis
 *     responses:
 *       200:
 *         description: Odds and limits data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 odds:
 *                   type: array
 *                   items:
 *                     type: object
 *                 limitsAnalysis:
 *                   type: object
 *                 recommendations:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch odds and limits data
 */
router.get('/odds', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        limitsData: {
          available: false,
          message: 'Odds API key required for limits analysis'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      analyzeLimits = true,
      includeBookmakerLimits = false
    } = req.query;

    // Fetch odds data from The Odds API
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions: 'us',
        markets: 'player_points,player_rebounds,player_assists',
        oddsFormat: 'american',
        dateFormat: 'iso'
      }
    });

    const oddsData = response.data;
    
    // Analyze limits based on odds data
    const limitsAnalysis = analyzeLimits ? analyzeBettingLimits(oddsData, includeBookmakerLimits) : null;
    
    // Get user's current limits
    const user = await User.findById(req.userId);
    const userLimits = {
      dailySelections: user?.dailySelections || 10,
      selectionsUsed: user?.selectionsUsed || 0,
      selectionsLeft: Math.max(0, (user?.dailySelections || 10) - (user?.selectionsUsed || 0)),
      resetTime: calculateNextResetTime(user)
    };

    res.json({
      success: true,
      odds: oddsData,
      limitsAnalysis: limitsAnalysis,
      userLimits: userLimits,
      recommendations: generateLimitRecommendations(userLimits, oddsData),
      timestamp: new Date().toISOString(),
      metadata: {
        sport: sport,
        totalMarkets: oddsData.length,
        limitsAnalysisPerformed: analyzeLimits
      }
    });
    
  } catch (error) {
    console.error('Limits odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Odds API error: ${error.response.data.message || error.response.statusText}`,
        limitsData: generateFallbackLimitsData(),
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds for limits analysis',
        limitsData: generateFallbackLimitsData()
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/limits/odds/live:
 *   get:
 *     summary: Get live odds with limits monitoring
 *     description: Fetch real-time live odds data with limits monitoring to track market restrictions and in-game betting caps
 *     tags: [PrizePicks-Limits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport for live limits monitoring
 *       - in: query
 *         name: monitorLimits
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Monitor live betting limits and restrictions
 *       - in: query
 *         name: alertThreshold
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 80
 *         description: Usage threshold for generating alerts (percentage)
 *     responses:
 *       200:
 *         description: Live odds and limits data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liveOdds:
 *                   type: array
 *                 limitsMonitoring:
 *                   type: object
 *                 alerts:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch live limits data
 */
router.get('/odds/live', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        liveLimitsData: {
          available: false,
          message: 'Odds API key required for live limits monitoring'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      monitorLimits = true,
      alertThreshold = 80
    } = req.query;

    // Fetch live odds data
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions: 'us',
        markets: 'player_points,player_rebounds,player_assists',
        oddsFormat: 'american',
        live: true
      }
    });

    const liveData = response.data;
    
    // Get user's current usage
    const user = await User.findById(req.userId);
    const userUsage = {
      selectionsUsed: user?.selectionsUsed || 0,
      dailyLimit: user?.dailySelections || 10,
      usagePercentage: ((user?.selectionsUsed || 0) / (user?.dailySelections || 10)) * 100,
      remaining: Math.max(0, (user?.dailySelections || 10) - (user?.selectionsUsed || 0))
    };

    // Monitor limits
    const limitsMonitoring = monitorLimits ? monitorLiveLimits(liveData, userUsage) : null;
    
    // Generate alerts if threshold exceeded
    const alerts = userUsage.usagePercentage >= alertThreshold ? 
      generateLimitAlerts(userUsage, alertThreshold) : [];

    res.json({
      success: true,
      liveOdds: liveData,
      limitsMonitoring: limitsMonitoring,
      userUsage: userUsage,
      alerts: alerts,
      timestamp: new Date().toISOString(),
      metadata: {
        sport: sport,
        totalLiveMarkets: liveData.length,
        monitoringActive: monitorLimits,
        alertThreshold: alertThreshold
      }
    });
    
  } catch (error) {
    console.error('Live limits odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Live Odds API error: ${error.response.data.message || error.response.statusText}`,
        liveLimitsData: generateFallbackLiveLimitsData(),
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live odds for limits monitoring',
        liveLimitsData: generateFallbackLiveLimitsData()
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/limits/daily-limits:
 *   get:
 *     summary: Get user's daily limits information
 *     description: Retrieve current daily limits, usage statistics, and reset information for PrizePicks selections
 *     tags: [PrizePicks-Limits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 limits:
 *                   type: object
 *                   properties:
 *                     selectionsLeft:
 *                       type: integer
 *                     selectionsUsed:
 *                       type: integer
 *                     dailySelections:
 *                       type: integer
 *                     resetsAt:
 *                       type: string
 *                       format: date-time
 *                     todaySelections:
 *                       type: integer
 *                     winnersToday:
 *                       type: integer
 *                     usagePercentage:
 *                       type: number
 *                 recommendations:
 *                   type: array
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to get daily limits
 */
router.get('/daily-limits', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if daily reset is needed (reset at 9 AM UTC)
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    const shouldReset = now.getUTCHours() >= 9 && 
                      (now.getUTCDate() !== lastReset.getUTCDate() || 
                       now.getUTCMonth() !== lastReset.getUTCMonth() ||
                       now.getUTCFullYear() !== lastReset.getUTCFullYear());
    
    if (shouldReset) {
      user.selectionsUsed = 0;
      user.lastReset = now;
      await user.save();
    }
    
    const selectionsLeft = Math.max(0, user.dailySelections - user.selectionsUsed);
    const resetTime = new Date(now);
    resetTime.setUTCHours(9, 0, 0, 0);
    if (now.getUTCHours() >= 9) {
      resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    }
    
    // Calculate usage percentage
    const usagePercentage = user.dailySelections > 0 ? 
      (user.selectionsUsed / user.dailySelections) * 100 : 0;
    
    // Generate recommendations based on usage
    const recommendations = generateUsageRecommendations(selectionsLeft, usagePercentage);
    
    res.json({
      success: true,
      limits: {
        selectionsLeft,
        selectionsUsed: user.selectionsUsed,
        dailySelections: user.dailySelections,
        resetsAt: resetTime.toISOString(),
        todaySelections: user.selectionsUsed,
        winnersToday: 0, // You'll need to track this separately
        usagePercentage: Math.round(usagePercentage * 10) / 10,
        timeUntilReset: calculateTimeUntilReset(resetTime, now)
      },
      recommendations: recommendations,
      metadata: {
        userId: user._id,
        username: user.username,
        lastReset: user.lastReset
      }
    });
    
  } catch (error) {
    console.error('Daily limits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily limits'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/limits/reset-daily-limit:
 *   post:
 *     summary: Reset daily limit (admin only)
 *     description: Reset the daily selection limit for a user. Admin access required.
 *     tags: [PrizePicks-Limits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to reset
 *               reason:
 *                 type: string
 *                 description: Reason for reset (optional)
 *     responses:
 *       200:
 *         description: Daily limit reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to reset daily limit
 */
router.post('/reset-daily-limit', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId, reason } = req.body;
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }
    
    // Store previous values for audit
    const previousSelectionsUsed = targetUser.selectionsUsed;
    const previousLastReset = targetUser.lastReset;
    
    targetUser.selectionsUsed = 0;
    targetUser.lastReset = new Date();
    await targetUser.save();
    
    // Log the reset action
    console.log(`Daily limit reset by admin ${user.username} for user ${targetUser.username}. Reason: ${reason || 'Not specified'}. Previous: ${previousSelectionsUsed} selections used.`);
    
    res.json({
      success: true,
      message: 'Daily limit reset successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        selectionsUsed: targetUser.selectionsUsed,
        lastReset: targetUser.lastReset,
        previousSelectionsUsed,
        previousLastReset
      },
      audit: {
        resetBy: user.username,
        resetAt: new Date().toISOString(),
        reason: reason
      }
    });
    
  } catch (error) {
    console.error('Reset limit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset daily limit'
    });
  }
});

// Helper functions for limits analysis

function analyzeBettingLimits(oddsData, includeBookmakerLimits) {
  const analysis = {
    totalMarkets: oddsData.length,
    averageOdds: 0,
    marketRestrictions: [],
    suggestedLimits: {
      maxSelectionsPerDay: 10,
      maxStakePerSelection: 100,
      recommendedStake: 25
    }
  };
  
  // Analyze odds data for limits
  let totalOddsValue = 0;
  let count = 0;
  
  oddsData.forEach(game => {
    game.bookmakers?.forEach(bookmaker => {
      bookmaker.markets?.forEach(market => {
        market.outcomes?.forEach(outcome => {
          if (outcome.price) {
            totalOddsValue += Math.abs(outcome.price);
            count++;
          }
        });
      });
    });
  });
  
  analysis.averageOdds = count > 0 ? Math.round(totalOddsValue / count) : 0;
  
  // Add bookmaker-specific limits if requested
  if (includeBookmakerLimits) {
    analysis.bookmakerLimits = extractBookmakerLimits(oddsData);
  }
  
  return analysis;
}

function extractBookmakerLimits(oddsData) {
  const bookmakerLimits = {};
  
  oddsData.forEach(game => {
    game.bookmakers?.forEach(bookmaker => {
      if (!bookmakerLimits[bookmaker.key]) {
        bookmakerLimits[bookmaker.key] = {
          count: 0,
          markets: new Set(),
          hasPlayerProps: false
        };
      }
      bookmakerLimits[bookmaker.key].count++;
      
      bookmaker.markets?.forEach(market => {
        bookmakerLimits[bookmaker.key].markets.add(market.key);
        if (market.key.startsWith('player_')) {
          bookmakerLimits[bookmaker.key].hasPlayerProps = true;
        }
      });
    });
  });
  
  return bookmakerLimits;
}

function calculateNextResetTime(user) {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setUTCHours(9, 0, 0, 0);
  
  if (now.getUTCHours() >= 9) {
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
  }
  
  return resetTime.toISOString();
}

function calculateTimeUntilReset(resetTime, currentTime) {
  const reset = new Date(resetTime);
  const now = currentTime || new Date();
  const diffMs = reset - now;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function generateLimitRecommendations(userLimits, oddsData) {
  const recommendations = [];
  
  if (userLimits.selectionsLeft <= 2) {
    recommendations.push({
      type: 'warning',
      message: 'Low selection limit remaining',
      action: 'Consider quality over quantity for remaining selections'
    });
  }
  
  if (userLimits.selectionsLeft >= 5) {
    recommendations.push({
      type: 'suggestion',
      message: 'Good selection availability',
      action: 'Explore diverse market opportunities'
    });
  }
  
  // Add odds-based recommendations
  if (oddsData && oddsData.length > 0) {
    recommendations.push({
      type: 'analysis',
      message: `${oddsData.length} markets available`,
      action: 'Review market analysis for optimal selection strategy'
    });
  }
  
  return recommendations;
}

function generateUsageRecommendations(selectionsLeft, usagePercentage) {
  const recommendations = [];
  
  if (usagePercentage >= 90) {
    recommendations.push({
      priority: 'high',
      message: 'Approaching daily limit',
      advice: 'Reserve remaining selections for highest confidence picks'
    });
  } else if (usagePercentage >= 70) {
    recommendations.push({
      priority: 'medium',
      message: 'High usage level',
      advice: 'Consider strategic allocation of remaining selections'
    });
  } else if (selectionsLeft <= 3) {
    recommendations.push({
      priority: 'medium',
      message: 'Limited selections remaining',
      advice: 'Focus on quality opportunities'
    });
  }
  
  return recommendations;
}

function monitorLiveLimits(liveData, userUsage) {
  return {
    liveMarkets: liveData.length,
    userUsage: userUsage,
    limitStatus: userUsage.usagePercentage >= 90 ? 'critical' : 
                 userUsage.usagePercentage >= 70 ? 'high' : 
                 userUsage.usagePercentage >= 50 ? 'moderate' : 'low',
    monitoringActive: true,
    lastCheck: new Date().toISOString()
  };
}

function generateLimitAlerts(userUsage, threshold) {
  const alerts = [];
  
  if (userUsage.usagePercentage >= threshold) {
    alerts.push({
      type: 'usage_alert',
      severity: userUsage.usagePercentage >= 90 ? 'high' : 'medium',
      message: `Usage at ${Math.round(userUsage.usagePercentage)}% of daily limit`,
      remainingSelections: userUsage.remaining,
      action: 'Consider strategic use of remaining selections'
    });
  }
  
  if (userUsage.remaining <= 1) {
    alerts.push({
      type: 'limit_alert',
      severity: 'high',
      message: 'Only one selection remaining',
      action: 'Use remaining selection wisely'
    });
  }
  
  return alerts;
}

function generateFallbackLimitsData() {
  return {
    limitsAnalysis: {
      totalMarkets: 0,
      averageOdds: 0,
      marketRestrictions: [],
      suggestedLimits: {
        maxSelectionsPerDay: 10,
        maxStakePerSelection: 100,
        recommendedStake: 25
      },
      note: 'Fallback data - API unavailable'
    },
    recommendations: [
      {
        type: 'info',
        message: 'Using fallback limits data',
        action: 'Check API configuration'
      }
    ]
  };
}

function generateFallbackLiveLimitsData() {
  return {
    limitsMonitoring: {
      liveMarkets: 0,
      limitStatus: 'unknown',
      monitoringActive: false,
      lastCheck: new Date().toISOString(),
      note: 'Fallback data - Live API unavailable'
    },
    alerts: [
      {
        type: 'system',
        severity: 'low',
        message: 'Live limits monitoring unavailable',
        action: 'Check API connectivity'
      }
    ]
  };
}

export default router;
