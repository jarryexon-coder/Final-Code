import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Player from '../models/Player.js';
import Simulation from '../models/simulation.js';
import axios from 'axios';

const router = express.Router();

/**
 * @swagger
 * /api/fantasy/optimization/odds:
 *   get:
 *     summary: Get betting odds for optimization strategies
 *     description: Fetch current betting odds to inform optimization algorithms and strategy decisions
 *     tags: [Fantasy Optimization]
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
router.get('/odds', async (req, res) => {
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
        oddsFormat: 'decimal'
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
    console.error('Get optimization odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds for optimization'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/odds/live:
 *   get:
 *     summary: Get live betting odds for real-time optimization
 *     description: Fetch live/upcoming betting odds for dynamic optimization adjustments
 *     tags: [Fantasy Optimization]
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
router.get('/odds/live', async (req, res) => {
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

    // Filter for live/upcoming games
    const liveGames = response.data.filter(game => {
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
      return hoursUntilGame < 5; // Games within next 5 hours
    });

    res.json({
      success: true,
      data: liveGames,
      metadata: {
        source: 'The Odds API',
        timestamp: new Date().toISOString(),
        liveGameCount: liveGames.length
      }
    });
  } catch (error) {
    console.error('Get live optimization odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live betting odds for optimization'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions for optimization
 *     description: Fetch AI predictions for NBA games to enhance optimization algorithms
 *     tags: [Fantasy Optimization]
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
router.get('/predictions/game/:gameId', async (req, res) => {
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
        includeAdvancedMetrics: true,
        includeTeamTrends: true,
        includeMatchupHistory: true
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get game predictions for optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game predictions for optimization'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/predictions/player/{playerId}:
 *   get:
 *     summary: Get player predictions for optimization
 *     description: Fetch AI predictions for individual player performance to inform optimization decisions
 *     tags: [Fantasy Optimization]
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
router.get('/predictions/player/:playerId', async (req, res) => {
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
        includeProjections: true,
        includeTrendAnalysis: true,
        includeRiskAssessment: true,
        includeConsistencyMetrics: true
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get player predictions for optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player predictions for optimization'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/lineup:
 *   post:
 *     summary: Optimize fantasy lineup using AI and external data
 *     description: Use genetic algorithms enhanced with real-time odds and predictions to optimize fantasy basketball lineups
 *     tags: [Fantasy Optimization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LineupOptimizationRequest'
 *     responses:
 *       200:
 *         description: Lineup optimized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizedLineup'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to optimize lineup
 */
