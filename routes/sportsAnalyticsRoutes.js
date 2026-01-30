import express from 'express';
import SportsBettingAnalyticsService from '../services/SportsBettingAnalyticsService.js';

const router = express.Router();

/**
 * @swagger
 * /api/sports-analytics/arbitrage:
 *   get:
 *     summary: Find arbitrage betting opportunities
 *     description: Identify potential arbitrage situations across different sportsbooks
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze for arbitrage opportunities
 *       - in: query
 *         name: marketType
 *         schema:
 *           type: string
 *           enum: [moneyline, pointspread, totals]
 *         description: Type of betting market to analyze
 *     responses:
 *       200:
 *         description: List of arbitrage opportunities
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
 *                     $ref: '#/components/schemas/ArbitrageOpportunity'
 *       500:
 *         description: Server error
 */
router.get('/arbitrage', async (req, res) => {
  try {
    const { sport, marketType } = req.query;
    
    const opportunities = await SportsBettingAnalyticsService.findArbitrageOpportunities(
      sport,
      marketType
    );
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('❌ Error finding arbitrage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/sharp-money:
 *   get:
 *     summary: Track sharp money movements
 *     description: Monitor betting line movements from professional bettors
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to track sharp money for
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *           default: '24h'
 *           enum: [1h, 6h, 12h, 24h, 48h, 72h]
 *         description: Time window for analysis
 *     responses:
 *       200:
 *         description: Sharp money movement data
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
 *                     $ref: '#/components/schemas/SharpMoneyMovement'
 *       500:
 *         description: Server error
 */
router.get('/sharp-money', async (req, res) => {
  try {
    const { sport, timeWindow = '24h' } = req.query;
    
    const sharpMoves = await SportsBettingAnalyticsService.trackSharpMoney(
      sport,
      timeWindow
    );
    
    res.json({
      success: true,
      data: sharpMoves
    });
  } catch (error) {
    console.error('❌ Error tracking sharp money:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/public-vs-sharp:
 *   get:
 *     summary: Analyze public vs sharp betting patterns
 *     description: Compare betting patterns between public bettors and professional sharps
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *     responses:
 *       200:
 *         description: Public vs sharp betting analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PublicSharpAnalysis'
 *       500:
 *         description: Server error
 */
router.get('/public-vs-sharp', async (req, res) => {
  try {
    const { sport } = req.query;
    
    const analysis = await SportsBettingAnalyticsService.analyzePublicVsSharp(sport);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Error analyzing public vs sharp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/regression:
 *   get:
 *     summary: Find statistical regression candidates
 *     description: Identify teams or players due for statistical regression to the mean
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: statType
 *         schema:
 *           type: string
 *           description: Statistical category to analyze (e.g., "shooting_percentage", "turnovers")
 *     responses:
 *       200:
 *         description: Regression candidate analysis
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
 *                     $ref: '#/components/schemas/RegressionCandidate'
 *       500:
 *         description: Server error
 */
router.get('/regression', async (req, res) => {
  try {
    const { sport, statType } = req.query;
    
    const candidates = await SportsBettingAnalyticsService.findRegressionCandidates(
      sport,
      statType
    );
    
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('❌ Error finding regression candidates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/historical-trends:
 *   get:
 *     summary: Analyze historical betting trends
 *     description: Examine historical data to identify betting trends and patterns
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: trendType
 *         schema:
 *           type: string
 *           enum: [team_trends, situation_trends, system_trends, player_trends]
 *         description: Type of trend to analyze
 *     responses:
 *       200:
 *         description: Historical trend analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HistoricalTrends'
 *       500:
 *         description: Server error
 */
router.get('/historical-trends', async (req, res) => {
  try {
    const { sport, trendType } = req.query;
    
    const trends = await SportsBettingAnalyticsService.analyzeHistoricalTrends(
      sport,
      trendType
    );
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('❌ Error analyzing historical trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/expected-value:
 *   post:
 *     summary: Calculate expected value for bets
 *     description: Compute the mathematical expected value of a betting opportunity
 *     tags: [Sports Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - probability
 *               - odds
 *             properties:
 *               probability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Probability of the bet winning (0-1)
 *               odds:
 *                 type: number
 *                 description: Decimal odds for the bet
 *               stake:
 *                 type: number
 *                 default: 100
 *                 description: Betting stake amount
 *     responses:
 *       200:
 *         description: Expected value calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExpectedValue'
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Server error
 */
router.post('/expected-value', async (req, res) => {
  try {
    const { probability, odds, stake } = req.body;
    
    // Validate required fields
    if (probability === undefined || odds === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Probability and odds are required'
      });
    }
    
    const ev = SportsBettingAnalyticsService.calculateExpectedValue(
      probability,
      odds,
      stake
    );
    
    res.json({
      success: true,
      data: ev
    });
  } catch (error) {
    console.error('❌ Error calculating EV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/games:
 *   get:
 *     summary: Get sports games data
 *     description: Retrieve list of sports games with analytics data
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter games
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed]
 *         description: Game status filter
 *     responses:
 *       200:
 *         description: List of games with analytics
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
 *                     $ref: '#/components/schemas/GameWithAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, date, status } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await SportsAnalyticsService.getGamesWithAnalytics(sport, date, status);
    
    res.json({
      success: true,
      message: 'Games endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/games/{id}:
 *   get:
 *     summary: Get specific game analytics
 *     description: Retrieve detailed analytics for a specific game
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Detailed game analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameDetailedAnalytics'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/players:
 *   get:
 *     summary: Get players with analytics data
 *     description: Retrieve player data with advanced analytics metrics
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter players
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: min_games
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Minimum games played filter
 *     responses:
 *       200:
 *         description: List of players with analytics
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
 *                     $ref: '#/components/schemas/PlayerAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, team_id, min_games } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/teams:
 *   get:
 *     summary: Get teams with analytics data
 *     description: Retrieve team data with advanced analytics metrics
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter teams
 *       - in: query
 *         name: conference
 *         schema:
 *           type: string
 *         description: Filter by conference
 *     responses:
 *       200:
 *         description: List of teams with analytics
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
 *                     $ref: '#/components/schemas/TeamAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, conference } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/stats:
 *   get:
 *     summary: Get comprehensive sports statistics
 *     description: Retrieve detailed statistical data for analysis
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to get stats for
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Season filter (format: YYYY-YY)
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           enum: [traditional, advanced, tracking, shooting, hustle]
 *         description: Type of statistics to retrieve
 *     responses:
 *       200:
 *         description: Statistical data
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
 *                     $ref: '#/components/schemas/AdvancedStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, season, stat_type } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions
 *     description: Retrieve AI-powered predictions for specific games
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           default: 'ensemble'
 *           enum: ['ensemble', 'neural_network', 'random_forest', 'gradient_boosting']
 *         description: Prediction model to use
 *     responses:
 *       200:
 *         description: Game predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GamePrediction'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { model } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Game predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/predictions/player/{playerId}:
 *   get:
 *     summary: Get player performance predictions
 *     description: Retrieve AI-powered predictions for player performance
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: projection_type
 *         schema:
 *           type: string
 *           default: 'next_game'
 *           enum: ['next_game', 'rest_of_season', 'playoffs', 'career']
 *         description: Type of projection
 *     responses:
 *       200:
 *         description: Player performance predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlayerPrediction'
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { projection_type } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Player predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching player predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
