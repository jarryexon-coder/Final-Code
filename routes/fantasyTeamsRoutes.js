import express from 'express';
const router = express.Router();
import FantasyTeam from '../models/FantasyTeam.js';
// import authenticateToken from '../middleware/auth.js'; // Uncomment when auth is ready
import cacheMiddleware from '../middleware/cacheMiddleware.js';
import axios from 'axios';

/**
 * @swagger
 * /api/fantasy/odds:
 *   get:
 *     summary: Get betting odds for NBA games
 *     description: Fetch current betting odds for NBA games using The Odds API
 *     tags: [Fantasy]
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sport_key:
 *                         type: string
 *                       home_team:
 *                         type: string
 *                       away_team:
 *                         type: string
 *                       commence_time:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Failed to fetch odds
 */
router.get('/odds', cacheMiddleware(300), async (req, res) => {
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
        markets: 'h2h,spreads',
        oddsFormat: 'decimal'
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/odds/live:
 *   get:
 *     summary: Get live betting odds
 *     description: Fetch live/upcoming betting odds for NBA games
 *     tags: [Fantasy]
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
 *                     $ref: '#/components/schemas/GameOdds'
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', cacheMiddleware(60), async (req, res) => {
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
        markets: 'h2h,spreads,totals',
        oddsFormat: 'decimal'
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get live odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live betting odds'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/my-teams:
 *   get:
 *     summary: Get user's fantasy teams
 *     description: Retrieve all fantasy teams for the authenticated user
 *     tags: [Fantasy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fantasy teams retrieved successfully
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
 *                     $ref: '#/components/schemas/FantasyTeam'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch fantasy teams
 */
router.get('/my-teams', /* authenticateToken, */ cacheMiddleware(300), async (req, res) => {
  try {
    // For now, return mock data until auth is implemented
    const mockTeams = [
      {
        _id: '1',
        teamName: 'Dream Team',
        players: [
          { playerId: '1', name: 'LeBron James', position: 'F', team: 'Lakers', salary: 50000, points: 25.3, rebounds: 7.8, assists: 7.3 }
        ],
        totalSalary: 50000,
        totalProjectedPoints: 25.3
      }
    ];
    
    res.json({
      success: true,
      data: mockTeams,
      count: mockTeams.length
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fantasy teams'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/create:
 *   post:
 *     summary: Create new fantasy team
 *     description: Create a new fantasy basketball team with player selections
 *     tags: [Fantasy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamName
 *               - players
 *             properties:
 *               teamName:
 *                 type: string
 *                 description: Name of the fantasy team
 *               players:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FantasyPlayer'
 *                 description: Array of players for the team
 *     responses:
 *       200:
 *         description: Fantasy team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FantasyTeam'
 *       400:
 *         description: Invalid input or salary cap exceeded
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to create fantasy team
 */
router.post('/create', /* authenticateToken, */ async (req, res) => {
  try {
    const { teamName, players } = req.body;
    
    // Validate team
    if (!teamName || !players || players.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Team name and players are required'
      });
    }

    // Check salary cap (example: $100,000 cap)
    const totalSalary = players.reduce((sum, player) => sum + (player.salary || 0), 0);
    if (totalSalary > 100000) {
      return res.status(400).json({
        success: false,
        error: `Team salary ${totalSalary} exceeds salary cap of $100,000`
      });
    }

    // For now, return success without saving to database
    const newTeam = {
      _id: Date.now().toString(),
      userId: 'mock-user-id',
      teamName,
      players,
      totalSalary,
      totalProjectedPoints: players.reduce((sum, player) => sum + (player.points || 0), 0),
      created: new Date(),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: newTeam,
      message: 'Fantasy team created successfully!'
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fantasy team'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/{teamId}/analytics:
 *   get:
 *     summary: Get team analytics
 *     description: Retrieve detailed analytics for a specific fantasy team
 *     tags: [Fantasy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the fantasy team
 *     responses:
 *       200:
 *         description: Team analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamAnalytics'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Failed to fetch team analytics
 */
router.get('/:teamId/analytics', /* authenticateToken, */ cacheMiddleware(600), async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Mock analytics for now
    const analytics = {
      totalPlayers: 5,
      totalSalary: 85000,
      totalProjectedPoints: 112.5,
      averagePlayerSalary: 17000,
      positionDistribution: { 'F': 2, 'G': 2, 'C': 1 },
      teamDistribution: { 'Lakers': 2, 'Warriors': 1, 'Celtics': 1, 'Bucks': 1 }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team analytics'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions
 *     description: Fetch AI predictions for a specific NBA game
 *     tags: [Fantasy]
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GamePrediction'
 *       500:
 *         description: Failed to fetch game predictions
 */
router.get('/predictions/game/:gameId', cacheMiddleware(600), async (req, res) => {
  try {
    const { gameId } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }

    // Example API call - adjust based on actual prediction service
    const response = await axios.get(`https://api.prediction-service.com/game/${gameId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      }
    });

    res.json({
      success: true,
      data: response.data
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
 * /api/fantasy/predictions/player/{playerId}:
 *   get:
 *     summary: Get player predictions
 *     description: Fetch AI predictions for a specific player's performance
 *     tags: [Fantasy]
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlayerPrediction'
 *       500:
 *         description: Failed to fetch player predictions
 */
router.get('/predictions/player/:playerId', cacheMiddleware(600), async (req, res) => {
  try {
    const { playerId } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }

    // Example API call - adjust based on actual prediction service
    const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
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

export default router;
