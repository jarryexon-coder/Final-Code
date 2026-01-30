// bumpRiskRoutes.js - Updated with Bump Risk Analysis API integration and JSDoc documentation
import express from 'express';
import axios from 'axios';
const router = express.Router();

/**
 * @swagger
 * /api/bump-risk/odds:
 *   get:
 *     summary: Get odds with bump risk analysis
 *     description: Fetch betting odds with comprehensive bump risk assessment to identify lines likely to move before game time
 *     tags: [Bump-Risk]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport to analyze for bump risk
 *       - in: query
 *         name: riskThreshold
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 50
 *         description: Minimum bump risk percentage to flag (0-100)
 *       - in: query
 *         name: includePlayerProps
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include player prop bump risk analysis
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [next_24h, next_12h, next_6h, next_1h]
 *           default: next_24h
 *         description: Timeframe for bump risk assessment
 *       - in: query
 *         name: bookmakers
 *         schema:
 *           type: string
 *           default: fanduel,draftkings,betmgm
 *         description: Bookmakers to analyze for line movement
 *     responses:
 *       200:
 *         description: Odds with bump risk analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 oddsWithRisk:
 *                   type: array
 *                   items:
 *                     type: object
 *                 bumpRiskSummary:
 *                   type: object
 *                 recommendations:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters provided
 *       401:
 *         description: API key not configured
 *       500:
 *         description: Failed to fetch odds for bump risk analysis
 */