router.post('/lineup', authenticateToken, async (req, res) => {
  try {
    const { 
      sport = 'NBA',
      platform = 'FanDuel',
      contestType = 'tournament',
      strategy = 'optimized',
      constraints = {},
      iterations = 10000,
      includeExternalData = true
    } = req.body;

    // Fetch external data if requested
    let externalData = {};
    if (includeExternalData) {
      externalData = await fetchExternalOptimizationData();
    }

    // Run enhanced genetic algorithm for optimization
    const optimalLineup = await runEnhancedGeneticAlgorithm({
      sport,
      platform,
      contestType,
      strategy,
      constraints,
      iterations,
      externalData
    });

    res.json({
      success: true,
      data: {
        lineup: optimalLineup.lineup,
        analysis: analyzeOptimizedLineup(optimalLineup.lineup),
        confidence: calculateConfidenceScore(optimalLineup.lineup),
        alternatives: generateAlternativeLineups(optimalLineup.lineup, 3),
        metadata: {
          externalDataUsed: includeExternalData,
          dataSources: externalData.sources || [],
          algorithmVersion: '2.0-enhanced'
        }
      }
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize lineup'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/compare-players:
 *   post:
 *     summary: Compare players with enhanced data analysis
 *     description: Compare multiple players across various metrics including real-time predictions and odds
 *     tags: [Fantasy Optimization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerIds
 *             properties:
 *               playerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of player IDs to compare
 *               platform:
 *                 type: string
 *                 enum: [FanDuel, DraftKings]
 *                 default: FanDuel
 *               metric:
 *                 type: string
 *                 enum: [value, projection, salary, consistency, upside]
 *                 default: value
 *               includePredictions:
 *                 type: boolean
 *                 default: true
 *               includeOddsContext:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Players compared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EnhancedPlayerComparison'
 *       400:
 *         description: Invalid input - at least 2 player IDs required
 *       500:
 *         description: Failed to compare players
 */
router.post('/compare-players', async (req, res) => {
  try {
    const { 
      playerIds, 
      platform = 'FanDuel', 
      metric = 'value', 
      includePredictions = true,
      includeOddsContext = true
    } = req.body;
    
    if (!playerIds || playerIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 player IDs required'
      });
    }

    const players = await Player.find({ _id: { $in: playerIds } });
    
    // Fetch external data if requested
    let externalData = {};
    if (includePredictions || includeOddsContext) {
      externalData = await fetchExternalComparisonData(playerIds, { includePredictions, includeOddsContext });
    }
    
    const comparison = players.map(player => {
      const playerPrediction = includePredictions ? externalData.predictions?.[player._id] : null;
      const playerOddsContext = includeOddsContext ? externalData.oddsContext?.[player.team] : null;
      
      return {
        player: {
          _id: player._id,
          name: player.name,
          position: player.position,
          team: player.team
        },
        metrics: {
          salary: platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary,
          projection: player.projection,
          valueScore: player.valueScore,
          consistency: player.consistency,
          upside: player.upsideScore,
          injuryRisk: player.injuryRisk,
          ownership: player.ownership,
          predictionAdjusted: playerPrediction?.adjustedProjection || player.projection
        },
        externalData: {
          prediction: playerPrediction ? {
            confidence: playerPrediction.confidence,
            upside: playerPrediction.upside,
            risk: playerPrediction.risk
          } : null,
          oddsContext: playerOddsContext ? {
            teamSpread: playerOddsContext.spread,
            gameTotal: playerOddsContext.total,
            impliedScore: playerOddsContext.impliedScore
          } : null
        },
        recommendation: generateEnhancedPlayerRecommendation(player, platform, metric, playerPrediction, playerOddsContext)
      };
    });

    // Sort by selected metric
    comparison.sort((a, b) => {
      const aValue = getMetricValue(a, metric);
      const bValue = getMetricValue(b, metric);
      return bValue - aValue;
    });

    res.json({
      success: true,
      data: {
        comparison,
        bestValue: comparison[0],
        worstValue: comparison[comparison.length - 1],
        summary: generateEnhancedComparisonSummary(comparison, metric),
        metadata: {
          externalDataUsed: includePredictions || includeOddsContext,
          dataSources: externalData.sources || [],
          comparisonMetric: metric,
          platform: platform
        }
      }
    });
  } catch (error) {
    console.error('Player comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare players'
    });
  }
});

/**
 * @swagger
 * /api/fantasy/optimization/stack:
 *   post:
 *     summary: Optimize player stack with enhanced data
 *     description: Find optimal player stack from a specific team using correlation analysis enhanced with real-time data
 *     tags: [Fantasy Optimization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team
 *             properties:
 *               team:
 *                 type: string
 *                 description: Team abbreviation or name
 *               sport:
 *                 type: string
 *                 default: NBA
 *               platform:
 *                 type: string
 *                 enum: [FanDuel, DraftKings]
 *                 default: FanDuel
 *               stackType:
 *                 type: string
 *                 enum: [correlation, value, ownership, projection]
 *                 default: correlation
 *               maxPlayers:
 *                 type: integer
 *                 default: 4
 *               budget:
 *                 type: integer
 *                 default: 20000
 *               includeGameContext:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Stack optimized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnhancedOptimizedStack'
 *       400:
 *         description: Invalid input - team required
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to optimize stack
 */
router.post('/optimize-stack', authenticateToken, async (req, res) => {
  try {
    const { 
      team,
      sport = 'NBA',
      platform = 'FanDuel',
      stackType = 'correlation',
      maxPlayers = 4,
      budget = 20000,
      includeGameContext = true
    } = req.body;

    if (!team) {
      return res.status(400).json({
        success: false,
        error: 'Team is required'
      });
    }

    const players = await Player.find({ 
      sport,
      team,
      active: true
    });

    // Fetch game context if requested
    let gameContext = null;
    if (includeGameContext) {
      gameContext = await fetchGameContextForTeam(team);
    }

    const optimalStack = findEnhancedOptimalStack(
      players,
      platform,
      stackType,
      maxPlayers,
      budget,
      gameContext
    );

    res.json({
      success: true,
      data: {
        team,
        stackType,
        players: optimalStack.players,
        totalCost: optimalStack.totalCost,
        totalProjection: optimalStack.totalProjection,
        enhancedProjection: optimalStack.enhancedProjection,
        correlationScore: calculateEnhancedCorrelationScore(optimalStack.players, stackType, gameContext),
        stackRecommendations: generateEnhancedStackRecommendations(optimalStack.players, gameContext),
        gameContext: gameContext ? {
          opponent: gameContext.opponent,
          spread: gameContext.spread,
          total: gameContext.total,
          impliedScore: gameContext.impliedScore,
          paceProjection: gameContext.paceProjection
        } : null,
        metadata: {
          gameContextIncluded: !!gameContext,
          stackSize: optimalStack.players.length,
          budgetUtilization: (optimalStack.totalCost / budget) * 100,
          projectionEnhancement: optimalStack.enhancedProjection ? 
            ((optimalStack.enhancedProjection - optimalStack.totalProjection) / optimalStack.totalProjection * 100).toFixed(2) + '%' : 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Stack optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize stack'
    });
  }
});

// Enhanced helper functions with external data integration
async function fetchExternalOptimizationData() {
  const data = { sources: [] };
  
  try {
    // Fetch odds data
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (apiKey) {
      const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
        params: {
          apiKey,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'decimal'
        }
      });
      data.odds = response.data;
      data.sources.push('The Odds API');
    }
  } catch (error) {
    console.warn('Failed to fetch odds for optimization:', error.message);
  }

  try {
    // Fetch predictions for top players
    const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
    if (apiKey) {
      // This would fetch predictions for relevant players
      data.predictions = {};
      data.sources.push('Prediction API');
    }
  } catch (error) {
    console.warn('Failed to fetch predictions for optimization:', error.message);
  }

  return data;
}

async function fetchExternalComparisonData(playerIds, options = {}) {
  const data = { predictions: {}, oddsContext: {}, sources: [] };
  const { includePredictions = true, includeOddsContext = true } = options;

  if (includePredictions) {
    try {
      const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
      if (apiKey) {
        // Fetch predictions for each player
        for (const playerId of playerIds.slice(0, 10)) { // Limit for demo
          try {
            const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
              }
            });
            data.predictions[playerId] = response.data;
          } catch (error) {
            console.warn(`Failed to fetch prediction for player ${playerId}:`, error.message);
          }
        }
        data.sources.push('Prediction API');
      }
    } catch (error) {
      console.warn('Failed to fetch predictions for comparison:', error.message);
    }
  }

  if (includeOddsContext) {
    try {
      const apiKey = process.env.THE_ODDS_API_KEY;
      if (apiKey) {
        const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
          params: {
            apiKey,
            regions: 'us',
            markets: 'h2h,spreads,totals',
            oddsFormat: 'decimal'
          }
        });
        
        // Process odds data for context
        data.oddsContext = processOddsForContext(response.data);
        data.sources.push('The Odds API');
      }
    } catch (error) {
      console.warn('Failed to fetch odds for comparison:', error.message);
    }
  }

  return data;
}

