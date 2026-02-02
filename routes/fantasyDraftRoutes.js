import express from 'express';
import fantasyDraftController from '../controllers/fantasyDraftController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import DraftRecommendation from '../models/Draft.js';
import realDataService from '../services/realDataService.js';
import axios from 'axios';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "fantasyDraft API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// Rate limiting for draft endpoints
const draftLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    error: 'Too many draft requests. Please try again later.'
  }
});

/**
 * @swagger
 * /api/fantasy/draft/odds:
 *   get:
 *     summary: Get betting odds for draft strategy
 *     description: Fetch current betting odds for NBA games to inform draft strategy and player evaluation
 *     tags: [Fantasy Draft]
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
 *       500:
 *         description: Failed to fetch odds
 */
router.get('/odds', draftLimiter, async (req, res) => {
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
        markets: 'h2h,spreads,totals,player_points_over_under',
        oddsFormat: 'american'
      }
    });

    res.json({
      success: true,
      data: response.data,
      metadata: {
        source: 'The Odds API',
        timestamp: new Date().toISOString(),
        gameCount: response.data.length,
        applicableForDraft: true
      }
    });
  } catch (error) {
    console.error('Get draft odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds for draft strategy'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/odds/live:
 *   get:
 *     summary: Get live betting odds for real-time draft decisions
 *     description: Fetch live/upcoming betting odds to adjust draft picks based on game context
 *     tags: [Fantasy Draft]
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
 *       500:
 *         description: Failed to fetch live odds
 */
router.get('/odds/live', draftLimiter, async (req, res) => {
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
        oddsFormat: 'american',
        dateFormat: 'iso'
      }
    });

    // Filter for relevant games (next 7 days for draft planning)
    const relevantGames = response.data.filter(game => {
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      const daysUntilGame = (gameTime - now) / (1000 * 60 * 60 * 24);
      return daysUntilGame <= 7 && daysUntilGame >= -1;
    });

    res.json({
      success: true,
      data: relevantGames,
      metadata: {
        source: 'The Odds API',
        timestamp: new Date().toISOString(),
        relevantGameCount: relevantGames.length,
        timeFrame: 'next 7 days'
      }
    });
  } catch (error) {
    console.error('Get live draft odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live betting odds for draft'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions for draft strategy
 *     description: Fetch AI predictions for NBA games to evaluate team matchups during draft
 *     tags: [Fantasy Draft]
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
 *       500:
 *         description: Failed to fetch game predictions
 */
router.get('/predictions/game/:gameId', draftLimiter, async (req, res) => {
  try {
    const { gameId } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Prediction API key not configured'
      });
    }

    const response = await axios.get(`https://api.prediction-service.com/game/${gameId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      },
      params: {
        includeTeamStats: true,
        includeHistoricalMatchups: true,
        includeInjuryReports: true
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get game predictions for draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game predictions for draft strategy'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/predictions/player/{playerId}:
 *   get:
 *     summary: Get player predictions for draft evaluation
 *     description: Fetch AI predictions for individual player performance to inform draft picks
 *     tags: [Fantasy Draft]
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
 *       500:
 *         description: Failed to fetch player predictions
 */
router.get('/predictions/player/:playerId', draftLimiter, async (req, res) => {
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
        seasonProjection: true,
        matchupAnalysis: true,
        injuryRiskAssessment: true,
        consistencyMetrics: true
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get player predictions for draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player predictions for draft evaluation'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/snake:
 *   get:
 *     summary: Get snake draft recommendations
 *     description: Generate snake draft strategy based on draft position and platform
 *     tags: [Fantasy Draft]
 *     parameters:
 *       - in: query
 *         name: position
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Draft position (1-12)
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: NBA
 *         description: Sport (NBA, NFL, etc.)
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [FanDuel, DraftKings, Yahoo, ESPN]
 *           default: FanDuel
 *         description: Fantasy platform
 *       - in: query
 *         name: teams
 *         schema:
 *           type: integer
 *           minimum: 8
 *           maximum: 16
 *           default: 12
 *         description: Number of teams in draft
 *       - in: query
 *         name: rounds
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 20
 *           default: 15
 *         description: Number of rounds
 *     responses:
 *       200:
 *         description: Snake draft recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SnakeDraftRecommendation'
 *       400:
 *         description: Invalid input parameters
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Failed to generate draft recommendations
 */
router.get('/snake', draftLimiter, async (req, res) => {
  await fantasyDraftController.generateSnakeDraft(req, res);
});

/**
 * @swagger
 * /api/fantasy/draft/snake:
 *   post:
 *     summary: Generate optimized snake draft strategy with AI
 *     description: Create optimized snake draft strategy using AI algorithms, real-time odds, and predictions
 *     tags: [Fantasy Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SnakeDraftRequest'
 *     responses:
 *       200:
 *         description: Snake draft optimized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizedSnakeDraft'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Failed to optimize snake draft
 */
router.post('/snake', authenticateToken, draftLimiter, async (req, res) => {
  try {
    const { position, sport, platform, teams, rounds, includeOdds = true, includePredictions = true } = req.body;
    
    // Validate required parameters
    if (!position || !sport || !platform || !teams || !rounds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: position, sport, platform, teams, rounds'
      });
    }

    // Get real projections
    const projections = await realDataService.getFantasyProjections(sport);
    
    // Fetch additional data if requested
    let oddsData = null;
    let predictionsData = null;
    
    if (includeOdds) {
      try {
        const apiKey = process.env.THE_ODDS_API_KEY;
        if (apiKey) {
          const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
            params: {
              apiKey,
              regions: 'us',
              markets: 'h2h,spreads',
              oddsFormat: 'decimal'
            }
          });
          oddsData = response.data;
        }
      } catch (oddsError) {
        console.warn('Failed to fetch odds for draft:', oddsError.message);
      }
    }
    
    if (includePredictions) {
      try {
        predictionsData = await fetchRelevantPredictions(projections);
      } catch (predictionError) {
        console.warn('Failed to fetch predictions for draft:', predictionError.message);
      }
    }

    // Run enhanced optimization algorithm
    const optimalPicks = await optimizeSnakeDraft({
      draftPosition: position,
      projections,
      platform,
      teamCount: teams,
      rounds,
      oddsData,
      predictionsData
    });
    
    res.json({
      success: true,
      data: {
        draftPosition: position,
        sport,
        platform,
        totalTeams: teams,
        totalRounds: rounds,
        picks: optimalPicks,
        metadata: {
          oddsIncluded: !!oddsData,
          predictionsIncluded: !!predictionsData,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Snake draft error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate snake draft strategy'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/turn:
 *   get:
 *     summary: Get turn draft recommendations
 *     description: Generate turn (auction/3rd round reversal) draft strategy
 *     tags: [Fantasy Draft]
 *     responses:
 *       200:
 *         description: Turn draft recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TurnDraftRecommendation'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Failed to generate turn draft recommendations
 */
router.get('/turn', draftLimiter, async (req, res) => {
  await fantasyDraftController.generateTurnDraft(req, res);
});

/**
 * @swagger
 * /api/fantasy/draft/saved:
 *   get:
 *     summary: Get user's saved drafts
 *     description: Retrieve all saved draft strategies for the authenticated user
 *     tags: [Fantasy Draft]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved drafts retrieved successfully
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
 *                     $ref: '#/components/schemas/SavedDraft'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch saved drafts
 */
router.get('/saved', authenticateToken, async (req, res) => {
  req.query.userId = req.user._id;
  await fantasyDraftController.getSavedDrafts(req, res);
});

/**
 * @swagger
 * /api/fantasy/draft/simulate:
 *   post:
 *     summary: Simulate a fantasy draft
 *     description: Run a complete draft simulation with AI opponents and real-time strategy adjustments
 *     tags: [Fantasy Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DraftSimulationRequest'
 *     responses:
 *       200:
 *         description: Draft simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DraftSimulationResult'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Failed to simulate draft
 */
router.post('/simulate', authenticateToken, draftLimiter, async (req, res) => {
  await fantasyDraftController.simulateDraft(req, res);
});

/**
 * @swagger
 * /api/fantasy/draft/save:
 *   post:
 *     summary: Save draft results
 *     description: Save draft strategy or simulation results for future reference
 *     tags: [Fantasy Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveDraftRequest'
 *     responses:
 *       200:
 *         description: Draft saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedDraft'
 *       400:
 *         description: Invalid input - draft data required
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to save draft
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { draftData, name = 'My Draft' } = req.body;
    
    if (!draftData) {
      return res.status(400).json({
        success: false,
        error: 'Draft data is required'
      });
    }

    const savedDraft = new DraftRecommendation({
      userId: req.user._id,
      name,
      ...draftData,
      savedAt: new Date()
    });

    await savedDraft.save();

    res.json({
      success: true,
      data: savedDraft,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/draft/share/{draftId}:
 *   post:
 *     summary: Share draft results
 *     description: Generate shareable link and data for a saved draft
 *     tags: [Fantasy Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the draft to share
 *     responses:
 *       200:
 *         description: Draft share data generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShareDraftData'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Draft not found
 *       500:
 *         description: Failed to share draft
 */
router.post('/share/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const draft = await DraftRecommendation.findById(draftId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    // Generate shareable link or text
    const shareData = {
      draftId: draft._id,
      type: draft.type,
      sport: draft.sport,
      draftPosition: draft.draftPosition,
      platform: draft.platform,
      picks: draft.picks.slice(0, 3),
      shareUrl: `${process.env.FRONTEND_URL}/draft/${draft._id}`,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: shareData,
      shareText: generateShareText(draft)
    });
  } catch (error) {
    console.error('Share draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share draft'
    });
  }
});

// Enhanced draft optimization algorithm with external data integration
async function optimizeSnakeDraft(params) {
  const { draftPosition, projections, platform, teamCount, rounds, oddsData = null, predictionsData = null } = params;
  
  const picks = [];
  const myPicks = calculateMyPickNumbers(draftPosition, teamCount, rounds);
  
  for (const pickNumber of myPicks) {
    const round = Math.ceil(pickNumber / teamCount);
    const pickInRound = ((pickNumber - 1) % teamCount) + 1;
    
    // Get best available player for this pick with enhanced data
    const bestPlayer = findBestAvailablePlayer({
      takenPlayers: picks.map(p => p.player?.id || p.playerId),
      projections,
      round,
      pickInRound,
      platform,
      oddsData,
      predictionsData
    });
    
    picks.push({
      round,
      pick: pickNumber,
      player: bestPlayer,
      reason: generatePickReason(bestPlayer, round, platform, oddsData, predictionsData)
    });
  }
  
  return picks;
}

// Enhanced helper functions
function calculateMyPickNumbers(draftPosition, teamCount, rounds) {
  const picks = [];
  for (let round = 1; round <= rounds; round++) {
    let pickNumber;
    if (round % 2 === 1) {
      // Odd round: normal order
      pickNumber = (round - 1) * teamCount + draftPosition;
    } else {
      // Even round: reverse order
      pickNumber = (round - 1) * teamCount + (teamCount - draftPosition + 1);
    }
    picks.push(pickNumber);
  }
  return picks;
}

function findBestAvailablePlayer({ takenPlayers, projections, round, pickInRound, platform, oddsData, predictionsData }) {
  // Filter out taken players
  const availablePlayers = projections.filter(player => 
    !takenPlayers.includes(player.id)
  );
  
  // Sort by enhanced value calculation
  const sortedPlayers = availablePlayers.sort((a, b) => {
    const valueA = calculateEnhancedPlayerValue(a, round, platform, oddsData, predictionsData);
    const valueB = calculateEnhancedPlayerValue(b, round, platform, oddsData, predictionsData);
    return valueB - valueA;
  });
  
  return sortedPlayers.length > 0 ? sortedPlayers[0] : null;
}

function calculateEnhancedPlayerValue(player, round, platform, oddsData, predictionsData) {
  // Base value from projections
  let value = player.projectedPoints || 0;
  
  // Positional scarcity adjustment for NBA
  const positionScarcity = {
    'PG': 1.1,
    'SG': 1.0,
    'SF': 1.0,
    'PF': 1.0,
    'C': 1.2,
    'G': 1.0,
    'F': 1.0,
    'UTIL': 0.8
  };
  
  if (player.position && positionScarcity[player.position]) {
    value *= positionScarcity[player.position];
  }
  
  // Apply prediction data if available
  if (predictionsData && predictionsData[player.id]) {
    const prediction = predictionsData[player.id];
    value *= prediction.confidence || 1.0;
    if (prediction.adjustedProjection) {
      value = (value + prediction.adjustedProjection) / 2;
    }
  }
  
  // Apply odds context if available
  if (oddsData && player.team) {
    const teamOdds = oddsData.find(game => 
      game.home_team.includes(player.team) || game.away_team.includes(player.team)
    );
    if (teamOdds) {
      const spread = teamOdds.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => 
        o.name.includes(player.team)
      )?.point;
      if (spread && spread > 0) {
        // Team is favored - increase value slightly
        value *= 1.05;
      }
    }
  }
  
  // Round-based strategy
  if (round <= 3) {
    value *= player.ceiling / player.floor || 1.1;
  } else if (round >= 10) {
    value *= player.floor / player.ceiling || 0.9;
  }
  
  // Platform-specific scoring adjustments
  if (platform === 'FanDuel') {
    value *= player.doubleDoublePotential ? 1.05 : 1.0;
  } else if (platform === 'DraftKings') {
    value *= player.tripleDoublePotential ? 1.1 : 1.0;
  }
  
  return value;
}

function generatePickReason(player, round, platform, oddsData, predictionsData) {
  const reasons = [
    `Best available player in round ${round}`,
    `Strong ${player.position} value at this spot`,
    `High floor/ceiling combination`,
    `Fits your draft strategy`,
    `Addresses positional need`,
    `Consistent performer in ${platform} format`
  ];
  
  // Enhanced reasoning with external data
  let reason = reasons[0];
  
  if (predictionsData && predictionsData[player.id]) {
    const prediction = predictionsData[player.id];
    if (prediction.upsideRating === 'high') {
      reason = `High-upside pick with strong prediction confidence`;
    }
  }
  
  if (round <= 3 && player.tier === 1) {
    reason = `Elite ${player.position} - cornerstone pick`;
  } else if (round >= 8 && player.sleeper) {
    reason = `Sleeper pick with high upside`;
  } else if (player.position === 'C' && round <= 6) {
    reason = `Premium Center - positional advantage`;
  } else if (player.position === 'PG' && round <= 5) {
    reason = `Primary ball handler - secure minutes`;
  }
  
  return reason;
}

async function fetchRelevantPredictions(players) {
  const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
  if (!apiKey) return {};
  
  const predictions = {};
  const playerIds = players.slice(0, 20).map(p => p.id); // Limit to top 20 for demo
  
  for (const playerId of playerIds) {
    try {
      const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
        }
      });
      predictions[playerId] = response.data;
    } catch (error) {
      console.warn(`Failed to fetch prediction for player ${playerId}:`, error.message);
    }
  }
  
  return predictions;
}

function generateShareText(draft) {
  return `${draft.type === 'snake' ? 'Snake' : 'Turn'} Draft Results
Pick #${draft.draftPosition} • ${draft.sport} • ${draft.platform}

Top Picks:
${draft.picks.slice(0, 3).map((pick, i) => 
  `${i + 1}. ${pick.player?.name || pick.playerId?.name || 'Unknown'} - ${pick.player?.position || ''}`
).join('\n')}

Generated by Fantasy Team PRO • ${new Date(draft.savedAt).toLocaleDateString()}`;
}

export default router;
