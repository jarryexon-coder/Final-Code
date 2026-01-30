import express from 'express';
import axios from 'axios';
const router = express.Router();
import bettingAlgorithms from '../services/bettingAlgorithms.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';

/**
 * @swagger
 * /api/betting/odds:
 *   get:
 *     summary: Get live odds for various betting markets
 *     description: Fetch real-time odds from The Odds API for multiple sports and markets
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, football_nfl, baseball_mlb, hockey_nhl]
 *           default: basketball_nba
 *         description: Sport to get odds for
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [us, uk, eu, au]
 *           default: us
 *         description: Region for odds format
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           default: h2h,spreads,totals
 *         description: Comma-separated list of markets (h2h, spreads, totals, outrights, player_props)
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
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to fetch odds from API
 */
router.get('/odds', cacheMiddleware(300), async (req, res) => {
  try {
    const { sport = 'basketball_nba', region = 'us', markets = 'h2h,spreads,totals' } = req.query;
    
    if (!process.env.THE_ODDS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }
    
    // Fetch from The Odds API
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/upcoming/odds/', {
      params: {
        apiKey: process.env.THE_ODDS_API_KEY,
        regions: region,
        markets: markets,
        oddsFormat: 'american',
        sport: sport
      }
    });
    
    res.json({
      success: true,
      data: response.data,
      lastUpdated: new Date().toISOString(),
      sport: sport,
      region: region,
      markets: markets.split(',')
    });
    
  } catch (error) {
    console.error('The Odds API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch odds from The Odds API',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/betting/odds/live:
 *   get:
 *     summary: Get live in-game odds
 *     description: Fetch live, in-game odds from The Odds API for ongoing events
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, football_nfl, baseball_mlb, hockey_nhl]
 *           default: basketball_nba
 *         description: Sport to get live odds for
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Specific event ID for live odds
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           default: h2h,spreads,totals
 *         description: Markets to include
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
 *                 liveOdds:
 *                   type: array
 *                   items:
 *                     type: object
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', cacheMiddleware(60), async (req, res) => {
  try {
    const { sport = 'basketball_nba', eventId, markets = 'h2h,spreads,totals' } = req.query;
    
    if (!process.env.THE_ODDS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }
    
    let url;
    if (eventId) {
      url = `https://api.the-odds-api.com/v4/sports/${eventId}/odds/`;
    } else {
      url = `https://api.the-odds-api.com/v4/sports/${sport}/events/live/odds/`;
    }
    
    const response = await axios.get(url, {
      params: {
        apiKey: process.env.THE_ODDS_API_KEY,
        regions: 'us',
        markets: markets,
        oddsFormat: 'american'
      }
    });
    
    res.json({
      success: true,
      liveOdds: response.data,
      lastUpdated: new Date().toISOString(),
      eventId: eventId || 'all',
      sport: sport
    });
    
  } catch (error) {
    console.error('Live odds API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live odds from The Odds API',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/betting/predictions/game/{gameId}:
 *   get:
 *     summary: Get AI-powered game predictions
 *     description: Fetch game predictions from external prediction API using RAPIDAPI
 *     tags: [Betting, Predictions]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID for predictions
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed prediction breakdown
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
 *                 predictions:
 *                   type: object
 *                 gameId:
 *                   type: string
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch game predictions
 */
router.get('/predictions/game/:gameId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { gameId } = req.params;
    const { includeDetails = false } = req.query;
    
    if (!process.env.RAPIDAPI_KEY_PREDICTION) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }
    
    // Example API call - replace with actual prediction API endpoint
    const response = await axios.get(`https://example-predictions-api.p.rapidapi.com/game/${gameId}`, {
      params: {
        includeDetails: includeDetails,
        format: 'json'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTION,
        'X-RapidAPI-Host': 'example-predictions-api.p.rapidapi.com'
      }
    });
    
    // Process prediction data
    const predictions = {
      predictedWinner: response.data.winner || 'Unknown',
      confidence: response.data.confidence || 0.5,
      predictedScore: response.data.score || {},
      keyFactors: response.data.factors || [],
      bettingRecommendations: response.data.recommendations || []
    };
    
    res.json({
      success: true,
      predictions: predictions,
      gameId: gameId,
      lastUpdated: new Date().toISOString(),
      source: 'Prediction API',
      details: includeDetails ? response.data.detailed : 'Details not included'
    });
    
  } catch (error) {
    console.error('Game predictions API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game predictions',
      details: error.message,
      gameId: req.params.gameId
    });
  }
});

