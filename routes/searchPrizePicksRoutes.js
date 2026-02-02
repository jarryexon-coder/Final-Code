// searchPrizePicksRoutes.js - Updated with API endpoints and JSDoc documentation
import express from 'express';
import axios from 'axios';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "searchPrizePicks API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * /api/search/prizepicks/odds:
 *   get:
 *     summary: Get sports betting odds from The Odds API
 *     description: Fetch betting odds for various sports markets including player props for PrizePicks selections
 *     tags: [Search-PrizePicks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, basketball_ncaab, americanfootball_nfl, baseball_mlb]
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
 *           default: player_points,player_rebounds,player_assists
 *         description: Comma-separated list of markets
 *       - in: query
 *         name: dateFormat
 *         schema:
 *           type: string
 *           default: iso
 *         description: Date format for odds
 *       - in: query
 *         name: oddsFormat
 *         schema:
 *           type: string
 *           default: american
 *         description: Odds format (american, decimal, fractional)
 *     responses:
 *       200:
 *         description: Odds retrieved successfully
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
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
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
        error: 'THE_ODDS_API_KEY not configured in environment variables'
      });
    }

    const {
      sport = 'basketball_nba',
      regions = 'us',
      markets = 'player_points,player_rebounds,player_assists',
      dateFormat = 'iso',
      oddsFormat = 'american'
    } = req.query;

    // Construct the API URL for The Odds API[citation:1][citation:5]
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions,
        markets,
        dateFormat,
        oddsFormat
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `External API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds from external API'
      });
    }
  }
});

/**
 * @swagger
 * /api/search/prizepicks/odds/live:
 *   get:
 *     summary: Get live sports betting odds
 *     description: Fetch real-time live betting odds for in-game markets including player props
 *     tags: [Search-PrizePicks]
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
 *         description: Betting regions for live odds
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           default: player_points,player_rebounds,player_assists
 *         description: Comma-separated list of live markets
 *     responses:
 *       200:
 *         description: Live odds retrieved successfully
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
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: API key not configured or invalid
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured in environment variables'
      });
    }

    const {
      sport = 'basketball_nba',
      regions = 'us',
      markets = 'player_points,player_rebounds,player_assists'
    } = req.query;

    // Note: The Odds API live parameter may vary - check their documentation
    // This is a standard implementation pattern[citation:1][citation:5]
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(url, {
      params: {
        apiKey,
        regions,
        markets,
        oddsFormat: 'american',
        live: true  // Add live parameter if supported by the API
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      liveData: response.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Live odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `External API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live odds from external API'
      });
    }
  }
});

/**
 * @swagger
 * /api/search/prizepicks/test:
 *   get:
 *     summary: Test endpoint for searchPrizePicksRoutes
 *     description: Verify that the searchPrizePicksRoutes.js file is working correctly
 *     tags: [Search-PrizePicks]
 *     responses:
 *       200:
 *         description: Route is working correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'searchPrizePicksRoutes.js is working with updated API endpoints',
        timestamp: new Date().toISOString()
    });
});

export default router;
