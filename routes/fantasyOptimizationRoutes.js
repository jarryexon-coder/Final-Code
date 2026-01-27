import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Player from '../models/Player.js';
import Simulation from '../models/simulation.js';

const router = express.Router();

// AI-powered lineup optimization
router.post('/lineup', authenticateToken, async (req, res) => {
  try {
    const { 
      sport = 'NBA',
      platform = 'FanDuel',
      contestType = 'tournament',
      strategy = 'optimized',
      constraints = {},
      iterations = 10000
    } = req.body;

    // Run genetic algorithm for optimization
    const optimalLineup = await runGeneticAlgorithm({
      sport,
      platform,
      contestType,
      strategy,
      constraints,
      iterations
    });

    res.json({
      success: true,
      data: {
        lineup: optimalLineup,
        analysis: analyzeOptimizedLineup(optimalLineup),
        confidence: calculateConfidenceScore(optimalLineup),
        alternatives: generateAlternativeLineups(optimalLineup, 3)
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

// Player comparison
router.post('/compare-players', async (req, res) => {
  try {
    const { playerIds, platform = 'FanDuel', metric = 'value' } = req.body;
    
    if (!playerIds || playerIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 player IDs required'
      });
    }

    const players = await Player.find({ _id: { $in: playerIds } });
    
    const comparison = players.map(player => ({
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
        ownership: player.ownership
      },
      recommendation: generatePlayerRecommendation(player, platform, metric)
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
        summary: generateComparisonSummary(comparison, metric)
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

// Stack optimization
router.post('/optimize-stack', authenticateToken, async (req, res) => {
  try {
    const { 
      team,
      sport = 'NBA',
      platform = 'FanDuel',
      stackType = 'correlation',
      maxPlayers = 4,
      budget = 20000
    } = req.body;

    const players = await Player.find({ 
      sport,
      team,
      active: true
    });

    const optimalStack = findOptimalStack(
      players,
      platform,
      stackType,
      maxPlayers,
      budget
    );

    res.json({
      success: true,
      data: {
        team,
        stackType,
        players: optimalStack,
        totalCost: optimalStack.reduce((sum, p) => sum + p.salary, 0),
        totalProjection: optimalStack.reduce((sum, p) => sum + p.projection, 0),
        correlationScore: calculateCorrelationScore(optimalStack, stackType),
        stackRecommendations: generateStackRecommendations(optimalStack)
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

// Helper functions
async function runGeneticAlgorithm(params) {
  // This would implement a genetic algorithm for lineup optimization
  // For now, return a mock optimized lineup
  return {
    players: [],
    totalSalary: 0,
    totalProjection: 0,
    fitnessScore: 0.85
  };
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

function findOptimalStack(players, platform, stackType, maxPlayers, budget) {
  const valuedPlayers = players.map(p => ({
    ...p.toObject(),
    salary: platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary,
    valueRatio: (p.projection || 0) / (platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary || 1)
  })).sort((a, b) => b.valueRatio - a.valueRatio);

  // Simple greedy algorithm for stack selection
  const stack = [];
  let totalCost = 0;
  
  for (const player of valuedPlayers) {
    if (stack.length >= maxPlayers) break;
    if (totalCost + player.salary <= budget) {
      stack.push({
        playerId: player._id,
        name: player.name,
        position: player.position,
        salary: player.salary,
        projection: player.projection,
        valueRatio: player.valueRatio
      });
      totalCost += player.salary;
    }
  }
  
  return stack;
}

export default router;