/**
 * @swagger
 * /api/betting/predictions/player/{playerId}:
 *   get:
 *     summary: Get AI-powered player performance predictions
 *     description: Fetch player performance predictions from external prediction API
 *     tags: [Betting, Predictions]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID for predictions
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         description: Optional game ID for context-specific predictions
 *       - in: query
 *         name: includeProjections
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include statistical projections
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
 *                 predictions:
 *                   type: object
 *                 playerId:
 *                   type: string
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch player predictions
 */
router.get('/predictions/player/:playerId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { playerId } = req.params;
    const { gameId, includeProjections = true } = req.query;
    
    if (!process.env.RAPIDAPI_KEY_PREDICTION) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }
    
    let url;
    let params = {};
    
    if (gameId) {
      url = `https://example-predictions-api.p.rapidapi.com/player/${playerId}/game/${gameId}`;
      params.context = 'game_specific';
    } else {
      url = `https://example-predictions-api.p.rapidapi.com/player/${playerId}`;
      params.context = 'general';
    }
    
    params.includeProjections = includeProjections;
    
    const response = await axios.get(url, {
      params: params,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTION,
        'X-RapidAPI-Host': 'example-predictions-api.p.rapidapi.com'
      }
    });
    
    // Process player prediction data
    const predictions = {
      playerName: response.data.name || 'Unknown Player',
      position: response.data.position || 'Unknown',
      team: response.data.team || 'Unknown',
      projections: response.data.projections || {},
      confidenceScores: response.data.confidence || {},
      matchupAnalysis: response.data.matchup || {},
      recommendedBets: response.data.bets || []
    };
    
    res.json({
      success: true,
      predictions: predictions,
      playerId: playerId,
      gameId: gameId || 'all',
      lastUpdated: new Date().toISOString(),
      source: 'Player Prediction API'
    });
    
  } catch (error) {
    console.error('Player predictions API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player predictions',
      details: error.message,
      playerId: req.params.playerId
    });
  }
});

/**
 * @swagger
 * /api/betting/insights/game/{homeTeam}/{awayTeam}:
 *   get:
 *     summary: Get betting insights for specific game
 *     description: Generate AI-powered betting insights for a specific matchup
 *     tags: [Betting]
 *     parameters:
 *       - in: path
 *         name: homeTeam
 *         required: true
 *         schema:
 *           type: string
 *         description: Home team abbreviation
 *       - in: path
 *         name: awayTeam
 *         required: true
 *         schema:
 *           type: string
 *         description: Away team abbreviation
 *     responses:
 *       200:
 *         description: Betting insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to generate betting insights
 */
router.get('/insights/game/:homeTeam/:awayTeam', cacheMiddleware(300), async (req, res) => {
  try {
    const { homeTeam, awayTeam } = req.params;
    
    const insights = await bettingAlgorithms.generateGameInsights(homeTeam, awayTeam);
    
    res.json({
      success: true,
      data: insights,
      matchup: `${awayTeam} @ ${homeTeam}`,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Betting insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate betting insights'
    });
  }
});

/**
 * @swagger
 * /api/betting/props/analyze:
 *   get:
 *     summary: Analyze player prop bet
 *     description: Analyze the value of a player prop bet using AI algorithms
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: player
 *         required: true
 *         schema:
 *           type: string
 *         description: Player name
 *       - in: query
 *         name: propType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [points, rebounds, assists, steals, blocks, threes, turnovers]
 *         description: Type of prop bet
 *       - in: query
 *         name: line
 *         required: true
 *         schema:
 *           type: number
 *         description: Prop line (e.g., 25.5 for points)
 *       - in: query
 *         name: odds
 *         required: true
 *         schema:
 *           type: number
 *         description: Odds in American format (e.g., -110)
 *       - in: query
 *         name: opponent
 *         schema:
 *           type: string
 *         description: Opponent team (optional)
 *     responses:
 *       200:
 *         description: Player prop analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     player:
 *                       type: string
 *                     propType:
 *                       type: string
 *                     analysis:
 *                       type: object
 *                     recommendation:
 *                       type: string
 *                     confidence:
 *                       type: number
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Failed to analyze player prop
 */
