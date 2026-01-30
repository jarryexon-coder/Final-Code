// prizepicksRoutes.js - Updated with Odds API integration and JSDoc documentation
import express from 'express';
import axios from 'axios';
const router = express.Router();

/**
 * @swagger
 * /api/prizepicks/odds:
 *   get:
 *     summary: Get sports betting odds for PrizePicks analysis
 *     description: Fetch comprehensive betting odds data from The Odds API for player props, team totals, and game lines to support PrizePicks decision making
 *     tags: [PrizePicks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, basketball_ncaab, americanfootball_nfl, baseball_mlb, hockey_nhl]
 *           default: basketball_nba
 *         description: Sport to get odds for
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *           default: us
 *         description: Betting regions (us, uk, eu, au)
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           default: player_points,player_rebounds,player_assists,player_steals,player_blocks
 *         description: Comma-separated list of markets to include
 *       - in: query
 *         name: bookmakers
 *         schema:
 *           type: string
 *           default: fanduel,draftkings
 *         description: Comma-separated list of bookmakers to include
 *       - in: query
 *         name: oddsFormat
 *         schema:
 *           type: string
 *           enum: [american, decimal, fractional]
 *           default: american
 *         description: Format for odds display
 *     responses:
 *       200:
 *         description: Odds data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 metadata:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters provided
 *       401:
 *         description: API key not configured or invalid
 *       500:
 *         description: Failed to fetch odds from external API
 */