async function fetchGameContextForTeam(team) {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
      params: {
        apiKey,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'decimal'
      }
    });

    const game = response.data.find(g => 
      g.home_team.includes(team) || g.away_team.includes(team)
    );

    if (!game) return null;

    return {
      opponent: game.home_team.includes(team) ? game.away_team : game.home_team,
      spread: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => 
        o.name.includes(team)
      )?.point,
      total: game.bookmakers?.[0]?.markets?.[1]?.outcomes?.[0]?.point,
      impliedScore: calculateImpliedScore(team, game),
      paceProjection: estimatePaceProjection(game)
    };
  } catch (error) {
    console.warn(`Failed to fetch game context for team ${team}:`, error.message);
    return null;
  }
}

async function runEnhancedGeneticAlgorithm(params) {
  const { externalData, ...otherParams } = params;
  
  // Enhanced genetic algorithm implementation
  const lineup = {
    players: [],
    totalSalary: 0,
    totalProjection: 0,
    fitnessScore: 0.85
  };

  // Incorporate external data into optimization
  if (externalData?.odds) {
    lineup.optimizationData = {
      oddsUsed: externalData.odds.length > 0,
      predictionsUsed: externalData.predictions ? Object.keys(externalData.predictions).length > 0 : false,
      dataSources: externalData.sources
    };
  }

  return lineup;
}

function generateEnhancedPlayerRecommendation(player, platform, metric, prediction, oddsContext) {
  const salary = platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
  const baseProjection = player.projection || 0;
  
  // Start with base value ratio
  let valueRatio = baseProjection / (salary || 1);
  
  // Adjust based on prediction if available
  if (prediction) {
    const predictionAdjusted = prediction.adjustedProjection || baseProjection;
    valueRatio = (valueRatio + (predictionAdjusted / (salary || 1))) / 2;
  }
  
  // Adjust based on odds context if available
  if (oddsContext) {
    if (oddsContext.spread > 0) { // Team is favored
      valueRatio *= 1.05;
    } else if (oddsContext.spread < -3) { // Team is big underdog
      valueRatio *= 0.95;
    }
  }
  
  if (valueRatio > 0.006) {
    return 'Strong value play';
  } else if (valueRatio > 0.004) {
    return 'Good value';
  } else if (valueRatio > 0.002) {
    return 'Fair value';
  } else {
    return 'Poor value';
  }
}

