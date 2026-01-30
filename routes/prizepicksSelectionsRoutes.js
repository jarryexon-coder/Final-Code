// prizepicksSelectionsRoutes.js - Updated with Odds API integration and JSDoc documentation
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import Selection from '../models/Selection.js';

const router = express.Router();

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
 * /api/prizepicks/selections/odds:
 *   get:
 *     summary: Get odds data for PrizePicks selections
 *     description: Fetch current odds data to assist in creating and validating PrizePicks selections. Uses THE_ODDS_API_KEY for real-time odds.
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport to get odds for
 *       - in: query
 *         name: market
 *         schema:
 *           type: string
 *           enum: [player_points, player_rebounds, player_assists, player_steals, player_blocks]
 *           default: player_points
 *         description: Player prop market to query
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: string
 *         description: Specific player ID to filter odds
 *       - in: query
 *         name: bookmakers
 *         schema:
 *           type: string
 *           default: fanduel,draftkings
 *         description: Comma-separated list of bookmakers to include
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
 *                 odds:
 *                   type: array
 *                   items:
 *                     type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch odds data
 */
router.get('/odds', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured',
        message: 'Contact administrator to configure Odds API key'
      });
    }

    const {
      sport = 'basketball_nba',
      market = 'player_points',
      playerId,
      bookmakers = 'fanduel,draftkings'
    } = req.query;

    // Build API URL
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const params = {
      apiKey,
      regions: 'us',
      markets: market,
      oddsFormat: 'american',
      bookmakers: bookmakers
    };

    const response = await axios.get(url, { params });

    // Filter by player if specified
    let oddsData = response.data;
    if (playerId) {
      oddsData = oddsData.filter(game => 
        game.bookmakers?.some(book => 
          book.markets?.some(market => 
            market.outcomes?.some(outcome => 
              outcome.description?.toLowerCase().includes(playerId.toLowerCase())
            )
          )
        )
      );
    }

    // Transform data for PrizePicks format
    const transformedData = oddsData.map(game => ({
      gameId: game.id,
      sport_key: game.sport_key,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      bookmakers: game.bookmakers?.map(book => ({
        key: book.key,
        title: book.title,
        markets: book.markets?.map(market => ({
          key: market.key,
          outcomes: market.outcomes
        }))
      }))
    }));

    res.json({
      success: true,
      odds: transformedData,
      timestamp: new Date().toISOString(),
      metadata: {
        totalGames: oddsData.length,
        market: market,
        sport: sport
      }
    });
    
  } catch (error) {
    console.error('Selections odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Odds API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch odds for selections'
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/selections/odds/live:
 *   get:
 *     summary: Get live odds for PrizePicks selections
 *     description: Fetch real-time live odds data for in-game player props to track ongoing selections. Uses THE_ODDS_API_KEY for live data.
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, americanfootball_nfl, baseball_mlb]
 *           default: basketball_nba
 *         description: Sport for live odds
 *       - in: query
 *         name: includeInProgress
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include games that are currently in progress
 *       - in: query
 *         name: updateInterval
 *         schema:
 *           type: string
 *           enum: [realtime, 30s, 60s, 5min]
 *           default: 30s
 *         description: Desired update frequency for live data
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
 *                 liveOdds:
 *                   type: array
 *                   items:
 *                     type: object
 *                 inProgressGames:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'THE_ODDS_API_KEY not configured',
        message: 'Contact administrator to configure Odds API key'
      });
    }

    const {
      sport = 'basketball_nba',
      includeInProgress = true,
      updateInterval = '30s'
    } = req.query;

    // Build API URL for live odds
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const params = {
      apiKey,
      regions: 'us',
      markets: 'player_points,player_rebounds,player_assists',
      oddsFormat: 'american',
      live: true
    };

    const response = await axios.get(url, { params });
    const liveData = response.data;

    // Filter in-progress games if requested
    let inProgressGames = [];
    if (includeInProgress) {
      inProgressGames = liveData.filter(game => {
        const gameTime = new Date(game.commence_time);
        const now = new Date();
        const hoursDiff = (now - gameTime) / (1000 * 60 * 60);
        return hoursDiff >= 0 && hoursDiff < 3; // Games started within last 3 hours
      });
    }

    // Calculate live updates for selections
    const liveUpdates = liveData.map(game => ({
      gameId: game.id,
      status: 'live',
      lastUpdated: new Date().toISOString(),
      bookmakers: game.bookmakers?.map(book => ({
        key: book.key,
        markets: book.markets?.filter(market => 
          ['player_points', 'player_rebounds', 'player_assists'].includes(market.key)
        )
      })).filter(book => book.markets?.length > 0)
    }));

    res.json({
      success: true,
      liveOdds: liveUpdates,
      inProgressGames: inProgressGames,
      timestamp: new Date().toISOString(),
      metadata: {
        totalLiveGames: liveData.length,
        updateInterval: updateInterval,
        sport: sport
      }
    });
    
  } catch (error) {
    console.error('Live selections odds fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Live Odds API error: ${error.response.data.message || error.response.statusText}`,
        statusCode: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live odds for selections'
      });
    }
  }
});

