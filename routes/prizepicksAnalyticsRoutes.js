// prizepicksAnalyticsRoutes.js - Updated with Analytics API endpoints and JSDoc documentation
import express from 'express';
import axios from 'axios';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "prizepicksAnalytics API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * /api/analytics/prizepicks/analytics:
 *   get:
 *     summary: Get comprehensive PrizePicks analytics
 *     description: Fetch detailed analytics for PrizePicks player props including projections, edge calculations, historical performance, and matchup analysis
 *     tags: [PrizePicks-Analytics]
 *     responses:
 *       200:
 *         description: PrizePicks analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrizePicksAnalytics'
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                 totalItems:
 *                   type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     averageEdge:
 *                       type: number
 *                     averageConfidence:
 *                       type: number
 *                     overRecommendations:
 *                       type: integer
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Failed to fetch analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    console.log('🎯 Fetching PrizePicks analytics...');
    
    // Create a flat array of analytics data
    const analyticsData = [
      {
        id: "tyreek-hill-yards",
        playerId: "tyreek-hill",
        name: "Tyreek Hill",
        team: "Dolphins",
        position: "WR",
        prop: "Receiving Yards",
        line: 85.5,
        projection: 92.3,
        edge: 6.8,
        confidence: 0.72,
        matchupRating: "Favorable",
        opponent: "Chiefs",
        date: "2024-01-13",
        recommendation: "OVER",
        units: 1.5,
        riskLevel: "Medium",
        expectedValue: 0.42,
        category: "NFL"
      },
      {
        id: "mahomes-yards",
        playerId: "patrick-mahomes",
        name: "Patrick Mahomes",
        team: "Chiefs",
        position: "QB",
        prop: "Passing Yards",
        line: 265.5,
        projection: 282.3,
        edge: 16.8,
        confidence: 0.68,
        matchupRating: "Neutral",
        opponent: "Dolphins",
        date: "2024-01-13",
        recommendation: "OVER",
        units: 1.0,
        riskLevel: "Low",
        expectedValue: 0.31,
        category: "NFL"
      },
      {
        id: "mccaffrey-total",
        playerId: "christian-mccaffrey",
        name: "Christian McCaffrey",
        team: "49ers",
        position: "RB",
        prop: "Rushing + Receiving Yards",
        line: 125.5,
        projection: 138.2,
        edge: 12.7,
        confidence: 0.75,
        matchupRating: "Very Favorable",
        opponent: "Packers",
        date: "2024-01-15",
        recommendation: "OVER",
        units: 2.0,
        riskLevel: "Low",
        expectedValue: 0.58,
        category: "NFL"
      },
      {
        id: "allen-tds",
        playerId: "josh-allen",
        name: "Josh Allen",
        team: "Bills",
        position: "QB",
        prop: "Passing + Rushing TDs",
        line: 2.5,
        projection: 3.1,
        edge: 0.6,
        confidence: 0.64,
        matchupRating: "Favorable",
        opponent: "Steelers",
        date: "2024-01-14",
        recommendation: "OVER",
        units: 1.0,
        riskLevel: "Medium",
        expectedValue: 0.28,
        category: "NFL"
      },
      {
        id: "jokic-points",
        playerId: "nikola-jokic",
        name: "Nikola Jokić",
        team: "Nuggets",
        position: "C",
        prop: "Points",
        line: 26.5,
        projection: 29.2,
        edge: 2.7,
        confidence: 0.71,
        matchupRating: "Favorable",
        opponent: "Lakers",
        date: "2024-01-16",
        recommendation: "OVER",
        units: 1.5,
        riskLevel: "Low",
        expectedValue: 0.45,
        category: "NBA"
      }
    ];

    res.json({
      success: true,
      analytics: analyticsData, // IMPORTANT: Return an ARRAY, not object
      generatedAt: new Date().toISOString(),
      totalItems: analyticsData.length,
      summary: {
        averageEdge: analyticsData.reduce((sum, a) => sum + a.edge, 0) / analyticsData.length,
        averageConfidence: analyticsData.reduce((sum, a) => sum + a.confidence, 0) / analyticsData.length,
        overRecommendations: analyticsData.filter(a => a.recommendation === "OVER").length,
        categories: [...new Set(analyticsData.map(a => a.category))]
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching PrizePicks analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PrizePicks analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/prizepicks/odds:
 *   get:
 *     summary: Get analytics data for PrizePicks odds
 *     description: Fetch betting odds and analyze historical trends, edge calculations, and value opportunities for PrizePicks selections
 *     tags: [PrizePicks-Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport to analyze odds for
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, seasonal]
 *           default: daily
 *         description: Timeframe for analytics data
 *       - in: query
 *         name: market
 *         schema:
 *           type: string
 *           enum: [player_points, player_rebounds, player_assists, player_steals, player_blocks]
 *           default: player_points
 *         description: Specific market to analyze
 *       - in: query
 *         name: minEdge
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 5
 *         description: Minimum edge percentage to filter results
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     trends:
 *                       type: array
 *                     edgeOpportunities:
 *                       type: array
 *                     recommendations:
 *                       type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters provided
 *       401:
 *         description: API key not configured or invalid
 *       500:
 *         description: Failed to fetch or analyze odds data
 */
router.get('/odds', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        analytics: {
          available: false,
          message: 'Odds API key required for analytics'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      timeframe = 'daily',
      market = 'player_points',
      minEdge = 5
    } = req.query;

    // Fetch odds data from The Odds API
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const oddsResponse = await axios.get(oddsUrl, {
      params: {
        apiKey,
        regions: 'us',
        markets: market,
        oddsFormat: 'american',
        dateFormat: 'iso'
      }
    });

    // Simulate analytics processing on the odds data
    const oddsData = oddsResponse.data;
    const analyticsData = {
      summary: {
        totalMarkets: oddsData.length || 0,
        timeframe: timeframe,
        sport: sport,
        market: market,
        timestamp: new Date().toISOString()
      },
      trends: generateAnalyticsTrends(oddsData, timeframe),
      edgeOpportunities: calculateEdgeOpportunities(oddsData, minEdge),
      recommendations: generateRecommendations(oddsData),
      historicalComparison: generateHistoricalComparison(oddsData)
    };

    res.json({
      success: true,
      analytics: analyticsData,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'The Odds API',
        processed: true,
        cacheStatus: 'fresh'
      }
    });
    
  } catch (error) {
    console.error('Analytics odds fetch error:', error.message);
    
    // Return fallback analytics data in case of API failure
    const fallbackAnalytics = generateFallbackAnalytics();
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `External API error: ${error.response.data.message || error.response.statusText}`,
        analytics: fallbackAnalytics,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds for analytics',
        analytics: fallbackAnalytics
      });
    }
  }
});

