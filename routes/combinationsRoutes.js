import express from 'express';
import jwt from 'jsonwebtoken';
import Player from '../models/Player.js';
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
 * /api/combinations/pre-built:
 *   get:
 *     summary: Get pre-built player combinations
 *     description: Retrieve pre-generated player combinations for optimal betting
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to generate combinations for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of combinations to return
 *       - in: query
 *         name: strategy
 *         schema:
 *           type: string
 *           default: 'balanced'
 *           enum: [balanced, aggressive, conservative, correlation]
 *         description: Combination generation strategy
 *     responses:
 *       200:
 *         description: List of pre-built combinations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 strategy:
 *                   type: string
 *                 combinations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Combination'
 *                 count:
 *                   type: integer
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                 disclaimer:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/pre-built', authenticate, async (req, res) => {
  try {
    const { sport = 'NBA', limit = 10, strategy = 'balanced' } = req.query;
    
    const combinations = await generatePreBuiltCombinations(
      sport, 
      parseInt(limit), 
      strategy
    );
    
    res.json({
      success: true,
      sport,
      strategy,
      combinations,
      count: combinations.length,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Combinations are generated based on current player data and market conditions'
    });
    
  } catch (error) {
    console.error('Pre-built combinations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate pre-built combinations'
    });
  }
});