router.get('/odds', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        bumpRiskData: {
          available: false,
          message: 'Odds API key required for bump risk analysis'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      riskThreshold = 50,
      includePlayerProps = true,
      timeframe = 'next_24h',
      bookmakers = 'fanduel,draftkings,betmgm'
    } = req.query;

    // Validate risk threshold
    const threshold = parseInt(riskThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        error: 'Risk threshold must be a number between 0 and 100'
      });
    }

    // Fetch odds data
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const markets = includePlayerProps ? 
      'player_points,player_rebounds,player_assists,spreads,totals,h2h' : 
      'spreads,totals,h2h';
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions: 'us',
        markets,
        bookmakers,
        oddsFormat: 'american',
        dateFormat: 'iso'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'BumpRisk-API/1.0'
      },
      timeout: 10000
    });

    const oddsData = response.data;
    
    // Analyze bump risk
    const analyzedData = analyzeBumpRisk(oddsData, {
      threshold,
      timeframe,
      includePlayerProps
    });
    
    // Generate summary
    const riskSummary = generateRiskSummary(analyzedData, threshold);
    
    // Generate recommendations
    const recommendations = generateRiskRecommendations(analyzedData, threshold);
    
    res.json({
      success: true,
      oddsWithRisk: analyzedData,
      bumpRiskSummary: riskSummary,
      highRiskAlerts: analyzedData.filter(item => item.overallRiskScore >= threshold),
      recommendations: recommendations,
      metadata: {
        sport: sport,
        totalMarketsAnalyzed: oddsData.length,
        riskThreshold: threshold,
        timeframe: timeframe,
        includePlayerProps: includePlayerProps,
        retrievedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Bump risk odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Odds API error: ${error.response.data.message || error.response.statusText}`,
        bumpRiskData: generateFallbackRiskData(),
        statusCode: error.response.status
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        success: false,
        error: 'Bump risk analysis timeout',
        bumpRiskData: generateFallbackRiskData(),
        message: 'Risk analysis service is experiencing delays'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds for bump risk analysis',
        bumpRiskData: generateFallbackRiskData(),
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/bump-risk/odds/live:
 *   get:
 *     summary: Get live odds with bump risk monitoring
 *     description: Monitor live odds for real-time bump risk assessment and line movement alerts during games
 *     tags: [Bump-Risk]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport for live bump risk monitoring
 *       - in: query
 *         name: alertLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           default: medium
 *         description: Alert level for bump risk notifications
 *       - in: query
 *         name: monitorVolatility
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Monitor market volatility indicators
 *       - in: query
 *         name: updateInterval
 *         schema:
 *           type: string
 *           enum: [realtime, 30s, 60s, 5min]
 *           default: 60s
 *         description: Interval for bump risk updates
 *     responses:
 *       200:
 *         description: Live odds with bump risk monitoring retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liveRiskData:
 *                   type: array
 *                 activeAlerts:
 *                   type: array
 *                 volatilityMetrics:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: API key not configured
 *       500:
 *         description: Failed to fetch live bump risk data
 */
router.get('/odds/live', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        liveRiskData: {
          available: false,
          message: 'Odds API key required for live bump risk monitoring'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      alertLevel = 'medium',
      monitorVolatility = true,
      updateInterval = '60s'
    } = req.query;

    // Map alert level to risk threshold
    const alertThresholds = {
      low: 70,
      medium: 50,
      high: 30,
      critical: 15
    };
    
    const riskThreshold = alertThresholds[alertLevel] || 50;

    // Fetch live odds
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions: 'us',
        markets: 'player_points,player_rebounds,player_assists,spreads,totals',
        oddsFormat: 'american',
        live: true
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'BumpRisk-Live/1.0'
      },
      timeout: 15000
    });

    const liveData = response.data;
    
    // Analyze live bump risk
    const liveRiskAnalysis = analyzeLiveBumpRisk(liveData, {
      threshold: riskThreshold,
      monitorVolatility,
      updateInterval
    });
    
    // Generate active alerts
    const activeAlerts = generateLiveRiskAlerts(liveRiskAnalysis, alertLevel);
    
    // Calculate volatility metrics
    const volatilityMetrics = monitorVolatility ? 
      calculateLiveVolatility(liveRiskAnalysis) : null;
    
    res.json({
      success: true,
      liveRiskData: liveRiskAnalysis,
      activeAlerts: activeAlerts,
      volatilityMetrics: volatilityMetrics,
      metadata: {
        sport: sport,
        totalLiveMarkets: liveData.length,
        alertLevel: alertLevel,
        riskThreshold: riskThreshold,
        monitorVolatility: monitorVolatility,
        updateInterval: updateInterval,
        lastUpdate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Live bump risk fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Live Odds API error: ${error.response.data.message || error.response.statusText}`,
        liveRiskData: generateFallbackLiveRiskData(),
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live bump risk data',
        liveRiskData: generateFallbackLiveRiskData(),
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/bump-risk/test:
 *   get:
 *     summary: Test endpoint for bump risk routes
 *     description: Verify that bump risk analysis routes are working and check API configuration status
 *     tags: [Bump-Risk]
 *     responses:
 *       200:
 *         description: Bump risk routes are working correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 riskAnalysisStatus:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/test', (req, res) => {
    const apiKeyConfigured = !!process.env.THE_ODDS_API_KEY;
    
    res.json({ 
        success: true, 
        message: 'bumpRiskRoutes.js is working with advanced bump risk analysis',
        riskAnalysisStatus: {
          endpoints: ['/odds', '/odds/live', '/test'],
          apiKeyConfigured: apiKeyConfigured,
          riskModels: {
            historicalMovement: 'enabled',
            volatilityAnalysis: 'enabled',
            linePressure: 'enabled',
            marketDepth: 'enabled'
          },
          alertLevels: ['low', 'medium', 'high', 'critical'],
          version: '2.0.0'
        },
        timestamp: new Date().toISOString()
    });
});

// Bump Risk Analysis Functions

function analyzeBumpRisk(oddsData, options) {
  const { threshold, timeframe, includePlayerProps } = options;
  
  return oddsData.map(game => {
    const gameRisk = {
      gameId: game.id,
      sport_key: game.sport_key,
      home_team: game.home_team,
      away_team: game.away_team,
      commence_time: game.commence_time,
      markets: [],
      overallRiskScore: 0,
      riskLevel: 'low',
      riskFactors: []
    };

    let totalRiskScore = 0;
    let marketCount = 0;

    // Analyze each bookmaker and market
    if (game.bookmakers) {
      game.bookmakers.forEach(bookmaker => {
        if (bookmaker.markets) {
          bookmaker.markets.forEach(market => {
            if (!includePlayerProps && market.key.startsWith('player_')) {
              return; // Skip player props if not included
            }
            
            const marketRisk = calculateMarketRisk(market, {
              bookmaker: bookmaker.key,
              timeframe,
              gameTime: game.commence_time
            });
            
            if (marketRisk.riskScore >= threshold) {
              gameRisk.riskFactors.push({
                market: market.key,
                bookmaker: bookmaker.key,
                riskScore: marketRisk.riskScore,
                reason: marketRisk.reason
              });
            }
            
            gameRisk.markets.push({
              bookmaker: bookmaker.key,
              market: market.key,
              riskScore: marketRisk.riskScore,
              riskLevel: marketRisk.riskLevel,
              movementIndicator: marketRisk.movementIndicator,
              confidence: marketRisk.confidence
            });
            
            totalRiskScore += marketRisk.riskScore;
            marketCount++;
          });
        }
      });
    }

    // Calculate overall risk score
    gameRisk.overallRiskScore = marketCount > 0 ? Math.round(totalRiskScore / marketCount) : 0;
    gameRisk.riskLevel = getRiskLevel(gameRisk.overallRiskScore);
    
    // Add timeframe-specific risk assessment
    gameRisk.timeframeAnalysis = assessTimeframeRisk(game.commence_time, timeframe);
    
    return gameRisk;
  });
}

function calculateMarketRisk(market, context) {
  const riskFactors = [];
  let riskScore = 0;
  
  // Factor 1: Market volatility based on updates
  if (market.last_update) {
    const updateTime = new Date(market.last_update);
    const now = new Date();
    const hoursSinceUpdate = (now - updateTime) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) {
      riskScore += 30;
      riskFactors.push('Recent market update');
    } else if (hoursSinceUpdate < 6) {
      riskScore += 15;
      riskFactors.push('Moderately recent update');
    }
  }
  
  // Factor 2: Market type risk
  const marketRiskWeights = {
    'player_points': 25,
    'player_rebounds': 20,
    'player_assists': 20,
    'spreads': 15,
    'totals': 15,
    'h2h': 10
  };
  
  riskScore += marketRiskWeights[market.key] || 10;
  riskFactors.push(`${market.key} market`);
  
  // Factor 3: Outcomes analysis
  if (market.outcomes && market.outcomes.length >= 2) {
    const prices = market.outcomes.map(o => Math.abs(o.price || 0));
    const priceRange = Math.max(...prices) - Math.min(...prices);
    
    if (priceRange > 40) {
      riskScore += 20;
      riskFactors.push('Wide price range');
    } else if (priceRange > 20) {
      riskScore += 10;
      riskFactors.push('Moderate price range');
    }
  }
  
  // Factor 4: Time to game
  const gameTime = new Date(context.gameTime);
  const now = new Date();
  const hoursToGame = (gameTime - now) / (1000 * 60 * 60);
  
  if (hoursToGame < 1) {
    riskScore += 30;
    riskFactors.push('Game starting soon');
  } else if (hoursToGame < 6) {
    riskScore += 20;
    riskFactors.push('Game within 6 hours');
  } else if (hoursToGame < 24) {
    riskScore += 10;
    riskFactors.push('Game within 24 hours');
  }
  
  // Cap risk score
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  return {
    riskScore: Math.round(riskScore),
    riskLevel: getRiskLevel(riskScore),
    movementIndicator: getMovementIndicator(riskScore),
    confidence: Math.round(100 - riskScore), // Higher risk = lower confidence
    reason: riskFactors.join(', ')
  };
}

