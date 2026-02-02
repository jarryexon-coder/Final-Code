import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = express.Router();

// In your sportsbooksRoutes.js, add this at the top:
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sportsbooks API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/api/sportsbooks',
      odds: '/api/sportsbooks/odds',
      lines: '/api/sportsbooks/lines'
    }
  });
});

// Mock sportsbook data (in production, integrate with real APIs)
const MOCK_SPORTSBOOKS = {
  draftkings: {
    name: 'DraftKings',
    baseUrl: 'https://sportsbook.draftkings.com',
    markets: ['moneyline', 'spread', 'total', 'player_props']
  },
  fanduel: {
    name: 'FanDuel',
    baseUrl: 'https://sportsbook.fanduel.com',
    markets: ['moneyline', 'spread', 'total', 'player_props']
  },
  betmgm: {
    name: 'BetMGM',
    baseUrl: 'https://sportsbook.betmgm.com',
    markets: ['moneyline', 'spread', 'total', 'player_props']
  },
  caesars: {
    name: 'Caesars',
    baseUrl: 'https://sportsbook.caesars.com',
    markets: ['moneyline', 'spread', 'total', 'player_props']
  }
};

// Authentication middleware (optional for public data)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    // Token is optional for sportsbook data
    next();
  }
};

/**
 * @swagger
 * /api/sportsbooks/odds:
 *   get:
 *     summary: Get live odds for various sports
 *     description: Fetch real-time odds from The Odds API for multiple sportsbooks
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, football_nfl, baseball_mlb, hockey_nhl]
 *         description: Sport to get odds for
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [us, uk, eu, au]
 *         description: Region for odds format
 *       - in: query
 *         name: markets
 *         schema:
 *           type: string
 *           enum: [h2h, spreads, totals, outrights]
 *         description: Markets to include
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
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to fetch odds from API
 */
router.get('/odds', async (req, res) => {
  try {
    const { sport = 'basketball_nba', region = 'us', markets = 'h2h' } = req.query;
    
    // Fetch from The Odds API
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/upcoming/odds/', {
      params: {
        apiKey: process.env.THE_ODDS_API_KEY,
        regions: region,
        markets: markets,
        oddsFormat: 'decimal'
      }
    });
    
    res.json({
      success: true,
      data: response.data,
      lastUpdated: new Date().toISOString()
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
 * /api/sportsbooks/odds/live:
 *   get:
 *     summary: Get live in-game odds
 *     description: Fetch live, in-game odds from The Odds API
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [basketball_nba, football_nfl, baseball_mlb, hockey_nhl]
 *         description: Sport to get live odds for
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Specific event ID for live odds
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
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', async (req, res) => {
  try {
    const { sport = 'basketball_nba', eventId } = req.query;
    
    let url = 'https://api.the-odds-api.com/v4/sports/';
    if (eventId) {
      url += `${eventId}/odds/?apiKey=${process.env.THE_ODDS_API_KEY}&regions=us&markets=h2h,spreads&oddsFormat=decimal`;
    } else {
      url = `https://api.the-odds-api.com/v4/sports/${sport}/events/live/odds/?apiKey=${process.env.THE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
    }
    
    const response = await axios.get(url);
    
    res.json({
      success: true,
      liveOdds: response.data,
      lastUpdated: new Date().toISOString(),
      eventId: eventId || 'all'
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
 * /api/sportsbooks/odds/{sport}:
 *   get:
 *     summary: Get player prop odds for specific sport
 *     description: Fetch player prop odds from various sportsbooks for a specific sport
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport abbreviation
 *       - in: query
 *         name: market
 *         schema:
 *           type: string
 *           enum: [player_props, moneyline, spread, total]
 *         description: Market type to fetch
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         description: Specific game ID
 *     responses:
 *       200:
 *         description: Player prop odds fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 market:
 *                   type: string
 *                 odds:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Unsupported sport or invalid parameters
 *       500:
 *         description: Failed to fetch sportsbook odds
 */
router.get('/odds/:sport', authenticateOptional, async (req, res) => {
  try {
    const { sport } = req.params;
    const { market = 'player_props', gameId } = req.query;
    
    if (!['NBA', 'NFL', 'MLB', 'NHL'].includes(sport.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported sport. Available: NBA, NFL, MLB, NHL'
      });
    }
    
    // Try to fetch from The Odds API first
    try {
      const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport.toLowerCase()}/odds/`, {
        params: {
          apiKey: process.env.THE_ODDS_API_KEY,
          regions: 'us',
          markets: 'player_props',
          oddsFormat: 'american'
        }
      });
      
      return res.json({
        success: true,
        sport: sport.toUpperCase(),
        market,
        lastUpdated: new Date().toISOString(),
        sportsbooks: Object.keys(MOCK_SPORTSBOOKS),
        odds: response.data,
        source: 'The Odds API'
      });
      
    } catch (apiError) {
      console.warn('Falling back to mock data:', apiError.message);
      
      // Fall back to mock data if API fails
      const mockOdds = generateMockOdds(sport, market, gameId);
      
      res.json({
        success: true,
        sport: sport.toUpperCase(),
        market,
        lastUpdated: new Date().toISOString(),
        sportsbooks: Object.keys(MOCK_SPORTSBOOKS),
        odds: mockOdds,
        disclaimer: 'Mock data (API integration in progress)'
      });
    }
    
  } catch (error) {
    console.error('Sportsbook odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sportsbook odds'
    });
  }
});