router.get('/odds', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        message: 'Please configure THE_ODDS_API_KEY in your .env file'
      });
    }

    const {
      sport = 'basketball_nba',
      regions = 'us',
      markets = 'player_points,player_rebounds,player_assists,player_steals,player_blocks',
      bookmakers = 'fanduel,draftkings',
      oddsFormat = 'american'
    } = req.query;

    // Validate sport parameter
    const validSports = ['basketball_nba', 'basketball_ncaab', 'americanfootball_nfl', 'baseball_mlb', 'hockey_nhl'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport parameter. Valid options are: ${validSports.join(', ')}`
      });
    }

    // Construct the API URL for The Odds API
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions,
        markets,
        bookmakers,
        oddsFormat,
        dateFormat: 'iso'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PrizePicks-API/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    // Transform and enrich the data for PrizePicks use case
    const transformedData = transformOddsData(response.data, sport);
    
    res.json({
      success: true,
      data: transformedData,
      metadata: {
        sport: sport,
        totalMarkets: response.data.length,
        markets: markets.split(','),
        bookmakers: bookmakers.split(','),
        oddsFormat: oddsFormat,
        retrievedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      apiUsage: {
        remaining: response.headers['x-requests-remaining'] || 'unknown',
        used: response.headers['x-requests-used'] || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('PrizePicks odds fetch error:', error.message);
    
    // Enhanced error handling
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'Odds API service unavailable',
        message: 'The odds service is currently unreachable. Please try again later.'
      });
    } else if (error.response) {
      // The Odds API returned an error
      res.status(error.response.status).json({
        success: false,
        error: `External API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status,
        details: error.response.data
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        success: false,
        error: 'Odds API request timeout',
        message: 'The request to the odds service timed out.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds from external API',
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/odds/live:
 *   get:
 *     summary: Get live betting odds for PrizePicks
 *     description: Fetch real-time live odds data for in-game player props and markets to track ongoing PrizePicks selections
 *     tags: [PrizePicks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, basketball_ncaab, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport to get live odds for
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *           default: us
 *         description: Regions for live betting
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           default: player_points,player_rebounds,player_assists
 *         description: Live markets to monitor
 *       - in: query
 *         name: includeGameStats
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include live game statistics if available
 *     responses:
 *       200:
 *         description: Live odds data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liveData:
 *                   type: array
 *                   items:
 *                     type: object
 *                 metadata:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: API key not configured or invalid
 *       500:
 *         description: Failed to fetch live odds data
 */
router.get('/odds/live', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables',
        message: 'Please configure THE_ODDS_API_KEY in your .env file'
      });
    }

    const {
      sport = 'basketball_nba',
      regions = 'us',
      markets = 'player_points,player_rebounds,player_assists',
      includeGameStats = false
    } = req.query;

    // Validate sport parameter for live data
    const validLiveSports = ['basketball_nba', 'basketball_ncaab', 'americanfootball_nfl', 'baseball_mlb'];
    if (!validLiveSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport for live data. Valid options are: ${validLiveSports.join(', ')}`
      });
    }

    // Construct the API URL for live odds
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const params = {
      apiKey,
      regions,
      markets,
      oddsFormat: 'american',
      dateFormat: 'iso'
    };

    // Add live parameter if supported by the API
    // Note: Check The Odds API documentation for actual live parameter name
    params.live = true;
    
    const response = await axios.get(url, {
      params: params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PrizePicks-API/1.0'
      },
      timeout: 15000 // 15 second timeout for live data
    });

    const liveData = response.data;
    
    // Enrich live data with additional information
    const enrichedLiveData = enrichLiveOddsData(liveData, includeGameStats);
    
    res.json({
      success: true,
      liveData: enrichedLiveData,
      metadata: {
        sport: sport,
        totalLiveMarkets: liveData.length,
        markets: markets.split(','),
        includeGameStats: includeGameStats,
        retrievedAt: new Date().toISOString(),
        updateInterval: '30s'
      },
      timestamp: new Date().toISOString(),
      apiUsage: {
        remaining: response.headers['x-requests-remaining'] || 'unknown',
        used: response.headers['x-requests-used'] || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('PrizePicks live odds fetch error:', error.message);
    
    // Enhanced error handling for live data
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Live Odds API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status,
        details: error.response.data,
        suggestion: 'Live data may not be available for all sports or markets'
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        success: false,
        error: 'Live odds request timeout',
        message: 'The live data feed is experiencing delays.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live odds data',
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/test:
 *   get:
 *     summary: Test endpoint for PrizePicks routes
 *     description: Verify that the PrizePicks API routes are working correctly and check API key configuration
 *     tags: [PrizePicks]
 *     responses:
 *       200:
 *         description: PrizePicks routes are working correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 status:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/test', (req, res) => {
    const apiKeyConfigured = !!process.env.THE_ODDS_API_KEY;
    
    res.json({ 
        success: true, 
        message: 'prizepicksRoutes.js is working with updated API endpoints',
        status: {
          endpoints: ['/odds', '/odds/live', '/test'],
          apiKeyConfigured: apiKeyConfigured,
          apiKeyLength: apiKeyConfigured ? process.env.THE_ODDS_API_KEY.length : 0,
          environment: process.env.NODE_ENV || 'development',
          version: '2.0.0'
        },
        timestamp: new Date().toISOString()
    });
});

// Helper functions for data transformation

function transformOddsData(oddsData, sport) {
  // Transform the raw odds data into a PrizePicks-friendly format
  return oddsData.map(game => {
    const transformedGame = {
      id: game.id,
      sport_key: game.sport_key,
      sport_title: getSportTitle(game.sport_key),
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      bookmakers: []
    };

    // Process each bookmaker
    if (game.bookmakers) {
      game.bookmakers.forEach(bookmaker => {
        const transformedBookmaker = {
          key: bookmaker.key,
          title: bookmaker.title,
          last_update: bookmaker.last_update,
          markets: []
        };

        // Process each market
        if (bookmaker.markets) {
          bookmaker.markets.forEach(market => {
            const transformedMarket = {
              key: market.key,
              last_update: market.last_update,
              outcomes: market.outcomes || []
            };

            // Add PrizePicks specific calculations
            if (market.key.startsWith('player_')) {
              transformedMarket.prizepicks_eligible = true;
              transformedMarket.recommended_markets = getRecommendedMarkets(market.key, sport);
            } else {
              transformedMarket.prizepicks_eligible = false;
            }

            transformedBookmaker.markets.push(transformedMarket);
          });
        }

        transformedGame.bookmakers.push(transformedBookmaker);
      });
    }

    return transformedGame;
  });
}

function enrichLiveOddsData(liveData, includeGameStats) {
  // Enrich live data with additional PrizePicks-specific information
  return liveData.map(game => {
    const enrichedGame = {
      id: game.id,
      sport_key: game.sport_key,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      status: 'live',
      last_updated: new Date().toISOString(),
      bookmakers: []
    };

    // Process bookmakers for live data
    if (game.bookmakers) {
      game.bookmakers.forEach(bookmaker => {
        const enrichedBookmaker = {
          key: bookmaker.key,
          title: bookmaker.title,
          last_update: bookmaker.last_update,
          live_markets: []
        };

        // Filter for live markets only
        if (bookmaker.markets) {
          bookmaker.markets.forEach(market => {
            if (market.key.startsWith('player_')) {
              const liveMarket = {
                key: market.key,
                last_update: market.last_update,
                outcomes: market.outcomes || [],
                live_status: 'active',
                volatility: calculateMarketVolatility(market)
              };

              enrichedBookmaker.live_markets.push(liveMarket);
            }
          });
        }

        enrichedGame.bookmakers.push(enrichedBookmaker);
      });
    }

    // Add game statistics if requested
    if (includeGameStats) {
      enrichedGame.game_stats = simulateGameStats(game);
    }

    return enrichedGame;
  });
}

function getSportTitle(sportKey) {
  const sportTitles = {
    'basketball_nba': 'NBA Basketball',
    'basketball_ncaab': 'NCAA Basketball',
    'americanfootball_nfl': 'NFL Football',
    'baseball_mlb': 'MLB Baseball',
    'hockey_nhl': 'NHL Hockey'
  };
  
  return sportTitles[sportKey] || sportKey;
}

function getRecommendedMarkets(marketKey, sport) {
  const recommendations = {
    'player_points': ['High confidence for star players'],
    'player_rebounds': ['Look for centers vs weak rebounding teams'],
    'player_assists': ['Point guards in high-paced games'],
    'player_steals': ['Defensive specialists vs turnover-prone teams'],
    'player_blocks': ['Shot blockers vs teams that drive frequently']
  };
  
  return recommendations[marketKey] || ['Market analysis available'];
}

function calculateMarketVolatility(market) {
  // Simplified volatility calculation based on market updates
  if (!market.last_update) return 'stable';
  
  const updateTime = new Date(market.last_update);
  const now = new Date();
  const minutesSinceUpdate = (now - updateTime) / (1000 * 60);
  
  if (minutesSinceUpdate < 2) return 'high';
  if (minutesSinceUpdate < 5) return 'medium';
  return 'low';
}

function simulateGameStats(game) {
  // Simulate live game statistics for demonstration
  // In a real implementation, you would fetch this from a live stats API
  return {
    quarter: Math.floor(Math.random() * 4) + 1,
    time_remaining: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    home_score: Math.floor(Math.random() * 120),
    away_score: Math.floor(Math.random() * 120),
    possession: Math.random() > 0.5 ? game.home_team : game.away_team,
    last_play: 'Field goal made'
  };
}

export default router;
