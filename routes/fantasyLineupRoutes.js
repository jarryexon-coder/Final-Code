import express from 'express';
import fantasyLineupController from '../controllers/fantasyLineupController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import FantasyLineup from '../models/FantasyLineup.js';

const router = express.Router();

// Rate limiting
const lineupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    error: 'Too many lineup requests. Please try again later.'
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/odds:
 *   get:
 *     summary: Get betting odds for lineup optimization
 *     description: Fetch current betting odds for NBA games to inform lineup decisions
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Odds fetched successfully
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
 *                     $ref: '#/components/schemas/GameOdds'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch odds
 */
router.get('/odds', authenticateToken, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }

    const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
      params: {
        apiKey,
        regions: 'us',
        markets: 'h2h,spreads,totals,player_points',
        oddsFormat: 'american'
      }
    });

    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: 'The Odds API',
        timestamp: new Date().toISOString(),
        gameCount: response.data.length
      }
    });
  } catch (error) {
    console.error('Get lineup odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds for lineup optimization'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/odds/live:
 *   get:
 *     summary: Get live betting odds for real-time optimization
 *     description: Fetch live/upcoming betting odds to adjust lineup decisions in real-time
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live odds fetched successfully
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
 *                     $ref: '#/components/schemas/LiveGameOdds'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', authenticateToken, async (req, res) => {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }

    const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
      params: {
        apiKey,
        regions: 'us',
        markets: 'h2h,spreads,totals,player_points,player_assists,player_rebounds',
        oddsFormat: 'american'
      }
    });

    // Filter for live/upcoming games
    const liveGames = response.data.filter(game => {
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
      return hoursUntilGame < 24 && hoursUntilGame > -2; // Games within next 24 hours or recently started
    });

    res.json({
      success: true,
      data: liveGames,
      metadata: {
        source: 'The Odds API',
        timestamp: new Date().toISOString(),
        liveGameCount: liveGames.length,
        totalGameCount: response.data.length
      }
    });
  } catch (error) {
    console.error('Get live lineup odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live betting odds'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions for lineup decisions
 *     description: Fetch AI predictions for specific NBA games to inform lineup strategy
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the NBA game
 *     responses:
 *       200:
 *         description: Game predictions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamePrediction'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch game predictions
 */
router.get('/predictions/game/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }

    // Also fetch odds for context
    let gameOdds = null;
    const oddsApiKey = process.env.THE_ODDS_API_KEY;
    if (oddsApiKey) {
      try {
        const oddsResponse = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
          params: {
            apiKey: oddsApiKey,
            regions: 'us',
            markets: 'h2h,spreads,totals',
            oddsFormat: 'decimal'
          }
        });
        gameOdds = oddsResponse.data.find(game => game.id === gameId);
      } catch (oddsError) {
        console.warn('Failed to fetch game odds for prediction:', oddsError.message);
      }
    }

    const response = await axios.get(`https://api.prediction-service.com/game/${gameId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      }
    });

    const enhancedPrediction = {
      ...response.data,
      context: gameOdds ? {
        odds: {
          homeTeam: gameOdds.home_team,
          awayTeam: gameOdds.away_team,
          spread: gameOdds.bookmakers?.[0]?.markets?.[0]?.outcomes,
          total: gameOdds.bookmakers?.[0]?.markets?.[1]?.outcomes?.[0]?.point
        }
      } : null
    };

    res.json({
      success: true,
      data: enhancedPrediction
    });
  } catch (error) {
    console.error('Get game predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game predictions'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/predictions/player/{playerId}:
 *   get:
 *     summary: Get player predictions for lineup selection
 *     description: Fetch AI predictions for individual player performance to optimize lineup choices
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the NBA player
 *     responses:
 *       200:
 *         description: Player predictions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerPrediction'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch player predictions
 */
router.get('/predictions/player/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }

    const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      },
      params: {
        includeStats: true,
        includeTrends: true,
        includeMatchup: true
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get player predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player predictions'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/generate:
 *   post:
 *     summary: Generate optimal fantasy lineup
 *     description: Use AI and real-time data to generate optimal fantasy basketball lineup
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LineupGenerationRequest'
 *     responses:
 *       200:
 *         description: Lineup generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizedLineup'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Failed to generate lineup
 */
router.post('/generate', authenticateToken, lineupLimiter, async (req, res) => {
  await fantasyLineupController.generateOptimalLineup(req, res);
});

/**
 * @swagger
 * /api/fantasy/lineup/analyze:
 *   post:
 *     summary: Analyze existing lineup
 *     description: Analyze a fantasy lineup for strengths, weaknesses, and optimization opportunities
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LineupAnalysisRequest'
 *     responses:
 *       200:
 *         description: Lineup analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LineupAnalysis'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to analyze lineup
 */
router.post('/analyze', authenticateToken, async (req, res) => {
  await fantasyLineupController.analyzeLineup(req, res);
});

/**
 * @swagger
 * /api/fantasy/lineup/saved:
 *   get:
 *     summary: Get user's saved lineups
 *     description: Retrieve all saved fantasy lineups for the authenticated user
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved lineups retrieved successfully
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
 *                     $ref: '#/components/schemas/SavedLineup'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch saved lineups
 */
router.get('/saved', authenticateToken, async (req, res) => {
  await fantasyLineupController.getSavedLineups(req, res);
});

/**
 * @swagger
 * /api/fantasy/lineup/export/{lineupId}/{format}:
 *   get:
 *     summary: Export lineup to different formats
 *     description: Export a saved lineup to various formats (CSV, JSON, PDF, etc.)
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lineupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lineup to export
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, json, pdf, excel]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Lineup exported successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Lineup not found
 *       500:
 *         description: Failed to export lineup
 */
router.get('/export/:lineupId/:format', authenticateToken, async (req, res) => {
  await fantasyLineupController.exportLineup(req, res);
});

/**
 * @swagger
 * /api/fantasy/lineup/{lineupId}:
 *   delete:
 *     summary: Delete a saved lineup
 *     description: Permanently delete a saved fantasy lineup
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lineupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lineup to delete
 *     responses:
 *       200:
 *         description: Lineup deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not authorized to delete this lineup
 *       404:
 *         description: Lineup not found
 *       500:
 *         description: Failed to delete lineup
 */
router.delete('/:lineupId', authenticateToken, async (req, res) => {
  try {
    const { lineupId } = req.params;
    const lineup = await FantasyLineup.findById(lineupId);
    
    if (!lineup) {
      return res.status(404).json({
        success: false,
        error: 'Lineup not found'
      });
    }

    // Check ownership
    if (lineup.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lineup'
      });
    }

    await lineup.deleteOne();

    res.json({
      success: true,
      message: 'Lineup deleted successfully'
    });
  } catch (error) {
    console.error('Delete lineup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lineup'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/lineup/duplicate/{lineupId}:
 *   post:
 *     summary: Duplicate a saved lineup
 *     description: Create a copy of an existing lineup with a new name
 *     tags: [Fantasy Lineups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lineupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lineup to duplicate
 *     responses:
 *       200:
 *         description: Lineup duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedLineup'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Lineup not found
 *       500:
 *         description: Failed to duplicate lineup
 */
router.post('/duplicate/:lineupId', authenticateToken, async (req, res) => {
  try {
    const { lineupId } = req.params;
    const lineup = await FantasyLineup.findById(lineupId);
    
    if (!lineup) {
      return res.status(404).json({
        success: false,
        error: 'Lineup not found'
      });
    }

    // Create copy
    const newLineup = new FantasyLineup({
      ...lineup.toObject(),
      _id: undefined,
      name: `${lineup.name} (Copy)`,
      userId: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newLineup.save();

    res.json({
      success: true,
      data: newLineup,
      message: 'Lineup duplicated successfully'
    });
  } catch (error) {
    console.error('Duplicate lineup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate lineup'
    });
  }
});

export default router;