/**
 * @swagger
 * /api/sportsbooks/consensus/{market}:
 *   get:
 *     summary: Get market consensus for specific betting market
 *     description: Calculate market consensus across multiple sportsbooks for a specific market
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: path
 *         name: market
 *         required: true
 *         schema:
 *           type: string
 *           enum: [points, rebounds, assists, steals, blocks, moneyline, spread, total]
 *         description: Market type
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport abbreviation
 *     responses:
 *       200:
 *         description: Market consensus calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 market:
 *                   type: string
 *                 sport:
 *                   type: string
 *                 consensus:
 *                   type: object
 *       500:
 *         description: Failed to calculate market consensus
 */
router.get('/consensus/:market', authenticateOptional, async (req, res) => {
  try {
    const { market } = req.params;
    const { sport = 'NBA' } = req.query;
    
    const consensus = calculateConsensus(sport, market);
    
    res.json({
      success: true,
      market,
      sport,
      consensus,
      lastUpdated: new Date().toISOString(),
      confidence: consensus.confidence > 70 ? 'High' : consensus.confidence > 50 ? 'Medium' : 'Low'
    });
    
  } catch (error) {
    console.error('Consensus error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate market consensus'
    });
  }
});

/**
 * @swagger
 * /api/sportsbooks/compare:
 *   post:
 *     summary: Compare PrizePicks selections with sportsbook lines
 *     description: Compare user's PrizePicks selections with real sportsbook lines to find edges
 *     tags: [Sportsbooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selection
 *             properties:
 *               selection:
 *                 type: object
 *                 properties:
 *                   winners:
 *                     type: array
 *                     items:
 *                       type: object
 *               sport:
 *                 type: string
 *                 default: NBA
 *     responses:
 *       200:
 *         description: Comparison completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comparison:
 *                   type: object
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Failed to compare with sportsbooks
 */
router.post('/compare', authenticateOptional, async (req, res) => {
  try {
    const { selection, sport = 'NBA' } = req.body;
    
    if (!selection || !selection.winners) {
      return res.status(400).json({
        success: false,
        error: 'Selection data is required'
      });
    }
    
    const comparison = await compareWithSportsbooks(selection, sport);
    
    res.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(comparison)
    });
    
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare with sportsbooks'
    });
  }
});

/**
 * @swagger
 * /api/sportsbooks/line-movement/{playerId}:
 *   get:
 *     summary: Get line movement history for a player
 *     description: Fetch historical line movement data for a specific player and market
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: market
 *         schema:
 *           type: string
 *           enum: [points, rebounds, assists, steals, blocks]
 *           default: points
 *         description: Market type
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Hours of historical data to fetch
 *     responses:
 *       200:
 *         description: Line movement data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 playerId:
 *                   type: string
 *                 movement:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to fetch line movement
 */
router.get('/line-movement/:playerId', authenticateOptional, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { market = 'points', hours = 24 } = req.query;
    
    const lineMovement = generateLineMovement(playerId, market, parseInt(hours));
    
    res.json({
      success: true,
      playerId,
      market,
      hours,
      movement: lineMovement,
      trend: calculateTrend(lineMovement),
      volatility: calculateVolatility(lineMovement),
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Line movement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch line movement'
    });
  }
});

/**
 * @swagger
 * /api/sportsbooks/arbitrage:
 *   get:
 *     summary: Find arbitrage opportunities across sportsbooks
 *     description: Identify arbitrage opportunities by comparing lines across different sportsbooks
 *     tags: [Sportsbooks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *           default: NBA
 *         description: Sport abbreviation
 *       - in: query
 *         name: minEdge
 *         schema:
 *           type: number
 *           default: 1
 *         description: Minimum edge percentage for arbitrage opportunities
 *     responses:
 *       200:
 *         description: Arbitrage opportunities found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 opportunities:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to find arbitrage opportunities
 */
