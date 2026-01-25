// src/controllers/fantasyDraftController.js
import Player from '../models/Player.js';
import { calculatePlayerValue } from '../utils/fantasyCalculations.js';

// GET /api/fantasy/snake/:position
export const getSnakeDraft = async (req, res) => {
  try {
    const { position } = req.params;
    const { sport = 'NBA' } = req.query;
    
    // Convert position to number
    const draftPosition = parseInt(position);
    
    if (isNaN(draftPosition) || draftPosition < 1 || draftPosition > 150) {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft position. Must be between 1-150'
      });
    }

    // Get players for the specified sport
    const players = await Player.find({ 
      sport,
      isActive: true 
    })
    .sort({
      fantasyScore: -1,
      value: -1,
      projectedPoints: -1
    })
    .limit(200); // Get more players to find specific draft position

    // Apply snake draft logic
    const snakeDraftResults = applySnakeDraftLogic(players, draftPosition);
    
    res.status(200).json({
      success: true,
      draftPosition,
      sport,
      results: snakeDraftResults
    });
    
  } catch (error) {
    console.error('Snake draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching snake draft data'
    });
  }
};

// GET /api/fantasy/turn/:position
export const getTurnDraft = async (req, res) => {
  try {
    const { position } = req.params;
    const { sport = 'NBA', platform = 'FanDuel' } = req.query;
    
    const draftPosition = parseInt(position);
    
    if (isNaN(draftPosition) || draftPosition < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft position'
      });
    }

    // Get players with advanced filtering criteria
    const players = await Player.find({ 
      sport,
      isActive: true,
      injuryStatus: { $ne: 'OUT' } // Exclude injured players
    })
    .sort({
      // Order by the specified criteria
      [`${platform.toLowerCase()}Salary`]: 1, // Cost ascending (cheapest first)
      value: -1, // Value descending
      projectedPoints: -1
    });

    // Group by position and get top 5 for each
    const turnResults = getTopPlayersByPosition(players, draftPosition, platform);
    
    res.status(200).json({
      success: true,
      draftPosition,
      sport,
      platform,
      results: turnResults
    });
    
  } catch (error) {
    console.error('Turn draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching turn draft data'
    });
  }
};

// POST /api/fantasy/optimal-draft
export const generateOptimalDraft = async (req, res) => {
  try {
    const { 
      contestants = 10, 
      rounds = 6, 
      sport = 'NBA',
      platform = 'FanDuel',
      budget = 60000,
      lineupRequirements 
    } = req.body;

    // Get all players
    const players = await Player.find({ 
      sport,
      isActive: true 
    });

    // Generate optimal draft strategy
    const draftStrategy = generateDraftStrategy(
      players, 
      contestants, 
      rounds, 
      platform,
      budget,
      lineupRequirements
    );

    res.status(200).json({
      success: true,
      strategy: draftStrategy
    });

  } catch (error) {
    console.error('Optimal draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating optimal draft'
    });
  }
};

// Helper Functions

const applySnakeDraftLogic = (players, draftPosition) => {
  // Simulate picks before current position
  const picksBefore = draftPosition - 1;
  const availablePlayers = [...players];
  
  // Simple simulation: remove top picks based on value
  const takenPlayers = availablePlayers
    .sort((a, b) => b.value - a.value)
    .slice(0, picksBefore);
  
  // Get remaining players (simulating what's left at this pick)
  const remainingPlayers = availablePlayers
    .filter(player => !takenPlayers.some(taken => taken._id.equals(player._id)))
    .sort((a, b) => b.fantasyScore - a.fantasyScore);
  
  // Return top 3 available players for this draft position
  return remainingPlayers.slice(0, 3).map(player => ({
    player: {
      id: player._id,
      name: player.name,
      position: player.position,
      team: player.team,
      value: player.value,
      fantasyScore: player.fantasyScore,
      fanDuelSalary: player.fanDuelSalary,
      draftKingsSalary: player.draftKingsSalary
    },
    reason: `Best available at pick ${draftPosition} - High value (${player.value.toFixed(2)}x)`
  }));
};

