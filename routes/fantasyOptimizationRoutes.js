import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Player from '../models/Player.js';
import Simulation from '../models/simulation.js';
import axios from 'axios';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "fantasyOptimization API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * /api/fantasy/lineup:
 *   post:
 *     summary: Optimize fantasy lineup using AI
 *     description: Use genetic algorithm to optimize fantasy basketball lineup based on projections, odds, and player predictions
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
      includeOdds = true,
      includePredictions = true
    } = req.body;

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
              markets: 'h2h,spreads,totals',
              oddsFormat: 'decimal'
            }
          });
          oddsData = response.data;
        }
      } catch (oddsError) {
        console.warn('Failed to fetch odds for optimization:', oddsError.message);
      }
    }

    if (includePredictions) {
      try {
        // Would fetch predictions for relevant players
        predictionsData = await fetchPlayerPredictions(req.body.playerIds || []);
      } catch (predictionError) {
        console.warn('Failed to fetch predictions for optimization:', predictionError.message);
      }
    }

    // Run genetic algorithm for optimization with enhanced data
    const optimalLineup = await runGeneticAlgorithm({
      sport,
      platform,
      contestType,
      strategy,
      constraints,
      iterations,
      oddsData,
      predictionsData
    });

    res.json({
      success: true,
      data: {
        lineup: optimalLineup,
        analysis: analyzeOptimizedLineup(optimalLineup),
        confidence: calculateConfidenceScore(optimalLineup),
        alternatives: generateAlternativeLineups(optimalLineup, 3),
        metadata: {
          oddsIncluded: !!oddsData,
          predictionsIncluded: !!predictionsData,
          optimizationStrategy: strategy
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
 * /api/fantasy/compare-players:
 *   post:
 *     summary: Compare players for fantasy selection
 *     description: Compare multiple players across various metrics including predictions and odds
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
 *                   $ref: '#/components/schemas/PlayerComparison'
 *       400:
 *         description: Invalid input - at least 2 player IDs required
 *       500:
 *         description: Failed to compare players
 */
router.post('/compare-players', async (req, res) => {
  try {
    const { playerIds, platform = 'FanDuel', metric = 'value', includePredictions = true } = req.body;
    
    if (!playerIds || playerIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 player IDs required'
      });
    }

    const players = await Player.find({ _id: { $in: playerIds } });
    
    // Fetch predictions for players if requested
    let playerPredictions = {};
    if (includePredictions) {
      try {
        const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
        if (apiKey) {
          for (const player of players) {
            const prediction = await fetchPlayerPrediction(player._id);
            if (prediction) {
              playerPredictions[player._id] = prediction;
            }
          }
        }
      } catch (predictionError) {
        console.warn('Failed to fetch player predictions:', predictionError.message);
      }
    }

    const comparison = await Promise.all(players.map(async (player) => {
      const prediction = playerPredictions[player._id];
      
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
          prediction: prediction ? prediction.predictedPoints : null
        },
        recommendation: generatePlayerRecommendation(player, platform, metric),
        predictionMetadata: prediction ? {
          confidence: prediction.confidence,
          source: prediction.source,
          updatedAt: prediction.updatedAt
        } : null
      };
    }));

    // Sort by selected metric
    comparison.sort((a, b) => {
      const aValue = a.metrics[metric] || 0;
      const bValue = b.metrics[metric] || 0;
      return bValue - aValue;
    });

    res.json({
      success: true,
      data: {
        comparison,
        bestValue: comparison[0],
        worstValue: comparison[comparison.length - 1],
        summary: generateComparisonSummary(comparison, metric),
        metadata: {
          predictionsIncluded: includePredictions && Object.keys(playerPredictions).length > 0,
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
 * /api/fantasy/optimize-stack:
 *   post:
 *     summary: Optimize player stack for a team
 *     description: Find optimal player stack from a specific team considering correlations and value
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
 *                 enum: [correlation, value, ownership]
 *                 default: correlation
 *               maxPlayers:
 *                 type: integer
 *                 default: 4
 *               budget:
 *                 type: integer
 *                 default: 20000
 *               includeGameOdds:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Stack optimized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizedStack'
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
      includeGameOdds = true
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

    // Fetch game odds if requested
    let gameOdds = null;
    if (includeGameOdds) {
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
          // Find odds for the specific team
          gameOdds = response.data.find(game => 
            game.home_team.includes(team) || game.away_team.includes(team)
          );
        }
      } catch (oddsError) {
        console.warn('Failed to fetch game odds for stack optimization:', oddsError.message);
      }
    }

    const optimalStack = findOptimalStack(
      players,
      platform,
      stackType,
      maxPlayers,
      budget,
      gameOdds
    );

    res.json({
      success: true,
      data: {
        team,
        stackType,
        players: optimalStack.players,
        totalCost: optimalStack.totalCost,
        totalProjection: optimalStack.totalProjection,
        correlationScore: calculateCorrelationScore(optimalStack.players, stackType),
        stackRecommendations: generateStackRecommendations(optimalStack.players),
        gameContext: gameOdds ? {
          opponent: gameOdds.home_team.includes(team) ? gameOdds.away_team : gameOdds.home_team,
          spread: gameOdds.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => 
            o.name.includes(team)
          )?.point,
          overUnder: gameOdds.bookmakers?.[0]?.markets?.[1]?.outcomes?.[0]?.point
        } : null,
        metadata: {
          gameOddsIncluded: !!gameOdds,
          stackSize: optimalStack.players.length,
          budgetUtilization: (optimalStack.totalCost / budget) * 100
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

/**
 * @swagger
 * /api/fantasy/predictions/player/{playerId}:
 *   get:
 *     summary: Get AI predictions for player performance
 *     description: Fetch AI-powered predictions for a specific player's fantasy performance
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlayerPrediction'
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

    // Fetch player info for context
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Call prediction API
    const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      },
      params: {
        sport: 'NBA',
        position: player.position,
        team: player.team
      }
    });

    // Also fetch odds for the player's team if available
    let teamOdds = null;
    try {
      const oddsApiKey = process.env.THE_ODDS_API_KEY;
      if (oddsApiKey) {
        const oddsResponse = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
          params: {
            apiKey: oddsApiKey,
            regions: 'us',
            markets: 'h2h,spreads',
            oddsFormat: 'decimal'
          }
        });
        teamOdds = oddsResponse.data.find(game => 
          game.home_team.includes(player.team) || game.away_team.includes(player.team)
        );
      }
    } catch (oddsError) {
      console.warn('Failed to fetch team odds for prediction:', oddsError.message);
    }

    const prediction = {
      ...response.data,
      playerInfo: {
        name: player.name,
        position: player.position,
        team: player.team,
        salary: player.fanDuelSalary || player.draftKingsSalary
      },
      context: teamOdds ? {
        gameDate: teamOdds.commence_time,
        opponent: teamOdds.home_team.includes(player.team) ? teamOdds.away_team : teamOdds.home_team,
        spread: teamOdds.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => 
          o.name.includes(player.team)
        )?.point
      } : null
    };

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Get player predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player predictions'
    });
  }
});

// Helper functions
async function runGeneticAlgorithm(params) {
  // Enhanced genetic algorithm implementation
  const { oddsData, predictionsData, ...otherParams } = params;
  
  // Incorporate odds and predictions into optimization
  const enhancedParams = {
    ...otherParams,
    externalData: {
      odds: oddsData,
      predictions: predictionsData
    }
  };
  
  // This would implement a genetic algorithm for lineup optimization
  // For now, return a mock optimized lineup
  return {
    players: [],
    totalSalary: 0,
    totalProjection: 0,
    fitnessScore: 0.85,
    optimizationData: {
      oddsUsed: !!oddsData,
      predictionsUsed: !!predictionsData
    }
  };
}

async function fetchPlayerPredictions(playerIds) {
  if (!playerIds || playerIds.length === 0) return {};
  
  const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
  if (!apiKey) return {};
  
  const predictions = {};
  
  // Batch fetch predictions (adjust based on API capabilities)
  for (const playerId of playerIds.slice(0, 10)) { // Limit to 10 for demo
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

async function fetchPlayerPrediction(playerId) {
  const apiKey = process.env.RAPIDAPI_KEY_PREDICTION;
  if (!apiKey) return null;
  
  try {
    const response = await axios.get(`https://api.prediction-service.com/player/${playerId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'prediction-service.p.rapidapi.com'
      }
    });
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch prediction for player ${playerId}:`, error.message);
    return null;
  }
}

function generatePlayerRecommendation(player, platform, metric) {
  const salary = platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
  const valueRatio = (player.projection || 0) / (salary || 1);
  
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

function findOptimalStack(players, platform, stackType, maxPlayers, budget, gameOdds = null) {
  const valuedPlayers = players.map(p => ({
    ...p.toObject(),
    salary: platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary,
    valueRatio: (p.projection || 0) / (platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary || 1),
    // Adjust value based on game context if odds available
    adjustedValue: gameOdds ? adjustValueBasedOnOdds(p, gameOdds) : (p.projection || 0)
  }));

  // Sort based on stack type
  let sortedPlayers;
  switch (stackType) {
    case 'correlation':
      sortedPlayers = valuedPlayers.sort((a, b) => b.adjustedValue - a.adjustedValue);
      break;
    case 'value':
      sortedPlayers = valuedPlayers.sort((a, b) => b.valueRatio - a.valueRatio);
      break;
    case 'ownership':
      sortedPlayers = valuedPlayers.sort((a, b) => (b.ownership || 0) - (a.ownership || 0));
      break;
    default:
      sortedPlayers = valuedPlayers.sort((a, b) => b.valueRatio - a.valueRatio);
  }

  // Simple greedy algorithm for stack selection
  const stack = [];
  let totalCost = 0;
  let totalProjection = 0;
  
  for (const player of sortedPlayers) {
    if (stack.length >= maxPlayers) break;
    if (totalCost + player.salary <= budget) {
      stack.push({
        playerId: player._id,
        name: player.name,
        position: player.position,
        salary: player.salary,
        projection: player.projection,
        valueRatio: player.valueRatio,
        adjustedValue: player.adjustedValue
      });
      totalCost += player.salary;
      totalProjection += player.projection;
    }
  }
  
  return { players: stack, totalCost, totalProjection };
}

function adjustValueBasedOnOdds(player, gameOdds) {
  // Simple adjustment based on game odds
  const baseProjection = player.projection || 0;
  
  // If team is favored, slightly increase projection
  // If underdog, consider game script implications
  const spread = gameOdds.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => 
    o.name.includes(player.team)
  )?.point;
  
  if (spread && spread > 0) {
    // Team is favored by spread points
    return baseProjection * 1.1;
  } else if (spread && spread < 0) {
    // Team is underdog
    return baseProjection * 0.9;
  }
  
  return baseProjection;
}

function calculateCorrelationScore(players, stackType) {
  // Mock correlation calculation
  return players.length > 0 ? 0.75 : 0;
}

function generateStackRecommendations(players) {
  const positions = players.map(p => p.position);
  const uniquePositions = [...new Set(positions)];
  
  return {
    recommendedPositions: uniquePositions,
    stackStrength: players.length >= 3 ? 'Strong' : 'Moderate',
    diversification: players.length > 2 ? 'Good' : 'Low'
  };
}

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

function generateComparisonSummary(comparison, metric) {
  return {
    totalPlayers: comparison.length,
    metricUsed: metric,
    bestValuePlayer: comparison[0]?.player?.name,
    worstValuePlayer: comparison[comparison.length - 1]?.player?.name,
    averageMetric: comparison.reduce((sum, c) => sum + (c.metrics[metric] || 0), 0) / comparison.length
  };
}

export default router;