router.get('/arbitrage', authenticateOptional, async (req, res) => {
  try {
    const { sport = 'NBA', minEdge = 1 } = req.query;
    
    const arbitrageOpportunities = findArbitrageOpportunities(sport, parseFloat(minEdge));
    
    res.json({
      success: true,
      sport,
      minEdge: parseFloat(minEdge),
      opportunities: arbitrageOpportunities,
      count: arbitrageOpportunities.length,
      bestOpportunity: arbitrageOpportunities[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Arbitrage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find arbitrage opportunities'
    });
  }
});

/**
 * @swagger
 * /api/sportsbooks/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions
 *     description: Fetch AI-powered game predictions from external prediction API
 *     tags: [Sportsbooks, Predictions]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID for predictions
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
 *       500:
 *         description: Failed to fetch game predictions
 */
router.get('/predictions/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const response = await axios.get(`https://api.example-predictions.com/v1/game/${gameId}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTION,
        'X-RapidAPI-Host': 'example-predictions.p.rapidapi.com'
      }
    });
    
    res.json({
      success: true,
      predictions: response.data,
      gameId,
      lastUpdated: new Date().toISOString()
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
 * /api/sportsbooks/predictions/player/{playerId}:
 *   get:
 *     summary: Get player performance predictions
 *     description: Fetch AI-powered player performance predictions from external API
 *     tags: [Sportsbooks, Predictions]
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
 *       500:
 *         description: Failed to fetch player predictions
 */
router.get('/predictions/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { gameId } = req.query;
    
    const url = gameId 
      ? `https://api.example-predictions.com/v1/player/${playerId}/game/${gameId}`
      : `https://api.example-predictions.com/v1/player/${playerId}`;
    
    const response = await axios.get(url, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTION,
        'X-RapidAPI-Host': 'example-predictions.p.rapidapi.com'
      }
    });
    
    res.json({
      success: true,
      predictions: response.data,
      playerId,
      gameId: gameId || 'all',
      lastUpdated: new Date().toISOString()
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

// Helper functions (keep existing implementations)
function generateMockOdds(sport, market, gameId) {
  // Existing implementation...
  const players = [
    { id: 'lebron_james', name: 'LeBron James', team: 'LAL', position: 'SF' },
    { id: 'stephen_curry', name: 'Stephen Curry', team: 'GSW', position: 'PG' },
    { id: 'giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF' },
    { id: 'luka', name: 'Luka Dončić', team: 'DAL', position: 'PG' },
    { id: 'jokic', name: 'Nikola Jokić', team: 'DEN', position: 'C' }
  ];
  
  const odds = [];
  
  players.forEach(player => {
    const baseLine = {
      points: 25 + Math.random() * 10,
      rebounds: 8 + Math.random() * 4,
      assists: 6 + Math.random() * 3,
      steals: 1.2 + Math.random() * 0.8,
      blocks: 0.8 + Math.random() * 0.7
    }[market] || 25;
    
    Object.keys(MOCK_SPORTSBOOKS).forEach(sportsbook => {
      // Add some variance between sportsbooks
      const variance = (Math.random() - 0.5) * 1.5;
      const line = (baseLine + variance).toFixed(1);
      
      // Generate odds around -110
      const oddsValue = Math.random() > 0.5 ? 
        `-${Math.floor(Math.random() * 40) + 100}` :
        `+${Math.floor(Math.random() * 100) + 100}`;
      
      odds.push({
        playerId: player.id,
        playerName: player.name,
        playerTeam: player.team,
        sportsbook,
        market,
        line: parseFloat(line),
        overOdds: oddsValue,
        underOdds: Math.random() > 0.5 ? 
          `-${Math.floor(Math.random() * 40) + 100}` :
          `+${Math.floor(Math.random() * 100) + 100}`,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        volume: Math.floor(Math.random() * 1000),
        movement: (Math.random() - 0.5) * 2
      });
    });
  });
  
  return odds;
}

function calculateConsensus(sport, market) {
  // Existing implementation...
  const consensus = {
    market,
    sport,
    confidence: 60 + Math.random() * 30,
    averageLine: 0,
    minLine: 0,
    maxLine: 0,
    overPercentage: 0,
    underPercentage: 0,
    sharpMoney: '',
    publicMoney: '',
    recommendations: []
  };
  
  // Calculate based on market type
  if (market === 'points') {
    consensus.averageLine = (25 + Math.random() * 10).toFixed(1);
    consensus.minLine = (parseFloat(consensus.averageLine) - 1.5).toFixed(1);
    consensus.maxLine = (parseFloat(consensus.averageLine) + 1.5).toFixed(1);
    consensus.overPercentage = 40 + Math.random() * 40;
    consensus.underPercentage = 100 - consensus.overPercentage;
    consensus.sharpMoney = Math.random() > 0.5 ? 'Over' : 'Under';
    consensus.publicMoney = Math.random() > 0.5 ? 'Over' : 'Under';
  }
  
  // Generate recommendations
  if (Math.abs(consensus.overPercentage - consensus.underPercentage) > 20) {
    consensus.recommendations.push({
      side: consensus.overPercentage > consensus.underPercentage ? 'Over' : 'Under',
      strength: 'Strong',
      reason: 'Significant market consensus'
    });
  }
  
  if (consensus.sharpMoney !== consensus.publicMoney) {
    consensus.recommendations.push({
      side: consensus.sharpMoney,
      strength: 'Sharp',
      reason: 'Sharp money disagrees with public'
    });
  }
  
  return consensus;
}

async function compareWithSportsbooks(selection, sport) {
  // Existing implementation...
  const comparison = {
    selectionId: selection.id || 'custom_selection',
    sport,
    winners: [],
    totalEdge: 0,
    discrepancies: [],
    bestSportsbook: '',
    worstSportsbook: '',
    recommendation: ''
  };
  
  let totalEdge = 0;
  
  for (const winner of selection.winners) {
    // Get sportsbook lines for this player
    const sportsbookLines = generateMockOdds(sport, winner.market)
      .filter(odd => odd.playerName === winner.playerName);
    
    const prizepicksLine = parseFloat(winner.pick.split(' ')[1]);
    
    let bestLine = prizepicksLine;
    let bestSportsbook = 'PrizePicks';
    let edge = 0;
    
    // Find the best line among sportsbooks
    for (const line of sportsbookLines) {
      const lineDiff = prizepicksLine - line.line;
      
      // Positive edge if PrizePicks line is lower for Over, or higher for Under
      const isOver = winner.pick.startsWith('Over');
      const currentEdge = isOver ? -lineDiff : lineDiff;
      
      if (currentEdge > edge) {
        edge = currentEdge;
        bestLine = line.line;
        bestSportsbook = line.sportsbook;
      }
    }
    
    comparison.winners.push({
      playerName: winner.playerName,
      pick: winner.pick,
      prizepicksLine,
      bestSportsbookLine: bestLine,
      bestSportsbook,
      edge: edge.toFixed(2),
      advantage: edge > 0.5 ? 'High' : edge > 0.2 ? 'Medium' : 'Low'
    });
    
    totalEdge += edge;
    
    if (Math.abs(edge) > 1) {
      comparison.discrepancies.push({
        player: winner.playerName,
        market: winner.market,
        prizepicksLine,
        sportsbookLine: bestLine,
        difference: edge.toFixed(2),
        edge: edge > 0 ? 'Positive' : 'Negative'
      });
    }
  }
  
  comparison.totalEdge = totalEdge.toFixed(2);
  
  // Determine best/worst sportsbook
  const sportsbookEdges = {};
  comparison.winners.forEach(winner => {
    if (winner.bestSportsbook !== 'PrizePicks') {
      sportsbookEdges[winner.bestSportsbook] = 
        (sportsbookEdges[winner.bestSportsbook] || 0) + parseFloat(winner.edge);
    }
  });
  
  if (Object.keys(sportsbookEdges).length > 0) {
    const sorted = Object.entries(sportsbookEdges).sort((a, b) => b[1] - a[1]);
    comparison.bestSportsbook = sorted[0][0];
    comparison.worstSportsbook = sorted[sorted.length - 1][0];
  }
  
  // Generate recommendation
  if (totalEdge > 2) {
    comparison.recommendation = 'STRONG PLAY - Significant edge over sportsbooks';
  } else if (totalEdge > 0.5) {
    comparison.recommendation = 'GOOD PLAY - Moderate edge over sportsbooks';
  } else if (totalEdge > -0.5) {
    comparison.recommendation = 'NEUTRAL - Similar to sportsbook lines';
  } else {
    comparison.recommendation = 'AVOID - Worse than sportsbook lines';
  }
  
  return comparison;
}

function generateLineMovement(playerId, market, hours) {
  // Existing implementation...
  const movements = [];
  const now = new Date();
  const baseLine = {
    points: 25,
    rebounds: 8,
    assists: 6,
    steals: 1.5,
    blocks: 1.5
  }[market] || 25;
  
  // Generate movement data for each hour
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    // Simulate line movement with some randomness
    const movement = (Math.random() - 0.5) * 2 * (hours - i) / hours;
    const line = baseLine + movement;
    
    // Simulate volume changes
    const volume = Math.floor(Math.random() * 1000 * (i / hours));
    
    movements.push({
      timestamp: time.toISOString(),
      line: parseFloat(line.toFixed(1)),
      volume,
      sportsbooks: Math.floor(Math.random() * 3) + 3, // 3-5 sportsbooks offering
      direction: movement > 0 ? 'up' : movement < 0 ? 'down' : 'stable'
    });
  }
  
  return movements;
}

function calculateTrend(movements) {
  // Existing implementation...
  if (movements.length < 2) return 'insufficient data';
  
  const first = movements[0].line;
  const last = movements[movements.length - 1].line;
  const change = last - first;
  const percentChange = (change / first) * 100;
  
  if (Math.abs(percentChange) > 5) {
    return percentChange > 0 ? 'strong up' : 'strong down';
  } else if (Math.abs(percentChange) > 2) {
    return percentChange > 0 ? 'moderate up' : 'moderate down';
  } else {
    return 'stable';
  }
}

function calculateVolatility(movements) {
  // Existing implementation...
  if (movements.length < 2) return 0;
  
  const lines = movements.map(m => m.line);
  const mean = lines.reduce((a, b) => a + b, 0) / lines.length;
  const variance = lines.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lines.length;
  
  const volatility = Math.sqrt(variance);
  
  if (volatility > 1) return 'high';
  if (volatility > 0.5) return 'medium';
  return 'low';
}

function findArbitrageOpportunities(sport, minEdge) {
  // Existing implementation...
  const opportunities = [];
  const markets = ['points', 'rebounds', 'assists'];
  
  markets.forEach(market => {
    // Simulate finding arbitrage between sportsbooks
    const baseLine = {
      points: 25,
      rebounds: 8,
      assists: 6
    }[market];
    
    // Generate different lines from different sportsbooks
    const lines = [];
    Object.keys(MOCK_SPORTSBOOKS).forEach(sportsbook => {
      const variance = (Math.random() - 0.5) * 2;
      lines.push({
        sportsbook,
        line: baseLine + variance,
        overOdds: `-${Math.floor(Math.random() * 40) + 110}`,
        underOdds: `-${Math.floor(Math.random() * 40) + 110}`
      });
    });
    
    // Find max and min lines
    const sortedLines = [...lines].sort((a, b) => a.line - b.line);
    const minLine = sortedLines[0];
    const maxLine = sortedLines[sortedLines.length - 1];
    
    const edge = maxLine.line - minLine.line;
    
    if (edge >= minEdge) {
      opportunities.push({
        market,
        player: 'Various Players', // In real app, would be specific player
        minSportsbook: minLine.sportsbook,
        minLine: minLine.line,
        maxSportsbook: maxLine.sportsbook,
        maxLine: maxLine.line,
        edge: edge.toFixed(2),
        potentialArbitrage: (edge * 10).toFixed(2) + '%', // Simplified calculation
        risk: 'Low',
        lastUpdated: new Date().toISOString()
      });
    }
  });
  
  // Sort by edge descending
  return opportunities.sort((a, b) => parseFloat(b.edge) - parseFloat(a.edge));
}

function generateRecommendations(comparison) {
  // Existing implementation...
  const recommendations = [];
  
  if (parseFloat(comparison.totalEdge) > 2) {
    recommendations.push({
      type: 'Edge',
      action: 'INCREASE STAKE',
      reason: `Significant edge of ${comparison.totalEdge} points over sportsbooks`
    });
  }
  
  if (comparison.discrepancies.length > 0) {
    recommendations.push({
      type: 'Discrepancy',
      action: 'MONITOR LINES',
      reason: `${comparison.discrepancies.length} significant line discrepancies found`
    });
  }
  
  if (comparison.bestSportsbook) {
    recommendations.push({
      type: 'Sportsbook',
      action: 'CHECK ' + comparison.bestSportsbook.toUpperCase(),
      reason: 'Best alternative lines found here'
    });
  }
  
  // Add hedge recommendation if edge is negative
  if (parseFloat(comparison.totalEdge) < -1) {
    recommendations.push({
      type: 'Hedge',
      action: 'CONSIDER HEDGING',
      reason: 'Negative edge suggests hedging may be profitable'
    });
  }
  
  return recommendations;
}

export default router;