const getTopPlayersByPosition = (players, draftPosition, platform) => {
  // Define positions based on sport
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  
  const results = {};
  
  positions.forEach(position => {
    // Filter players by position
    const positionPlayers = players.filter(player => 
      player.position.includes(position)
    );
    
    // Apply advanced scoring criteria
    const scoredPlayers = positionPlayers.map(player => {
      const score = calculateAdvancedScore(player, draftPosition, platform);
      return { ...player._doc, selectionScore: score };
    });
    
    // Sort by selection score
    scoredPlayers.sort((a, b) => b.selectionScore - a.selectionScore);
    
    // Get top 5
    results[position] = scoredPlayers.slice(0, 5).map(player => ({
      player: {
        id: player._id,
        name: player.name,
        position: player.position,
        team: player.team,
        salary: player[`${platform.toLowerCase()}Salary`],
        value: player.value,
        fantasyScore: player.fantasyScore,
        injuryStatus: player.injuryStatus,
        opponent: player.opponent
      },
      selectionScore: player.selectionScore.toFixed(2),
      reasons: getSelectionReasons(player, platform)
    }));
  });
  
  return results;
};

const calculateAdvancedScore = (player, draftPosition, platform) => {
  let score = 0;
  
  // 1. Cost (40% weight) - Lower salary is better
  const maxSalary = platform === 'FanDuel' ? 10000 : 9000;
  const salary = player[`${platform.toLowerCase()}Salary`] || 5000;
  const costScore = (maxSalary - salary) / maxSalary * 40;
  score += costScore;
  
  // 2. Injuries (20% weight) - Penalize injured players
  const injuryPenalty = player.injuryStatus === 'OUT' ? -20 : 
                       player.injuryStatus === 'GTD' ? -10 : 0;
  score += injuryPenalty;
  
  // 3. Opponent (15% weight) - Consider defensive matchup
  const opponentScore = calculateOpponentScore(player.opponent);
  score += opponentScore * 15;
  
  // 4. Advanced stats (15% weight)
  const advancedScore = calculateAdvancedStatsScore(player.advancedStats);
  score += advancedScore * 15;
  
  // 5. Trends (5% weight)
  const trendScore = player.trend === 'up' ? 5 : 
                    player.trend === 'down' ? 0 : 2.5;
  score += trendScore;
  
  // 6. Statistics (5% weight)
  const statScore = (player.fantasyScore || 0) / 100 * 5;
  score += statScore;
  
  // Adjust for draft position (later picks get slight boost)
  const positionAdjustment = draftPosition > 50 ? 5 : 0;
  score += positionAdjustment;
  
  return score;
};

const calculateOpponentScore = (opponent) => {
  // Implement opponent defensive rating logic
  // This should be based on actual opponent defensive stats
  const defensiveRankings = {
    'SAS': 0.8,  // Good matchup
    'DET': 0.9,  // Great matchup
    'BOS': 0.3,  // Tough matchup
    'MIL': 0.4   // Tough matchup
    // Add more teams
  };
  
  return defensiveRankings[opponent] || 0.5;
};

const calculateAdvancedStatsScore = (advancedStats) => {
  // Calculate based on advanced metrics
  if (!advancedStats) return 0.5;
  
  const { usageRate, efficiency, defensiveRating } = advancedStats;
  
  let score = 0;
  if (usageRate > 25) score += 0.3;
  if (efficiency > 55) score += 0.3;
  if (defensiveRating > 110) score += 0.2;
  if (score > 1) score = 1;
  
  return score;
};

const getSelectionReasons = (player, platform) => {
  const reasons = [];
  
  // Cost reason
  const salary = player[`${platform.toLowerCase()}Salary`];
  if (salary < (platform === 'FanDuel' ? 5000 : 4500)) {
    reasons.push('Excellent value for salary');
  } else if (salary < (platform === 'FanDuel' ? 7000 : 6500)) {
    reasons.push('Good salary efficiency');
  }
  
  // Injury reason
  if (player.injuryStatus === 'GTD') {
    reasons.push('Monitor injury status');
  } else if (!player.injuryStatus || player.injuryStatus === 'ACTIVE') {
    reasons.push('Full health, no injury concerns');
  }
  
  // Opponent reason
  const opponentScore = calculateOpponentScore(player.opponent);
  if (opponentScore > 0.7) {
    reasons.push('Favorable matchup');
  }
  
  // Trend reason
  if (player.trend === 'up') {
    reasons.push('Positive trending performance');
  }
  
  return reasons;
};