/**
 * @swagger
 * /api/prizepicks/selections:
 *   get:
 *     summary: Get user's PrizePicks selections
 *     description: Retrieve a paginated list of user's PrizePicks selections with filtering options
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, pending, won, lost, push]
 *           default: all
 *         description: Filter selections by status
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [all, NBA, NFL, MLB, NHL]
 *           default: all
 *         description: Filter selections by sport
 *     responses:
 *       200:
 *         description: Selections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 selections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Selection'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to retrieve selections
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sport } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { userId: req.userId };
    if (status && status !== 'all') filter.status = status;
    if (sport && sport !== 'all') filter.sport = sport;
    
    const [selections, total] = await Promise.all([
      Selection.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Selection.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      selections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get selections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get selections'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/selections/today:
 *   get:
 *     summary: Get today's PrizePicks selections
 *     description: Retrieve all selections created by the user today with summary statistics
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's selections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 date:
 *                   type: string
 *                   format: date
 *                 selections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Selection'
 *                 count:
 *                   type: integer
 *                 totalWinners:
 *                   type: integer
 *                 stats:
 *                   type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to retrieve today's selections
 */
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selections = await Selection.find({
      userId: req.userId,
      createdAt: { $gte: today }
    })
    .sort({ createdAt: -1 })
    .lean();
    
    // Calculate additional stats
    const stats = {
      active: selections.filter(s => s.status === 'active').length,
      won: selections.filter(s => s.status === 'won').length,
      lost: selections.filter(s => s.status === 'lost').length,
      totalStake: selections.reduce((sum, sel) => sum + (sel.stake || 0), 0),
      totalPayout: selections.filter(s => s.status === 'won')
        .reduce((sum, sel) => sum + (sel.payout || 0), 0)
    };
    
    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      selections,
      count: selections.length,
      totalWinners: selections.reduce((sum, sel) => sum + (sel.winners?.length || 0), 0),
      stats
    });
    
  } catch (error) {
    console.error('Get today selections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get today selections'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/selections/{id}:
 *   get:
 *     summary: Get a specific PrizePicks selection
 *     description: Retrieve detailed information about a specific selection by ID
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Selection ID
 *     responses:
 *       200:
 *         description: Selection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 selection:
 *                   $ref: '#/components/schemas/Selection'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Failed to retrieve selection
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const selection = await Selection.findOne({
      _id: req.params.id,
      userId: req.userId
    })
    .populate('winners.playerId', 'name team position')
    .lean();
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        error: 'Selection not found'
      });
    }
    
    res.json({
      success: true,
      selection
    });
    
  } catch (error) {
    console.error('Get selection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get selection'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/selections:
 *   post:
 *     summary: Create a new PrizePicks selection
 *     description: Create a new PrizePicks selection with 3 winners and calculate potential payout
 *     tags: [PrizePicks-Selections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winners
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [parlay, single]
 *                 default: parlay
 *               sport:
 *                 type: string
 *                 enum: [NBA, NFL, MLB, NHL]
 *                 default: NBA
 *               winners:
 *                 type: array
 *                 minItems: 3
 *                 maxItems: 3
 *                 items:
 *                   $ref: '#/components/schemas/Winner'
 *               totalOdds:
 *                 type: string
 *                 pattern: '^[+-]\\d+$'
 *               stake:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Selection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 selection:
 *                   $ref: '#/components/schemas/Selection'
 *       400:
 *         description: Invalid input - must provide exactly 3 winners
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to create selection
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, sport, winners, totalOdds, stake, notes } = req.body;
    
    if (!winners || winners.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Must provide exactly 3 winners'
      });
    }
    
    const selection = await Selection.create({
      userId: req.userId,
      type: type || 'parlay',
      sport: sport || 'NBA',
      winners,
      totalOdds,
      stake: stake || 10,
      potentialPayout: calculatePayout(stake || 10, totalOdds || '+400'),
      notes,
      status: 'active'
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalSelections: 1, totalStake: stake || 10 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Selection created successfully',
      selection
    });
    
  } catch (error) {
    console.error('Create selection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create selection'
    });
  }
});

function calculatePayout(stake, odds) {
  if (!odds) return stake;
  
  if (odds.startsWith('+')) {
    const multiplier = parseInt(odds.slice(1)) / 100;
    return stake * multiplier + stake;
  } else if (odds.startsWith('-')) {
    const multiplier = 100 / parseInt(odds.slice(1));
    return stake * multiplier + stake;
  }
  return stake;
}

export default router;