/**
 * @swagger
 * /api/combinations/generate:
 *   post:
 *     summary: Generate custom combinations
 *     description: Create custom player combinations based on specified criteria
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport:
 *                 type: string
 *                 default: 'NBA'
 *                 enum: [NBA, NFL, MLB, NHL]
 *               strategy:
 *                 type: string
 *                 default: 'optimal'
 *                 enum: [optimal, high_edge, low_correlation, balanced]
 *               filters:
 *                 type: object
 *                 properties:
 *                   position:
 *                     type: string
 *                   team:
 *                     type: string
 *                   minFantasyPoints:
 *                     type: number
 *               numberOfCombinations:
 *                 type: integer
 *                 default: 5
 *                 minimum: 1
 *                 maximum: 20
 *     responses:
 *       200:
 *         description: Generated combinations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 strategy:
 *                   type: string
 *                 filters:
 *                   type: object
 *                 combinations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Combination'
 *                 count:
 *                   type: integer
 *                 generationTime:
 *                   type: string
 *                   format: date-time
 *                 recommendations:
 *                   type: array
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { 
      sport = 'NBA', 
      strategy = 'optimal',
      filters = {},
      numberOfCombinations = 5 
    } = req.body;
    
    if (numberOfCombinations > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 combinations per request'
      });
    }
    
    const combinations = await generateCombinations(
      sport,
      strategy,
      filters,
      numberOfCombinations
    );
    
    res.json({
      success: true,
      sport,
      strategy,
      filters,
      combinations,
      count: combinations.length,
      generationTime: new Date().toISOString(),
      recommendations: generateCombinationRecommendations(combinations)
    });
    
  } catch (error) {
    console.error('Generate combinations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate combinations'
    });
  }
});

/**
 * @swagger
 * /api/combinations/validate:
 *   post:
 *     summary: Validate a combination
 *     description: Validate the quality and viability of a player combination
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - combination
 *             properties:
 *               combination:
 *                 type: object
 *                 properties:
 *                   players:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Combination validation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 validation:
 *                   $ref: '#/components/schemas/ValidationResult'
 *                 recommendation:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid combination format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { combination } = req.body;
    
    if (!combination || !combination.players || combination.players.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid combination. Must include exactly 3 players.'
      });
    }
    
    const validation = await validateCombination(combination);
    
    res.json({
      success: true,
      validation,
      recommendation: validation.isValid ? 
        `Valid combination with ${validation.score.toFixed(1)}/10 score` :
        'Invalid combination',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Validate combination error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate combination'
    });
  }
});

/**
 * @swagger
 * /api/combinations/optimal/{sport}:
 *   get:
 *     summary: Find optimal combinations
 *     description: Retrieve the most optimal player combinations based on edge and risk criteria
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to analyze
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 20
 *         description: Number of combinations to return
 *       - in: query
 *         name: minEdge
 *         schema:
 *           type: number
 *           default: 0.5
 *           minimum: 0
 *         description: Minimum edge required
 *       - in: query
 *         name: maxRisk
 *         schema:
 *           type: string
 *           default: 'Medium'
 *           enum: [Low, Medium, High]
 *         description: Maximum acceptable risk level
 *     responses:
 *       200:
 *         description: Optimal combinations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 criteria:
 *                   type: object
 *                 combinations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Combination'
 *                 bestCombination:
 *                   $ref: '#/components/schemas/Combination'
 *                 count:
 *                   type: integer
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/optimal/:sport', authenticate, async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      limit = 5,
      minEdge = 0.5,
      maxRisk = 'Medium' 
    } = req.query;
    
    const optimalCombinations = await findOptimalCombinations(
      sport,
      parseInt(limit),
      parseFloat(minEdge),
      maxRisk
    );
    
    res.json({
      success: true,
      sport,
      criteria: {
        minEdge,
        maxRisk
      },
      combinations: optimalCombinations,
      bestCombination: optimalCombinations[0] || null,
      count: optimalCombinations.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Optimal combinations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find optimal combinations'
    });
  }
});

/**
 * @swagger
 * /api/combinations/analyze:
 *   post:
 *     summary: Analyze a combination
 *     description: Perform comprehensive analysis on a player combination
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - combination
 *             properties:
 *               combination:
 *                 type: object
 *               analysisType:
 *                 type: string
 *                 default: 'comprehensive'
 *                 enum: [comprehensive, quick, detailed]
 *     responses:
 *       200:
 *         description: Combination analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   $ref: '#/components/schemas/CombinationAnalysis'
 *                 verdict:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid combination data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { combination, analysisType = 'comprehensive' } = req.body;
    
    if (!combination || !combination.players) {
      return res.status(400).json({
        success: false,
        error: 'Combination data is required'
      });
    }
    
    const analysis = await analyzeCombination(
      combination, 
      analysisType
    );
    
    res.json({
      success: true,
      analysis,
      verdict: generateVerdict(analysis),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analyze combination error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze combination'
    });
  }
});

/**
 * @swagger
 * /api/combinations/historical-performance:
 *   get:
 *     summary: Get historical performance data
 *     description: Retrieve historical performance data for combinations
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to analyze
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Historical performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 period:
 *                   type: string
 *                 performance:
 *                   $ref: '#/components/schemas/HistoricalPerformance'
 *                 trends:
 *                   type: object
 *                 bestPerformingCombination:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/historical-performance', authenticate, async (req, res) => {
  try {
    const { sport = 'NBA', days = 30 } = req.query;
    
    const performance = await getHistoricalPerformance(
      sport,
      parseInt(days)
    );
    
    res.json({
      success: true,
      sport,
      period: `${days} days`,
      performance,
      trends: analyzePerformanceTrends(performance),
      bestPerformingCombination: performance.topCombinations[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Historical performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get historical performance'
    });
  }
});

/**
 * @swagger
 * /api/combinations/games:
 *   get:
 *     summary: Get games for combination analysis
 *     description: Retrieve games data for combination analysis and selection
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to filter games
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: include_odds
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include betting odds data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: Games data for combination analysis
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
 *                     $ref: '#/components/schemas/GameForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/games', authenticate, async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, date, include_odds, limit } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await CombinationService.getGamesForCombinations(sport, date, include_odds, limit);
    
    res.json({
      success: true,
      message: 'Games endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching games for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/games/{id}:
 *   get:
 *     summary: Get specific game for combination analysis
 *     description: Retrieve detailed game data for combination creation
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_player_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include detailed player statistics
 *     responses:
 *       200:
 *         description: Detailed game data for combination analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameDetailForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { include_player_stats } = req.query;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game details for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/players:
 *   get:
 *     summary: Get players for combination creation
 *     description: Retrieve player data with statistics for combination analysis
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to filter players
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by player position
 *       - in: query
 *         name: min_edge
 *         schema:
 *           type: number
 *           default: 0.5
 *         description: Minimum edge threshold
 *     responses:
 *       200:
 *         description: Player data for combination creation
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
 *                     $ref: '#/components/schemas/PlayerForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/players', authenticate, async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, team_id, position, min_edge } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching players for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/teams:
 *   get:
 *     summary: Get teams for combination analysis
 *     description: Retrieve team data for combination correlation analysis
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to filter teams
 *       - in: query
 *         name: include_matchup_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include head-to-head matchup statistics
 *       - in: query
 *         name: include_trends
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include team trends data
 *     responses:
 *       200:
 *         description: Team data for combination analysis
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
 *                     $ref: '#/components/schemas/TeamForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/teams', authenticate, async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, include_matchup_stats, include_trends } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching teams for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/stats:
 *   get:
 *     summary: Get statistics for combination analysis
 *     description: Retrieve statistical data for combination evaluation and optimization
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: 'NBA'
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to get stats for
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'advanced'
 *           enum: [advanced, correlation, edge, performance]
 *         description: Type of statistics to retrieve
 *       - in: query
 *         name: days_back
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Statistical data for combination analysis
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
 *                     $ref: '#/components/schemas/CombinationStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, stat_type, days_back } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching stats for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/news/nba:
 *   get:
 *     summary: Get NBA news for combination analysis
 *     description: Retrieve NBA news that could impact player combinations
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of days of news to retrieve
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [injuries, lineup, trade, general]
 *         description: News category filter
 *     responses:
 *       200:
 *         description: NBA news relevant to combinations
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
 *                     $ref: '#/components/schemas/NewsItem'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/news/nba', authenticate, async (req, res) => {
  try {
    // Use NEWS_API_KEY via service layer
    const { days, category } = req.query;
    
    res.json({
      success: true,
      message: 'NBA news endpoint - Integration with NEWS_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching NBA news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/news/trending:
 *   get:
 *     summary: Get trending sports news
 *     description: Retrieve trending sports news across all sports
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL, all]
 *           default: 'all'
 *         description: Sport to filter news
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of news items to return
 *     responses:
 *       200:
 *         description: Trending sports news
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
 *                     $ref: '#/components/schemas/TrendingNews'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/news/trending', authenticate, async (req, res) => {
  try {
    // Use NEWS_API_KEY via service layer
    const { sport, limit } = req.query;
    
    res.json({
      success: true,
      message: 'Trending news endpoint - Integration with NEWS_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching trending news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions for combinations
 *     description: Retrieve AI-powered predictions for game outcomes relevant to combinations
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_player_props
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include player prop predictions
 *     responses:
 *       200:
 *         description: Game predictions for combination analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GamePredictionForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/game/:gameId', authenticate, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { include_player_props } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Game predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game predictions for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/combinations/predictions/player/{playerId}:
 *   get:
 *     summary: Get player predictions for combinations
 *     description: Retrieve AI-powered predictions for player performance in combinations
 *     tags: [Combinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'all'
 *           enum: [all, points, rebounds, assists, steals, blocks]
 *         description: Statistical category to predict
 *     responses:
 *       200:
 *         description: Player predictions for combination analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlayerPredictionForCombinations'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/player/:playerId', authenticate, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { stat_type } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Player predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching player predictions for combinations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions (remain the same as in your original file)
async function generatePreBuiltCombinations(sport, limit, strategy) {
  // ... existing code ...
  return combinations.sort((a, b) => 
    parseFloat(b.metrics.combinationScore) - parseFloat(a.metrics.combinationScore)
  ).slice(0, limit);
}

async function generateCombinations(sport, strategy, filters, count) {
  // ... existing code ...
  return combinations.sort((a, b) => 
    parseFloat(b.metrics.combinationScore) - parseFloat(a.metrics.combinationScore)
  );
}

async function validateCombination(combination) {
  // ... existing code ...
  return {
    isValid: issues.length === 0,
    score: totalScore.toFixed(1),
    issues,
    strengths,
    metrics: {
      totalEdge: totalEdge.toFixed(2),
      avgConfidence: avgConfidence.toFixed(1),
      correlation: (10 - correlationScore).toFixed(1),
      teamDiversity: `${uniqueTeams.size}/3 teams`
    },
    recommendation: totalScore > 7 ? 'Excellent' : 
                   totalScore > 5 ? 'Good' : 
                   totalScore > 3 ? 'Fair' : 'Poor'
  };
}

async function findOptimalCombinations(sport, limit, minEdge, maxRisk) {
  // ... existing code ...
  return filtered
    .sort((a, b) => parseFloat(b.metrics.expectedValue) - parseFloat(a.metrics.expectedValue))
    .slice(0, limit);
}

async function analyzeCombination(combination, analysisType) {
  // ... existing code ...
  return analysis;
}

async function getHistoricalPerformance(sport, days) {
  // ... existing code ...
  return mockPerformance;
}

async function createCombinationFromPlayers(players, strategy) {
  // ... existing code ...
  return {
    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${players[0].name} / ${players[1].name} / ${players[2].name}`,
    players: players.map(p => p.name),
    teams: [...new Set(players.map(p => p.team))],
    winners,
    metrics: {
      totalEdge: totalEdge.toFixed(2),
      avgConfidence: avgConfidence.toFixed(1),
      correlation: correlation.toFixed(3),
      bumpRisk,
      combinationScore: combinationScore.toFixed(1),
      expectedValue: (totalEdge * 0.8).toFixed(2)
    },
    analysis: generateCombinationAnalysis(winners),
    recommendedStake: calculateRecommendedStake(combinationScore),
    strategy,
    timestamp: new Date().toISOString()
  };
}

function calculateBumpRisk(winners) {
  // ... existing code ...
  if (riskScore >= 5) return 'High';
  if (riskScore >= 3) return 'Medium';
  return 'Low';
}

function calculateCombinationScore(totalEdge, correlation, bumpRisk, confidence) {
  // ... existing code ...
  return (edgeScore * 0.4 + correlationScore * 0.3 + riskScore * 0.2 + confidenceScore * 0.1);
}

function generateCombinationAnalysis(winners) {
  // ... existing code ...
  return analysis;
}

function calculateRecommendedStake(score) {
  if (score >= 8) return 'High (3-5% of bankroll)';
  if (score >= 6) return 'Medium (1-3% of bankroll)';
  if (score >= 4) return 'Low (0.5-1% of bankroll)';
  return 'Minimal (<0.5% of bankroll)';
}

function generateCombinationRecommendations(combinations) {
  // ... existing code ...
  return recommendations;
}

function generateVerdict(analysis) {
  // ... existing code ...
  if (score >= 3) {
    return {
      decision: 'STRONG PLAY',
      confidence: 'High',
      color: 'green',
      reasons: ['Multiple strengths', 'Limited weaknesses']
    };
  } else if (score >= 1) {
    return {
      decision: 'GOOD PLAY',
      confidence: 'Medium',
      color: 'yellow',
      reasons: ['More strengths than weaknesses']
    };
  } else if (score >= -1) {
    return {
      decision: 'NEUTRAL',
      confidence: 'Low',
      color: 'gray',
      reasons: ['Balanced pros and cons']
    };
  } else {
    return {
      decision: 'AVOID',
      confidence: 'High',
      color: 'red',
      reasons: ['Multiple weaknesses', 'Limited strengths']
    };
  }
}

function analyzePerformanceTrends(performance) {
  // ... existing code ...
  return trends;
}

// Utility functions
function shuffleArray(array) {
  // ... existing code ...
  return shuffled;
}

function groupBy(array, key) {
  // ... existing code ...
  return groups;
}

export default router;