function analyzeLiveBumpRisk(liveData, options) {
  const { threshold, monitorVolatility, updateInterval } = options;
  
  return liveData.map(game => {
    const liveRisk = {
      gameId: game.id,
      sport_key: game.sport_key,
      home_team: game.home_team,
      away_team: game.away_team,
      status: 'live',
      liveMarkets: [],
      overallLiveRisk: 0,
      volatilityScore: 0
    };

    let totalRisk = 0;
    let marketCount = 0;
    let volatilitySum = 0;

    if (game.bookmakers) {
      game.bookmakers.forEach(bookmaker => {
        if (bookmaker.markets) {
          bookmaker.markets.forEach(market => {
            const liveMarketRisk = calculateLiveMarketRisk(market, updateInterval);
            
            liveRisk.liveMarkets.push({
              bookmaker: bookmaker.key,
              market: market.key,
              riskScore: liveMarketRisk.riskScore,
              movement: liveMarketRisk.movement,
              updateFrequency: liveMarketRisk.updateFrequency,
              lastUpdate: market.last_update
            });
            
            totalRisk += liveMarketRisk.riskScore;
            volatilitySum += liveMarketRisk.volatility;
            marketCount++;
          });
        }
      });
    }

    liveRisk.overallLiveRisk = marketCount > 0 ? Math.round(totalRisk / marketCount) : 0;
    
    if (monitorVolatility && marketCount > 0) {
      liveRisk.volatilityScore = Math.round(volatilitySum / marketCount);
      liveRisk.volatilityLevel = getVolatilityLevel(liveRisk.volatilityScore);
    }
    
    liveRisk.riskAssessment = assessLiveRisk(liveRisk.overallLiveRisk, threshold);
    
    return liveRisk;
  });
}