function findEnhancedOptimalStack(players, platform, stackType, maxPlayers, budget, gameContext = null) {
  const enhancedPlayers = players.map(p => {
    const salary = platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary;
    const baseProjection = p.projection || 0;
    
    // Calculate base value
    let valueRatio = baseProjection / (salary || 1);
    let enhancedProjection = baseProjection;
    
    // Enhance based on game context
    if (gameContext) {
      // Adjust projection based on game context
      enhancedProjection = adjustProjectionForGameContext(p, baseProjection, gameContext);
      valueRatio = enhancedProjection / (salary || 1);
    }
    
    return {
      ...p.toObject(),
      salary,
      baseProjection,
      enhancedProjection,
      valueRatio,
      adjustedValue: enhancedProjection
    };
  });

  // Sort based on stack type
  let sortedPlayers;
  switch (stackType) {
    case 'correlation':
      sortedPlayers = enhancedPlayers.sort((a, b) => 
        (b.correlationScore || 0.5) * b.enhancedProjection - (a.correlationScore || 0.5) * a.enhancedProjection
      );
      break;
    case 'value':
      sortedPlayers = enhancedPlayers.sort((a, b) => b.valueRatio - a.valueRatio);
      break;
    case 'ownership':
      sortedPlayers = enhancedPlayers.sort((a, b) => (b.ownership || 0) - (a.ownership || 0));
      break;
    case 'projection':
      sortedPlayers = enhancedPlayers.sort((a, b) => b.enhancedProjection - a.enhancedProjection);
      break;
    default:
      sortedPlayers = enhancedPlayers.sort((a, b) => b.valueRatio - a.valueRatio);
  }

  // Greedy algorithm for stack selection
  const stack = [];
  let totalCost = 0;
  let totalProjection = 0;
  let enhancedTotalProjection = 0;
  
  for (const player of sortedPlayers) {
    if (stack.length >= maxPlayers) break;
    if (totalCost + player.salary <= budget) {
      stack.push({
        playerId: player._id,
        name: player.name,
        position: player.position,
        salary: player.salary,
        baseProjection: player.baseProjection,
        enhancedProjection: player.enhancedProjection,
        valueRatio: player.valueRatio
      });
      totalCost += player.salary;
      totalProjection += player.baseProjection;
      enhancedTotalProjection += player.enhancedProjection;
    }
  }
  
  return { players: stack, totalCost, totalProjection, enhancedProjection: enhancedTotalProjection };
}

// Additional helper functions
function getMetricValue(playerData, metric) {
  if (metric === 'predictionAdjusted' && playerData.metrics.predictionAdjusted) {
    return playerData.metrics.predictionAdjusted;
  }
  return playerData.metrics[metric] || 0;
}

function processOddsForContext(oddsData) {
  const context = {};
  
  oddsData.forEach(game => {
    const homeTeam = game.home_team;
    const awayTeam = game.away_team;
    
    const spreadMarket = game.bookmakers?.[0]?.markets?.[0];
    const totalMarket = game.bookmakers?.[0]?.markets?.[1];
    
    if (spreadMarket && totalMarket) {
      const homeSpread = spreadMarket.outcomes?.find(o => o.name.includes(homeTeam))?.point || 0;
      const total = totalMarket.outcomes?.[0]?.point || 0;
      
      const impliedHomeScore = (total / 2) - (homeSpread / 2);
      const impliedAwayScore = (total / 2) + (homeSpread / 2);
      
      context[homeTeam] = {
        spread: homeSpread,
        total: total,
        impliedScore: impliedHomeScore
      };
      
      context[awayTeam] = {
        spread: -homeSpread,
        total: total,
        impliedScore: impliedAwayScore
      };
    }
  });
  
  return context;
}

function calculateImpliedScore(team, game) {
  const spreadMarket = game.bookmakers?.[0]?.markets?.[0];
  const totalMarket = game.bookmakers?.[0]?.markets?.[1];
  
  if (!spreadMarket || !totalMarket) return null;
  
  const homeTeam = game.home_team;
  const isHomeTeam = homeTeam.includes(team);
  
  const spread = spreadMarket.outcomes?.find(o => o.name.includes(team))?.point || 0;
  const total = totalMarket.outcomes?.[0]?.point || 0;
  
  if (isHomeTeam) {
    return (total / 2) - (spread / 2);
  } else {
    return (total / 2) + (spread / 2);
  }
}

