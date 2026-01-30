import express from 'express';
import SituationalAnalysisService from '../services/SituationalAnalysisService.js';

const router = express.Router();

/**
 * @swagger
 * /api/situational/spot-plays:
 *   get:
 *     summary: Identify optimal spot plays
 *     description: Identify high-value betting opportunities based on situational factors
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze for spot plays
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for spot play analysis (YYYY-MM-DD)
 *       - in: query
 *         name: confidence_threshold
 *         schema:
 *           type: number
 *           minimum: 0.5
 *           maximum: 1.0
 *           default: 0.7
 *         description: Minimum confidence threshold for spot plays
 *     responses:
 *       200:
 *         description: List of identified spot plays
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
 *                     $ref: '#/components/schemas/SpotPlay'
 *       500:
 *         description: Server error
 */
router.get('/spot-plays', async (req, res) => {
  try {
    const { sport, date } = req.query;
    
    const spotPlays = await SituationalAnalysisService.identifySpotPlays(
      sport,
      date
    );
    
    res.json({
      success: true,
      data: spotPlays
    });
  } catch (error) {
    console.error('❌ Error identifying spot plays:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/psychological-edges:
 *   get:
 *     summary: Analyze psychological edges
 *     description: Evaluate psychological factors that could impact game outcomes
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         description: Specific game ID for analysis
 *       - in: query
 *         name: include_historical
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include historical psychological data
 *     responses:
 *       200:
 *         description: Psychological edge analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PsychologicalEdge'
 *       500:
 *         description: Server error
 */
router.get('/psychological-edges', async (req, res) => {
  try {
    const { sport, gameId } = req.query;
    
    const edges = await SituationalAnalysisService.analyzePsychologicalEdges(
      sport,
      gameId
    );
    
    res.json({
      success: true,
      data: edges
    });
  } catch (error) {
    console.error('❌ Error analyzing psychological edges:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/weather-impacts:
 *   get:
 *     summary: Analyze weather impacts
 *     description: Evaluate how weather conditions affect game outcomes and betting
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl, ncaaf, ncaab]
 *         description: Sport to analyze (includes college sports)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Game location (city, stadium, or coordinates)
 *       - in: query
 *         name: gameTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Game start time (ISO 8601)
 *       - in: query
 *         name: forecast_hours
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Hours of forecast to include before/after game
 *     responses:
 *       200:
 *         description: Weather impact analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WeatherImpact'
 *       500:
 *         description: Server error
 */
router.get('/weather-impacts', async (req, res) => {
  try {
    const { sport, location, gameTime } = req.query;
    
    const impacts = await SituationalAnalysisService.analyzeWeatherImpacts(
      sport,
      location,
      gameTime
    );
    
    res.json({
      success: true,
      data: impacts
    });
  } catch (error) {
    console.error('❌ Error analyzing weather impacts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/live-betting:
 *   get:
 *     summary: Find live betting opportunities
 *     description: Identify in-play betting opportunities based on real-time game state
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: gameState
 *         schema:
 *           type: string
 *         description: JSON string of current game state
 *       - in: query
 *         name: bookmaker
 *         schema:
 *           type: string
 *           enum: [draftkings, fanduel, betmgm, caesars, pointsbet]
 *         description: Bookmaker to analyze for
 *     responses:
 *       200:
 *         description: Live betting opportunities
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
 *                     $ref: '#/components/schemas/LiveBettingOpportunity'
 *       400:
 *         description: Invalid gameState parameter
 *       500:
 *         description: Server error
 */
router.get('/live-betting', async (req, res) => {
  try {
    const { sport, gameState } = req.query;
    
    const opportunities = await SituationalAnalysisService.findLiveBettingOpportunities(
      sport,
      gameState ? JSON.parse(gameState) : {}
    );
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('❌ Error finding live betting opportunities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/live-ev:
 *   post:
 *     summary: Calculate live betting expected value
 *     description: Compute expected value for live betting opportunities
 *     tags: [Situational Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentOdds
 *               - modelProbability
 *             properties:
 *               currentOdds:
 *                 type: number
 *                 description: Current live decimal odds
 *               modelProbability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Model's estimated probability of outcome
 *               gameState:
 *                 type: object
 *                 description: Current state of the game
 *               stake:
 *                 type: number
 *                 default: 100
 *                 description: Betting stake amount
 *     responses:
 *       200:
 *         description: Live EV calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LiveExpectedValue'
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Server error
 */
router.post('/live-ev', async (req, res) => {
  try {
    const { currentOdds, modelProbability, gameState } = req.body;
    
    // Validate required fields
    if (currentOdds === undefined || modelProbability === undefined) {
      return res.status(400).json({
        success: false,
        error: 'currentOdds and modelProbability are required'
      });
    }
    
    const ev = SituationalAnalysisService.calculateLiveEV(
      currentOdds,
      modelProbability,
      gameState
    );
    
    res.json({
      success: true,
      data: ev
    });
  } catch (error) {
    console.error('❌ Error calculating live EV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/games:
 *   get:
 *     summary: Get games for situational analysis
 *     description: Retrieve games with situational context and metadata
 *     tags: [Situational Analysis]
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
 *         name: situation_type
 *         schema:
 *           type: string
 *           enum: [back_to_back, revenge_game, letdown, lookahead, trap_game]
 *         description: Type of situational context to filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: List of games with situational data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SituationalGame'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, date, situation_type, limit } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await SituationalAnalysisService.getGamesWithSituationalContext(sport, date, situation_type, limit);
    
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
 * /api/situational/games/{id}:
 *   get:
 *     summary: Get specific game situational analysis
 *     description: Retrieve detailed situational analysis for a specific game
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_context
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include full situational context
 *     responses:
 *       200:
 *         description: Detailed game situational analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameSituationalAnalysis'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_context } = req.query;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game situational analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/players:
 *   get:
 *     summary: Get players with situational performance data
 *     description: Retrieve player data with situational performance metrics
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter players
 *       - in: query
 *         name: situation
 *         schema:
 *           type: string
 *           enum: [primetime, rivalry, playoff, elimination, must_win]
 *         description: Situational context to filter
 *       - in: query
 *         name: min_situations
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Minimum number of situational games
 *     responses:
 *       200:
 *         description: List of players with situational performance data
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
 *                     $ref: '#/components/schemas/PlayerSituationalStats'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, situation, min_situations } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching players with situational data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/teams:
 *   get:
 *     summary: Get teams with situational performance data
 *     description: Retrieve team data with situational performance metrics
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter teams
 *       - in: query
 *         name: situation
 *         schema:
 *           type: string
 *           enum: [home, away, favorite, underdog, rested, tired]
 *         description: Situational context to filter
 *       - in: query
 *         name: include_trends
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include trend analysis
 *     responses:
 *       200:
 *         description: List of teams with situational performance data
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
 *                     $ref: '#/components/schemas/TeamSituationalStats'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, situation, include_trends } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching teams with situational data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/stats:
 *   get:
 *     summary: Get situational statistics
 *     description: Retrieve statistics filtered by situational contexts
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to get stats for
 *       - in: query
 *         name: situation
 *         schema:
 *           type: string
 *         description: Specific situational context
 *       - in: query
 *         name: stat_category
 *         schema:
 *           type: string
 *           enum: [offensive, defensive, efficiency, clutch, momentum]
 *         description: Statistical category
 *     responses:
 *       200:
 *         description: Situational statistical data
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
 *                     $ref: '#/components/schemas/SituationalStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, situation, stat_category } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching situational stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/predictions/game/{gameId}:
 *   get:
 *     summary: Get situational game predictions
 *     description: Retrieve AI-powered predictions incorporating situational factors
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_situational_factors
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include situational factors in prediction
 *       - in: query
 *         name: weight_situational
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.3
 *         description: Weight of situational factors in prediction
 *     responses:
 *       200:
 *         description: Situational game predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SituationalPrediction'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { include_situational_factors, weight_situational } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Game predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching situational game predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/situational/predictions/player/{playerId}:
 *   get:
 *     summary: Get situational player predictions
 *     description: Retrieve AI-powered predictions for player performance in specific situations
 *     tags: [Situational Analysis]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: situation_context
 *         schema:
 *           type: object
 *         description: JSON object describing the situational context
 *       - in: query
 *         name: include_historical
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include historical situational performance
 *     responses:
 *       200:
 *         description: Situational player performance predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlayerSituationalPrediction'
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { situation_context, include_historical } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Player predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching situational player predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