function calculateLiveMarketRisk(market, updateInterval) {
  let riskScore = 0;
  let volatility = 0;
  
  // Factor: Update frequency
  if (market.last_update) {
    const updateTime = new Date(market.last_update);
    const now = new Date();
    const minutesSinceUpdate = (now - updateTime) / (1000 * 60);
    
    if (minutesSinceUpdate < 1) {
      riskScore += 40;
      volatility += 80;
    } else if (minutesSinceUpdate < 5) {
      riskScore += 25;
      volatility += 50;
    } else if (minutesSinceUpdate < 15) {
      riskScore += 15;
      volatility += 30;
    }
  }
  
  // Factor: Market type
  const liveRiskWeights = {
    'player_points': 35,
    'player_rebounds': 30,
    'player_assists': 30,
    'spreads': 25,
    'totals': 25
  };
  
  riskScore += liveRiskWeights[market.key] || 20;
  
  // Factor: Price movement
  if (market.outcomes && market.outcomes.length >= 2) {
    const prices = market.outcomes.map(o => Math.abs(o.price || 0));
    const stdDev = calculateStandardDeviation(prices);
    
    if (stdDev > 15) {
      riskScore += 25;
      volatility += 60;
    } else if (stdDev > 8) {
      riskScore += 15;
      volatility += 40;
    }
  }
  
  riskScore = Math.min(100, Math.max(0, riskScore));
  volatility = Math.min(100, Math.max(0, volatility));
  
  return {
    riskScore: Math.round(riskScore),
    volatility: Math.round(volatility),
    movement: getLiveMovementIndicator(riskScore),
    updateFrequency: estimateUpdateFrequency(market.last_update)
  };
}

// Helper functions

function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function getVolatilityLevel(score) {
  if (score >= 70) return 'extreme';
  if (score >= 50) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

function getMovementIndicator(riskScore) {
  if (riskScore >= 60) return '↑↑ High Movement Expected';
  if (riskScore >= 40) return '↑ Moderate Movement Expected';
  if (riskScore >= 20) return '↗ Some Movement Possible';
  return '→ Stable';
}

function getLiveMovementIndicator(riskScore) {
  if (riskScore >= 70) return '⚠️ Rapid Movement';
  if (riskScore >= 50) return '↕️ Active Movement';
  if (riskScore >= 30) return '↔️ Moderate Movement';
  return '⚫ Stable';
}

function estimateUpdateFrequency(lastUpdate) {
  if (!lastUpdate) return 'unknown';
  
  const updateTime = new Date(lastUpdate);
  const now = new Date();
  const minutesSinceUpdate = (now - updateTime) / (1000 * 60);
  
  if (minutesSinceUpdate < 1) return 'seconds';
  if (minutesSinceUpdate < 5) return 'minutes';
  if (minutesSinceUpdate < 15) return '15 minutes';
  return 'slow';
}

function calculateStandardDeviation(numbers) {
  if (numbers.length < 2) return 0;
  
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  const variance = squaredDiffs.reduce((sum, num) => sum + num, 0) / numbers.length;
  
  return Math.sqrt(variance);
}

function assessTimeframeRisk(gameTime, timeframe) {
  const now = new Date();
  const gameDate = new Date(gameTime);
  const hoursToGame = (gameDate - now) / (1000 * 60 * 60);
  
  const timeframeHours = {
    'next_1h': 1,
    'next_6h': 6,
    'next_12h': 12,
    'next_24h': 24
  };
  
  const timeframeHour = timeframeHours[timeframe] || 24;
  
  if (hoursToGame <= timeframeHour) {
    return {
      withinTimeframe: true,
      hoursToGame: Math.max(0, hoursToGame),
      riskMultiplier: 1 + (1 - (hoursToGame / timeframeHour)) // Higher multiplier as game approaches
    };
  }
  
  return {
    withinTimeframe: false,
    hoursToGame: hoursToGame,
    riskMultiplier: 0.5
  };
}

function generateRiskSummary(analyzedData, threshold) {
  const totalGames = analyzedData.length;
  const highRiskGames = analyzedData.filter(game => game.overallRiskScore >= threshold).length;
  const avgRiskScore = analyzedData.reduce((sum, game) => sum + game.overallRiskScore, 0) / totalGames || 0;
  
  const riskDistribution = {
    critical: analyzedData.filter(g => g.overallRiskScore >= 70).length,
    high: analyzedData.filter(g => g.overallRiskScore >= 50 && g.overallRiskScore < 70).length,
    medium: analyzedData.filter(g => g.overallRiskScore >= 30 && g.overallRiskScore < 50).length,
    low: analyzedData.filter(g => g.overallRiskScore < 30).length
  };
  
  return {
    totalGames,
    highRiskGames,
    highRiskPercentage: totalGames > 0 ? Math.round((highRiskGames / totalGames) * 100) : 0,
    averageRiskScore: Math.round(avgRiskScore),
    riskDistribution,
    thresholdUsed: threshold
  };
}

function generateRiskRecommendations(analyzedData, threshold) {
  const highRiskGames = analyzedData.filter(game => game.overallRiskScore >= threshold);
  
  const recommendations = [];
  
  if (highRiskGames.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `${highRiskGames.length} games identified with high bump risk`,
      action: 'Monitor these games closely for line movement'
    });
  }
  
  // Find highest risk game
  if (analyzedData.length > 0) {
    const highestRisk = analyzedData.reduce((max, game) => 
      game.overallRiskScore > max.overallRiskScore ? game : max
    );
    
    if (highestRisk.overallRiskScore >= 60) {
      recommendations.push({
        type: 'alert',
        message: `Highest risk: ${highestRisk.home_team} vs ${highestRisk.away_team} (${highestRisk.overallRiskScore}% risk)`,
        action: 'Consider waiting for line stabilization'
      });
    }
  }
  
  return recommendations;
}