const generateDraftStrategy = (players, contestants, rounds, platform, budget, lineupRequirements) => {
  // Generate optimal picks for each round in a snake draft
  const totalPicks = contestants * rounds;
  const picks = [];
  
  // Sort players by value
  const sortedPlayers = [...players]
    .map(p => ({
      ...p._doc,
      draftValue: calculateDraftValue(p, platform, contestants)
    }))
    .sort((a, b) => b.draftValue - a.draftValue);
  
  // Generate picks for each round
  for (let round = 1; round <= rounds; round++) {
    const isReverseOrder = round % 2 === 0; // Snake: reverse order on even rounds
    
    for (let pickInRound = 1; pickInRound <= contestants; pickInRound++) {
      const overallPick = (round - 1) * contestants + pickInRound;
      
      // Calculate which contestant is picking (snake order)
      let contestant;
      if (!isReverseOrder) {
        contestant = pickInRound;
      } else {
        contestant = contestants - pickInRound + 1;
      }
      
      // Get best available player for this pick
      const bestPlayer = getBestAvailablePlayer(
        sortedPlayers, 
        picks, 
        contestant, 
        round,
        lineupRequirements
      );
      
      if (bestPlayer) {
        picks.push({
          round,
          overallPick,
          contestant,
          player: bestPlayer,
          position: bestPlayer.position,
          reason: getPickReason(bestPlayer, round)
        });
      }
    }
  }
  
  return {
    strategyName: `${contestants}-Team ${rounds}-Round Snake Draft`,
    totalPicks,
    contestants,
    rounds,
    picks: picks.sort((a, b) => a.overallPick - b.overallPick),
    tips: getDraftTips(contestants, rounds, platform)
  };
};

const calculateDraftValue = (player, platform, contestants) => {
  // Adjust value based on draft size
  const baseValue = player.value || 1;
  const scarcityMultiplier = contestants > 8 ? 1.2 : 1.0;
  
  return baseValue * scarcityMultiplier;
};

const getBestAvailablePlayer = (players, takenPicks, contestant, round, lineupRequirements) => {
  // Remove already taken players
  const availablePlayers = players.filter(player =>
    !takenPicks.some(pick => pick.player._id.equals(player._id))
  );
  
  // Positional scarcity logic
  if (lineupRequirements) {
    // Implement lineup requirement logic
    const positionNeeds = calculatePositionNeeds(takenPicks, contestant, lineupRequirements);
    
    // Prioritize positions of need
    const prioritizedPlayers = availablePlayers.map(player => {
      const position = player.position;
      const needMultiplier = positionNeeds[position] || 1;
      
      return {
        ...player,
        priorityScore: player.draftValue * needMultiplier
      };
    });
    
    prioritizedPlayers.sort((a, b) => b.priorityScore - a.priorityScore);
    return prioritizedPlayers[0];
  }
  
  return availablePlayers[0];
};

const getPickReason = (player, round) => {
  const reasons = [
    `Round ${round}: Securing elite production`,
    `Excellent value at this point in draft`,
    `Positional scarcity makes this a priority`,
    `High-floor player for roster stability`,
    `Upside pick with breakout potential`
  ];
  
  return reasons[Math.min(round - 1, reasons.length - 1)];
};

const getDraftTips = (contestants, rounds, platform) => {
  return [
    `Early Rounds (1-3): Focus on elite, high-floor players`,
    `Middle Rounds (4-8): Target value and upside`,
    `Late Rounds (9+): Swing for breakout candidates`,
    `Monitor injury reports throughout the draft`,
    `Consider stacking teammates with good matchups`,
    `Save 5-10% of budget for late-round fliers`
  ];
};