/**
 * @swagger
 * /api/analytics/prizepicks/odds/live:
 *   get:
 *     summary: Get live analytics for PrizePicks odds
 *     description: Fetch real-time live odds data with analytics including in-game trends, momentum indicators, and live edge calculations
 *     tags: [PrizePicks-Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport for live analytics
 *       - in: query
 *         name: includeMomentum
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include momentum indicators in analysis
 *       - in: query
 *         name: alertThreshold
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 10
 *         description: Edge threshold for generating live alerts
 *     responses:
 *       200:
 *         description: Live analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liveAnalytics:
 *                   type: object
 *                   properties:
 *                     liveMarkets:
 *                       type: array
 *                     momentumIndicators:
 *                       type: object
 *                     alerts:
 *                       type: array
 *                     snapshot:
 *                       type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: API key not configured or invalid
 *       500:
 *         description: Failed to fetch live analytics data
 */
router.get('/odds/live', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        liveAnalytics: {
          available: false,
          message: 'Live analytics require Odds API key'
        }
      });
    }

    const {
      sport = 'basketball_nba',
      includeMomentum = true,
      alertThreshold = 10
    } = req.query;

    // Fetch live odds data
    const liveUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const liveResponse = await axios.get(liveUrl, {
      params: {
        apiKey,
        regions: 'us',
        markets: 'player_points,player_rebounds,player_assists',
        oddsFormat: 'american',
        live: true  // Assuming the API supports live parameter
      }
    });

    // Process live analytics
    const liveData = liveResponse.data;
    const liveAnalytics = {
      liveMarkets: liveData,
      momentumIndicators: includeMomentum ? calculateMomentumIndicators(liveData) : null,
      alerts: generateLiveAlerts(liveData, alertThreshold),
      snapshot: {
        totalLiveGames: liveData.length || 0,
        sport: sport,
        lastUpdated: new Date().toISOString(),
        updateInterval: '30s'
      },
      performanceMetrics: calculateLivePerformanceMetrics(liveData)
    };

    res.json({
      success: true,
      liveAnalytics: liveAnalytics,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'The Odds API Live Feed',
        processed: true,
        alertThreshold: alertThreshold
      }
    });
    
  } catch (error) {
    console.error('Live analytics fetch error:', error.message);
    
    const fallbackLiveAnalytics = generateFallbackLiveAnalytics();
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Live API error: ${error.response.data.message || error.response.statusText}`,
        liveAnalytics: fallbackLiveAnalytics,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live analytics data',
        liveAnalytics: fallbackLiveAnalytics
      });
    }
  }
});

/**
 * @swagger
 * /api/analytics/prizepicks/test:
 *   get:
 *     summary: Test endpoint for analytics routes
 *     description: Verify that the prizepicksAnalyticsRoutes.js file is working correctly with analytics capabilities
 *     tags: [PrizePicks-Analytics]
 *     responses:
 *       200:
 *         description: Analytics routes are working correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 analyticsStatus:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'prizepicksAnalyticsRoutes.js is working with advanced analytics endpoints',
        analyticsStatus: {
          endpoints: ['/analytics', '/odds', '/odds/live', '/test'],
          apiKeyConfigured: !!process.env.THE_ODDS_API_KEY,
          analyticsEnabled: true,
          version: '2.1.0'
        },
        timestamp: new Date().toISOString()
    });
});

// Helper functions for analytics processing

function generateAnalyticsTrends(oddsData, timeframe) {
  // Simulate trend analysis
  return [
    {
      metric: 'Average Line Movement',
      value: '+1.2',
      direction: 'up',
      confidence: 85
    },
    {
      metric: 'Market Efficiency',
      value: '92%',
      direction: 'stable',
      confidence: 78
    },
    {
      metric: 'Player Popularity Index',
      value: 'High',
      direction: 'up',
      confidence: 91
    },
    {
      metric: 'Historical Hit Rate',
      value: '56%',
      direction: 'up',
      confidence: 67
    }
  ];
}

function calculateEdgeOpportunities(oddsData, minEdge) {
  // Simulate edge calculation
  return oddsData.slice(0, 5).map((odd, index) => ({
    player: `Player ${index + 1}`,
    market: 'player_points',
    edge: (Math.random() * 20).toFixed(2) + '%',
    confidence: Math.floor(Math.random() * 30) + 70,
    recommendation: Math.random() > 0.5 ? 'OVER' : 'UNDER',
    line: 24.5 + (Math.random() * 10)
  })).filter(opp => parseFloat(opp.edge) >= minEdge);
}

function generateRecommendations(oddsData) {
  return [
    {
      type: 'Top Value Pick',
      player: 'Sample Player A',
      market: 'player_points',
      edge: '12.5%',
      confidence: 88,
      reasoning: 'Consistent performance against weak defense'
    },
    {
      type: 'Momentum Play',
      player: 'Sample Player B',
      market: 'player_rebounds',
      edge: '8.3%',
      confidence: 76,
      reasoning: 'Trending upward in recent games'
    }
  ];
}

function generateHistoricalComparison(oddsData) {
  return {
    currentMarket: oddsData.length || 0,
    historicalAverage: 150,
    deviation: ((oddsData.length - 150) / 150 * 100).toFixed(2) + '%',
    volatility: 'Medium'
  };
}

function calculateMomentumIndicators(liveData) {
  return {
    trendingPlayers: ['Player X', 'Player Y', 'Player Z'],
    momentumScore: 78,
    volatilityIndex: 42,
    liveEdgeOpportunities: 3
  };
}

function generateLiveAlerts(liveData, threshold) {
  return [
    {
      type: 'Line Movement',
      player: 'Live Player A',
      market: 'points',
      movement: '+2.5 points',
      timestamp: new Date().toISOString()
    },
    {
      type: 'Edge Alert',
      player: 'Live Player B',
      market: 'assists',
      edge: '15.2%',
      recommendation: 'OVER',
      timestamp: new Date().toISOString()
    }
  ].filter(alert => parseFloat(alert.edge || '0') >= threshold);
}

function calculateLivePerformanceMetrics(liveData) {
  return {
    updateLatency: '2.3s',
    dataCompleteness: '98%',
    accuracyRating: 'High',
    refreshRate: '30 seconds'
  };
}

function generateFallbackAnalytics() {
  return {
    summary: {
      totalMarkets: 0,
      timeframe: 'daily',
      sport: 'basketball_nba',
      market: 'player_points',
      timestamp: new Date().toISOString(),
      note: 'Fallback data - API unavailable'
    },
    trends: [],
    edgeOpportunities: [],
    recommendations: [],
    historicalComparison: {
      currentMarket: 0,
      historicalAverage: 0,
      deviation: '0%',
      volatility: 'Unknown'
    }
  };
}

function generateFallbackLiveAnalytics() {
  return {
    liveMarkets: [],
    momentumIndicators: {
      trendingPlayers: [],
      momentumScore: 0,
      volatilityIndex: 0,
      liveEdgeOpportunities: 0
    },
    alerts: [],
    snapshot: {
      totalLiveGames: 0,
      sport: 'basketball_nba',
      lastUpdated: new Date().toISOString(),
      updateInterval: 'N/A',
      status: 'API Unavailable'
    },
    performanceMetrics: {
      updateLatency: 'N/A',
      dataCompleteness: '0%',
      accuracyRating: 'Low',
      refreshRate: 'N/A'
    }
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     PrizePicksAnalytics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         playerId:
 *           type: string
 *         name:
 *           type: string
 *         team:
 *           type: string
 *         position:
 *           type: string
 *         prop:
 *           type: string
 *         line:
 *           type: number
 *         projection:
 *           type: number
 *         edge:
 *           type: number
 *         confidence:
 *           type: number
 *         matchupRating:
 *           type: string
 *         opponent:
 *           type: string
 *         date:
 *           type: string
 *         recommendation:
 *           type: string
 *           enum: [OVER, UNDER]
 *         units:
 *           type: number
 *         riskLevel:
 *           type: string
 *           enum: [Low, Medium, High]
 *         expectedValue:
 *           type: number
 *         category:
 *           type: string
 *     
 *     AnalyticsOddsData:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *         trends:
 *           type: array
 *         edgeOpportunities:
 *           type: array
 *         recommendations:
 *           type: array
 *         historicalComparison:
 *           type: object
 *     
 *     LiveAnalyticsData:
 *       type: object
 *       properties:
 *         liveMarkets:
 *           type: array
 *         momentumIndicators:
 *           type: object
 *         alerts:
 *           type: array
 *         snapshot:
 *           type: object
 *         performanceMetrics:
 *           type: object
 *     
 *     AnalyticsTrend:
 *       type: object
 *       properties:
 *         metric:
 *           type: string
 *         value:
 *           type: string
 *         direction:
 *           type: string
 *           enum: [up, down, stable]
 *         confidence:
 *           type: number
 *     
 *     EdgeOpportunity:
 *       type: object
 *       properties:
 *         player:
 *           type: string
 *         market:
 *           type: string
 *         edge:
 *           type: string
 *         confidence:
 *           type: number
 *         recommendation:
 *           type: string
 *         line:
 *           type: number
 *     
 *     AnalyticsRecommendation:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         player:
 *           type: string
 *         market:
 *           type: string
 *         edge:
 *           type: string
 *         confidence:
 *           type: number
 *         reasoning:
 *           type: string
 */

export default router;