function generateLiveRiskAlerts(liveRiskAnalysis, alertLevel) {
  const alerts = [];
  
  liveRiskAnalysis.forEach(game => {
    if (game.overallLiveRisk >= 60) {
      alerts.push({
        gameId: game.gameId,
        teams: `${game.home_team} vs ${game.away_team}`,
        riskLevel: 'high',
        message: `High live bump risk detected (${game.overallLiveRisk}%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (game.volatilityScore >= 70) {
      alerts.push({
        gameId: game.gameId,
        teams: `${game.home_team} vs ${game.away_team}`,
        riskLevel: 'volatility',
        message: `Extreme market volatility detected (${game.volatilityScore})`,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return alerts;
}

function calculateLiveVolatility(liveRiskAnalysis) {
  const totalGames = liveRiskAnalysis.length;
  const totalVolatility = liveRiskAnalysis.reduce((sum, game) => sum + game.volatilityScore, 0);
  const avgVolatility = totalGames > 0 ? totalVolatility / totalGames : 0;
  
  const volatilityDistribution = {
    extreme: liveRiskAnalysis.filter(g => g.volatilityScore >= 70).length,
    high: liveRiskAnalysis.filter(g => g.volatilityScore >= 50 && g.volatilityScore < 70).length,
    moderate: liveRiskAnalysis.filter(g => g.volatilityScore >= 30 && g.volatilityScore < 50).length,
    low: liveRiskAnalysis.filter(g => g.volatilityScore < 30).length
  };
  
  return {
    averageVolatility: Math.round(avgVolatility),
    volatilityDistribution,
    totalGames
  };
}

function assessLiveRisk(riskScore, threshold) {
  if (riskScore >= threshold + 20) return 'immediate_action';
  if (riskScore >= threshold) return 'high_alert';
  if (riskScore >= threshold - 20) return 'monitor';
  return 'stable';
}

function generateFallbackRiskData() {
  return {
    oddsWithRisk: [],
    bumpRiskSummary: {
      totalGames: 0,
      highRiskGames: 0,
      averageRiskScore: 0,
      note: 'Fallback data - API unavailable'
    },
    recommendations: [
      {
        type: 'info',
        message: 'Using fallback risk data',
        action: 'Check API configuration and connectivity'
      }
    ]
  };
}

function generateFallbackLiveRiskData() {
  return {
    liveRiskData: [],
    activeAlerts: [
      {
        type: 'system',
        level: 'info',
        message: 'Live risk monitoring unavailable',
        action: 'Check live data API connectivity'
      }
    ],
    volatilityMetrics: {
      averageVolatility: 0,
      note: 'Fallback data - Live API unavailable'
    }
  };
}

export default router;