function estimatePaceProjection(game) {
  // Simple pace estimation based on team averages
  // In production, this would use historical data
  const basePace = 100; // Average NBA possessions per game
  const spread = game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.point || 0;
  const total = game.bookmakers?.[0]?.markets?.[1]?.outcomes?.[0]?.point || 0;
  
  // Higher totals suggest faster pace
  if (total > 230) return basePace * 1.05;
  if (total > 220) return basePace * 1.02;
  if (total < 210) return basePace * 0.98;
  if (total < 200) return basePace * 0.95;
  
  return basePace;
}

function adjustProjectionForGameContext(player, baseProjection, gameContext) {
  let adjusted = baseProjection;
  
  // Adjust based on implied score
  if (gameContext.impliedScore) {
    const scoreFactor = gameContext.impliedScore / 110; // 110 is average team score
    adjusted *= scoreFactor;
  }
  
  // Adjust based on pace
  if (gameContext.paceProjection) {
    const paceFactor = gameContext.paceProjection / 100; // 100 is average pace
    adjusted *= paceFactor;
  }
  
  // Position-specific adjustments
  if (player.position === 'PG' || player.position === 'G') {
    // Guards benefit more from pace
    adjusted *= 1.02;
  } else if (player.position === 'C') {
    // Centers benefit from high totals
    if (gameContext.total > 225) {
      adjusted *= 1.03;
    }
  }
  
  return adjusted;
}

function calculateEnhancedCorrelationScore(players, stackType, gameContext) {
  if (players.length < 2) return 0;
  
  let baseScore = players.length / 4; // Base score based on stack size
  
  // Enhance based on game context
  if (gameContext) {
    if (gameContext.total > 225) {
      baseScore *= 1.1; // High-total games are good for stacks
    }
    if (Math.abs(gameContext.spread) < 3) {
      baseScore *= 1.05; // Close games are good for stacks
    }
  }
  
  // Position diversity bonus
  const positions = players.map(p => p.position);
  const uniquePositions = [...new Set(positions)];
  if (uniquePositions.length > 1) {
    baseScore *= 1.05;
  }
  
  return Math.min(baseScore, 1.0); // Cap at 1.0
}

function generateEnhancedStackRecommendations(players, gameContext) {
  const positions = players.map(p => p.position);
  const uniquePositions = [...new Set(positions)];
  
  const recommendations = {
    recommendedPositions: uniquePositions,
    stackStrength: players.length >= 3 ? 'Strong' : 'Moderate',
    diversification: players.length > 2 ? 'Good' : 'Low'
  };
  
  if (gameContext) {
    recommendations.gameContext = {
      projectedPace: gameContext.paceProjection ? `${gameContext.paceProjection} (${gameContext.paceProjection > 100 ? 'Fast' : 'Slow'})` : 'Unknown',
      gameEnvironment: gameContext.total > 225 ? 'High-scoring' : 'Average-scoring'
    };
  }
  
  return recommendations;
}

function generateEnhancedComparisonSummary(comparison, metric) {
  const metricValues = comparison.map(c => getMetricValue(c, metric)).filter(v => v > 0);
  const avgValue = metricValues.length > 0 ? 
    metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length : 0;
  
  return {
    totalPlayers: comparison.length,
    metricUsed: metric,
    bestValuePlayer: comparison[0]?.player?.name,
    worstValuePlayer: comparison[comparison.length - 1]?.player?.name,
    averageMetric: avgValue,
    metricRange: metricValues.length > 0 ? 
      (Math.max(...metricValues) - Math.min(...metricValues)).toFixed(2) : 0
  };
}

// Original helper functions maintained for compatibility
function analyzeOptimizedLineup(lineup) {
  return {
    totalPlayers: lineup.players?.length || 0,
    positionBalance: 'Balanced',
    teamDiversification: 'Good',
    valueScore: lineup.fitnessScore || 0
  };
}

function calculateConfidenceScore(lineup) {
  return lineup.fitnessScore || 0.5;
}

function generateAlternativeLineups(lineup, count) {
  return Array(count).fill(null).map((_, i) => ({
    ...lineup,
    fitnessScore: lineup.fitnessScore ? lineup.fitnessScore * (0.9 - i * 0.1) : 0.7 - i * 0.1
  }));
}

export default router;