router.get('/props/analyze', cacheMiddleware(600), async (req, res) => {
  try {
    const { player, propType, line, odds, opponent } = req.query;
    
    if (!player || !propType || !line || !odds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: player, propType, line, odds'
      });
    }

    const analysis = bettingAlgorithms.analyzePlayerProps(
      player, 
      propType, 
      parseFloat(line), 
      parseFloat(odds),
      opponent
    );

    res.json({
      success: true,
      data: {
        player,
        propType,
        line: parseFloat(line),
        odds: parseFloat(odds),
        opponent: opponent || 'Not specified',
        analysis,
        recommendation: analysis.isValueBet ? 'BET' : 'PASS',
        confidence: Math.abs(analysis.edge),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Player prop analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze player prop'
    });
  }
});

/**
 * @swagger
 * /api/betting/value-bets/today:
 *   get:
 *     summary: Get today's value bets
 *     description: Fetch curated value betting opportunities for today's games
 *     tags: [Betting]
 *     responses:
 *       200:
 *         description: Today's value bets fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     valueBets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     disclaimer:
 *                       type: string
 *       500:
 *         description: Failed to fetch value bets
 */
router.get('/value-bets/today', cacheMiddleware(900), async (req, res) => {
  try {
    // In a real implementation, this would fetch from a database or API
    // For now, returning mock data with integration potential
    const todayGames = [
      {
        game: 'Lakers vs Warriors',
        market: 'Moneyline',
        pick: 'Lakers',
        odds: 2.10,
        edge: 5.2,
        confidence: 'High',
        reasoning: 'Home court advantage and matchup favor Lakers',
        dataSource: 'AI Algorithm + Historical Data'
      },
      {
        game: 'Lakers vs Warriors', 
        market: 'Player Points',
        pick: 'LeBron James Over 25.5',
        odds: 1.90,
        edge: 3.8,
        confidence: 'Medium',
        reasoning: 'Averaging 27.3 ppg in last 10 games vs Warriors',
        dataSource: 'Player Performance Model'
      },
      {
        game: 'Celtics vs Bucks',
        market: 'Spread',
        pick: 'Bucks +4.5',
        odds: 1.91,
        edge: 4.1,
        confidence: 'Medium',
        reasoning: 'Bucks strong ATS record on the road',
        dataSource: 'Team Statistics Analysis'
      }
    ];

    res.json({
      success: true,
      data: {
        valueBets: todayGames,
        generatedAt: new Date().toISOString(),
        totalBets: todayGames.length,
        averageEdge: todayGames.reduce((sum, bet) => sum + bet.edge, 0) / todayGames.length,
        disclaimer: 'Betting involves risk. Only bet what you can afford to lose. These are AI-generated suggestions.'
      }
    });
  } catch (error) {
    console.error('Value bets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch value bets'
    });
  }
});

/**
 * @swagger
 * /api/betting/simulation:
 *   post:
 *     summary: Run betting simulation
 *     description: Simulate betting outcomes based on historical data and probabilities
 *     tags: [Betting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bets
 *               - bankroll
 *             properties:
 *               bets:
 *                 type: array
 *                 items:
 *                   type: object
 *               bankroll:
 *                 type: number
 *               simulations:
 *                 type: integer
 *                 default: 10000
 *     responses:
 *       200:
 *         description: Simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 simulationResults:
 *                   type: object
 *       400:
 *         description: Invalid input parameters
 */
router.post('/simulation', async (req, res) => {
  try {
    const { bets, bankroll, simulations = 10000 } = req.body;
    
    if (!bets || !bankroll) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: bets, bankroll'
      });
    }
    
    const simulationResults = bettingAlgorithms.runBettingSimulation(bets, bankroll, simulations);
    
    res.json({
      success: true,
      simulationResults,
      timestamp: new Date().toISOString(),
      parameters: {
        totalBets: bets.length,
        initialBankroll: bankroll,
        simulations: simulations
      }
    });
    
  } catch (error) {
    console.error('Betting simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run betting simulation'
    });
  }
});

export default router;
