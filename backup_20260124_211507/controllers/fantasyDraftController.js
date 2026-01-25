// controllers/fantasyDraftController.js - COMPLETE VERSION
import Draft from '../models/Draft.js';
import Player from '../models/Player.js';
import User from '../models/user.js';
import { 
  calculatePlayerValue, 
  getDraftStrategyTips
} from '../utils/fantasyCalculations.js';

// Get draft settings
export const getDraftSettings = async (req, res) => {
  try {
    const { draftType = 'snake' } = req.query;
    
    const settings = {
      snake: {
        name: 'Snake Draft',
        description: 'Traditional draft where order reverses each round',
        minTeams: 4,
        maxTeams: 20,
        rounds: 15,
        timePerPick: 90,
        auctionBudget: null
      },
      auction: {
        name: 'Auction Draft',
        description: 'Budget-based draft with bidding',
        minTeams: 4,
        maxTeams: 12,
        rounds: 13,
        timePerPick: 45,
        auctionBudget: 200
      },
      linear: {
        name: 'Linear Draft',
        description: 'Same order each round',
        minTeams: 4,
        maxTeams: 20,
        rounds: 15,
        timePerPick: 60,
        auctionBudget: null
      }
    };

    res.json({
      success: true,
      data: {
        draftType,
        settings: settings[draftType] || settings.snake,
        availableTypes: Object.keys(settings)
      }
    });
  } catch (error) {
    console.error('Get draft settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get draft settings', error: error.message });
  }
};

// Create draft
export const createDraft = async (req, res) => {
  try {
    const {
      name,
      type = 'snake',
      teams = 10,
      rounds = 15,
      sport = 'NBA',
      platform = 'FanDuel',
      draftOrder = [],
      commissionerId,
      settings = {}
    } = req.body;

    const commissioner = commissionerId || req.user.userId || req.user._id;

    // Validate draft type
    const validTypes = ['snake', 'auction', 'linear'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid draft type. Must be snake, auction, or linear'
      });
    }

    // Create draft
    const draft = new Draft({
      name,
      type,
      teams,
      rounds,
      sport,
      platform,
      commissioner,
      status: 'pending',
      participants: [commissioner],
      currentRound: 1,
      currentPick: 1,
      draftOrder: draftOrder.length > 0 ? draftOrder : generateDraftOrder(teams),
      settings: {
        timePerPick: 90,
        ...settings
      },
      picks: []
    });

    await draft.save();

    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      data: draft
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ success: false, message: 'Failed to create draft', error: error.message });
  }
};

// Join draft
export const joinDraft = async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.userId || req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check if draft is joinable
    if (draft.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Draft is no longer accepting participants'
      });
    }

    // Check if user is already in draft
    if (draft.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this draft'
      });
    }

    // Check if draft is full
    if (draft.participants.length >= draft.teams) {
      return res.status(400).json({
        success: false,
        message: 'Draft is full'
      });
    }

    // Add user to participants
    draft.participants.push(userId);
    await draft.save();

    res.json({
      success: true,
      message: 'Joined draft successfully',
      data: {
        draftId: draft._id,
        position: draft.participants.length,
        participants: draft.participants.length
      }
    });
  } catch (error) {
    console.error('Join draft error:', error);
    res.status(500).json({ success: false, message: 'Failed to join draft', error: error.message });
  }
};

// Get draft status
export const getDraftStatus = async (req, res) => {
  try {
    const { draftId } = req.params;

    const draft = await Draft.findById(draftId)
      .populate('participants', 'username email')
      .populate('picks.player', 'name position team')
      .populate('picks.userId', 'username');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Calculate draft statistics
    const stats = {
      totalPicks: draft.picks.length,
      picksByPosition: {},
      picksByTeam: {},
      averagePickTime: 0,
      remainingPicks: (draft.teams * draft.rounds) - draft.picks.length
    };

    draft.picks.forEach(pick => {
      // Count picks by position
      const position = pick.player?.position || 'Unknown';
      stats.picksByPosition[position] = (stats.picksByPosition[position] || 0) + 1;

      // Count picks by team
      const team = pick.player?.team || 'Unknown';
      stats.picksByTeam[team] = (stats.picksByTeam[team] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        draft,
        stats,
        current: {
          round: draft.currentRound,
          pick: draft.currentPick,
          onTheClock: draft.draftOrder[(draft.currentPick - 1) % draft.teams],
          nextPick: draft.currentPick + 1,
          timeRemaining: draft.settings.timePerPick
        }
      }
    });
  } catch (error) {
    console.error('Get draft status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get draft status', error: error.message });
  }
};

// Make pick
export const makePick = async (req, res) => {
  try {
    const { draftId } = req.params;
    const { playerId, position } = req.body;
    const userId = req.user.userId || req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check if it's user's turn
    const currentPicker = draft.draftOrder[(draft.currentPick - 1) % draft.teams];
    if (currentPicker !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn to pick'
      });
    }

    // Check if draft is active
    if (draft.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Draft is not active'
      });
    }

    // Check if player is available
    const playerAlreadyPicked = draft.picks.some(pick => 
      pick.player.toString() === playerId
    );
    
    if (playerAlreadyPicked) {
      return res.status(400).json({
        success: false,
        message: 'Player already drafted'
      });
    }

    // Get player details
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Add pick
    const pick = {
      round: draft.currentRound,
      overallPick: draft.currentPick,
      player: playerId,
      userId,
      position: position || player.position,
      timestamp: new Date(),
      autoPick: false
    };

    draft.picks.push(pick);
    
    // Update draft state
    draft.currentPick += 1;
    
    // Check if round is complete
    if (draft.currentPick > draft.teams * draft.currentRound) {
      draft.currentRound += 1;
      
      // Reverse order for snake drafts
      if (draft.type === 'snake' && draft.currentRound % 2 === 0) {
        draft.draftOrder.reverse();
      }
    }

    // Check if draft is complete
    if (draft.currentPick > (draft.teams * draft.rounds)) {
      draft.status = 'completed';
      draft.completedAt = new Date();
    }

    await draft.save();

    res.json({
      success: true,
      message: 'Pick made successfully',
      data: {
        pick,
        draftStatus: {
          round: draft.currentRound,
          pick: draft.currentPick,
          remainingPicks: (draft.teams * draft.rounds) - draft.currentPick + 1
        }
      }
    });
  } catch (error) {
    console.error('Make pick error:', error);
    res.status(500).json({ success: false, message: 'Failed to make pick', error: error.message });
  }
};

// Undo pick
export const undoPick = async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.userId || req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check if user is commissioner
    if (draft.commissioner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only commissioner can undo picks'
      });
    }

    // Check if there are picks to undo
    if (draft.picks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No picks to undo'
      });
    }

    // Remove last pick
    const lastPick = draft.picks.pop();
    
    // Update draft state
    draft.currentPick -= 1;
    
    // Check if we need to go back a round
    if (draft.currentPick <= draft.teams * (draft.currentRound - 1)) {
      draft.currentRound -= 1;
      
      // Reverse order for snake drafts if needed
      if (draft.type === 'snake' && draft.currentRound % 2 === 0) {
        draft.draftOrder.reverse();
      }
    }

    draft.status = 'active';
    await draft.save();

    res.json({
      success: true,
      message: 'Pick undone successfully',
      data: {
        undonePick: lastPick,
        draftStatus: {
          round: draft.currentRound,
          pick: draft.currentPick,
          nextPicker: draft.draftOrder[(draft.currentPick - 1) % draft.teams]
        }
      }
    });
  } catch (error) {
    console.error('Undo pick error:', error);
    res.status(500).json({ success: false, message: 'Failed to undo pick', error: error.message });
  }
};

// Get available players
export const getAvailablePlayers = async (req, res) => {
  try {
    const { draftId } = req.params;
    const { 
      position,
      team,
      sortBy = 'fantasyScore',
      limit = 50,
      page = 1
    } = req.query;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Get already drafted players
    const draftedPlayerIds = draft.picks.map(pick => pick.player);

    // Build query
    const query = {
      _id: { $nin: draftedPlayerIds },
      sport: draft.sport,
      isActive: true
    };

    if (position && position !== 'all') {
      query.position = position;
    }
    if (team && team !== 'all') {
      query.team = team;
    }

    // Determine sort order
    const sort = {};
    if (sortBy === 'fantasyScore') {
      sort.fantasyScore = -1;
    } else if (sortBy === 'value') {
      sort.value = -1;
    } else if (sortBy === 'salary') {
      const salaryField = `${draft.platform.toLowerCase()}Salary`;
      sort[salaryField] = 1; // Ascending for salary (cheapest first)
    }

    // Get players
    const skip = (page - 1) * limit;
    const players = await Player.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Player.countDocuments(query);

    res.json({
      success: true,
      data: {
        draftId,
        players,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          position: position || 'all',
          team: team || 'all',
          sortBy
        }
      }
    });
  } catch (error) {
    console.error('Get available players error:', error);
    res.status(500).json({ success: false, message: 'Failed to get available players', error: error.message });
  }
};

// Get draft results
export const getDraftResults = async (req, res) => {
  try {
    const { draftId } = req.params;
    const { format = 'detailed' } = req.query;

    const draft = await Draft.findById(draftId)
      .populate('participants', 'username email')
      .populate('picks.player', 'name position team')
      .populate('picks.userId', 'username');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Group picks by team
    const teamRosters = {};
    draft.participants.forEach(participant => {
      teamRosters[participant._id] = {
        user: participant,
        picks: [],
        positions: {},
        totalValue: 0,
        averagePick: 0
      };
    });

    // Calculate team statistics
    draft.picks.forEach((pick, index) => {
      const team = teamRosters[pick.userId._id];
      if (team) {
        team.picks.push({
          round: pick.round,
          overallPick: index + 1,
          player: pick.player,
          position: pick.position
        });

        // Count positions
        team.positions[pick.position] = (team.positions[pick.position] || 0) + 1;

        // Calculate value (simplified - in real app, use actual player value)
        team.totalValue += (pick.player?.fantasyScore || 0) / 100;
        team.averagePick = (team.averagePick * (team.picks.length - 1) + (index + 1)) / team.picks.length;
      }
    });

    // Format results based on requested format
    let results;
    if (format === 'summary') {
      results = {
        draftId: draft._id,
        name: draft.name,
        type: draft.type,
        status: draft.status,
        completedAt: draft.completedAt,
        totalPicks: draft.picks.length,
        teams: draft.teams,
        winner: determineWinner(teamRosters),
        teamSummaries: Object.values(teamRosters).map(team => ({
          username: team.user.username,
          totalPicks: team.picks.length,
          totalValue: team.totalValue.toFixed(2),
          averagePick: team.averagePick.toFixed(1),
          positions: team.positions
        }))
      };
    } else {
      // Detailed format
      results = {
        draftId: draft._id,
        name: draft.name,
        type: draft.type,
        sport: draft.sport,
        platform: draft.platform,
        status: draft.status,
        created: draft.createdAt,
        completedAt: draft.completedAt,
        commissioner: draft.commissioner,
        participants: draft.participants,
        picks: draft.picks.map((pick, index) => ({
          pickNumber: index + 1,
          round: pick.round,
          team: pick.userId?.username,
          player: pick.player,
          position: pick.position,
          timestamp: pick.timestamp
        })),
        teamRosters,
        draftOrder: draft.draftOrder
      };
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get draft results error:', error);
    res.status(500).json({ success: false, message: 'Failed to get draft results', error: error.message });
  }
};

// Get draft history
export const getDraftHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { 
      status = 'all',
      type = 'all',
      limit = 20,
      page = 1 
    } = req.query;

    const query = {
      participants: userId
    };

    if (status !== 'all') {
      query.status = status;
    }
    if (type !== 'all') {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const drafts = await Draft.find(query)
      .populate('commissioner', 'username')
      .populate('participants', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Draft.countDocuments(query);

    // Enrich draft data with user-specific stats
    const enrichedDrafts = drafts.map(draft => {
      const userPicks = draft.picks.filter(pick => 
        pick.userId.toString() === userId.toString()
      );
      
      return {
        ...draft,
        userStats: {
          picksCount: userPicks.length,
          averagePickPosition: userPicks.length > 0 ? 
            userPicks.reduce((sum, pick, index) => sum + (index + 1), 0) / userPicks.length : 0,
          positionsDrafted: userPicks.reduce((acc, pick) => {
            acc[pick.position] = (acc[pick.position] || 0) + 1;
            return acc;
          }, {})
        }
      };
    });

    res.json({
      success: true,
      data: {
        drafts: enrichedDrafts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalDrafts: total,
          completed: await Draft.countDocuments({ ...query, status: 'completed' }),
          active: await Draft.countDocuments({ ...query, status: 'active' }),
          pending: await Draft.countDocuments({ ...query, status: 'pending' })
        }
      }
    });
  } catch (error) {
    console.error('Get draft history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get draft history', error: error.message });
  }
};

// Get mock drafts
export const getMockDrafts = async (req, res) => {
  try {
    const { 
      sport = 'NBA',
      type = 'snake',
      teams = 10,
      rounds = 15,
      limit = 5
    } = req.query;

    // Get top players for the sport
    const players = await Player.find({ 
      sport,
      isActive: true 
    })
    .sort({ fantasyScore: -1 })
    .limit(teams * rounds * 2) // Get more players than needed
    .lean();

    // Generate mock draft simulations
    const mockDrafts = [];
    
    for (let i = 0; i < limit; i++) {
      const draft = generateMockDraft(players, type, teams, rounds, i);
      mockDrafts.push(draft);
    }

    res.json({
      success: true,
      data: {
        sport,
        type,
        teams,
        rounds,
        mockDrafts,
        strategies: getMockDraftStrategies(type, teams)
      }
    });
  } catch (error) {
    console.error('Get mock drafts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get mock drafts', error: error.message });
  }
};

// Simulate draft
export const simulateDraft = async (req, res) => {
  try {
    const {
      sport = 'NBA',
      type = 'snake',
      teams = 10,
      rounds = 15,
      strategy = 'balanced',
      userPosition = 1,
      customStrategy
    } = req.body;

    // Get players
    const players = await Player.find({ 
      sport,
      isActive: true 
    })
    .sort({ fantasyScore: -1 })
    .limit(300)
    .lean();

    // Simulate draft
    const simulation = simulateFullDraft(
      players, 
      type, 
      teams, 
      rounds, 
      strategy, 
      userPosition,
      customStrategy
    );

    res.json({
      success: true,
      data: {
        simulation,
        recommendations: getDraftRecommendations(simulation, userPosition),
        analysis: analyzeSimulation(simulation)
      }
    });
  } catch (error) {
    console.error('Simulate draft error:', error);
    res.status(500).json({ success: false, message: 'Failed to simulate draft', error: error.message });
  }
};

// Helper functions
const generateDraftOrder = (teams) => {
  const order = Array.from({ length: teams }, (_, i) => i + 1);
  // Randomize order
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

const determineWinner = (teamRosters) => {
  // Simple winner determination based on total value
  let winner = null;
  let maxValue = -1;
  
  Object.entries(teamRosters).forEach(([userId, team]) => {
    if (team.totalValue > maxValue) {
      maxValue = team.totalValue;
      winner = {
        userId,
        username: team.user.username,
        totalValue: team.totalValue
      };
    }
  });
  
  return winner;
};

const generateMockDraft = (players, type, teams, rounds, seed) => {
  // Create a deterministic mock draft based on seed
  const mockPlayers = [...players];
  const draftOrder = Array.from({ length: teams }, (_, i) => i + 1);
  
  // Shuffle based on seed
  const seededShuffle = (array, seed) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((seed * 1000 + i) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledPlayers = seededShuffle(mockPlayers, seed);
  const picks = [];
  let currentPick = 1;

  for (let round = 1; round <= rounds; round++) {
    const isReverse = type === 'snake' && round % 2 === 0;
    const roundOrder = isReverse ? [...draftOrder].reverse() : [...draftOrder];
    
    roundOrder.forEach((team, index) => {
      const playerIndex = (currentPick - 1) % shuffledPlayers.length;
      const player = shuffledPlayers[playerIndex];
      
      picks.push({
        round,
        overallPick: currentPick,
        team,
        player: {
          id: player._id,
          name: player.name,
          position: player.position,
          team: player.team,
          fantasyScore: player.fantasyScore
        },
        value: (player.fantasyScore || 0) / 100
      });
      
      currentPick++;
    });
  }

  return {
    id: `mock-${seed}`,
    type,
    teams,
    rounds,
    picks,
    summary: {
      bestPick: picks.reduce((best, pick) => 
        pick.value > best.value ? pick : best, picks[0]
      ),
      worstPick: picks.reduce((worst, pick) => 
        pick.value < worst.value ? pick : worst, picks[0]
      ),
      averageValue: picks.reduce((sum, pick) => sum + pick.value, 0) / picks.length
    }
  };
};

const simulateFullDraft = (players, type, teams, rounds, strategy, userPosition, customStrategy) => {
  // Full draft simulation with strategy implementation
  const availablePlayers = [...players];
  const picks = [];
  const userPicks = [];
  
  // Define strategies
  const strategies = {
    balanced: {
      rounds1to3: ['PG', 'SG', 'SF'],
      rounds4to8: ['PF', 'C', 'Util'],
      rounds9to15: ['Bench', 'Value']
    },
    starsAndScrubs: {
      rounds1to4: ['Top Players'],
      rounds5to10: ['Mid Tier'],
      rounds11to15: ['Value Picks']
    },
    puntCategories: {
      focus: ['Points', 'Rebounds', 'Assists'],
      ignore: ['FT%', 'Turnovers']
    }
  };

  const selectedStrategy = customStrategy || strategies[strategy] || strategies.balanced;
  
  // Simulate each pick
  for (let round = 1; round <= rounds; round++) {
    const isReverse = type === 'snake' && round % 2 === 0;
    const roundOrder = isReverse ? 
      Array.from({ length: teams }, (_, i) => teams - i) : 
      Array.from({ length: teams }, (_, i) => i + 1);
    
    roundOrder.forEach(team => {
      // Determine best available player based on strategy and round
      const bestPlayer = selectPlayerByStrategy(
        availablePlayers, 
        round, 
        team === userPosition, 
        selectedStrategy
      );
      
      if (bestPlayer) {
        const pick = {
          round,
          team,
          player: bestPlayer,
          strategy: getPickStrategy(round, team === userPosition, selectedStrategy)
        };
        
        picks.push(pick);
        
        if (team === userPosition) {
          userPicks.push(pick);
        }
        
        // Remove player from available pool
        const index = availablePlayers.findIndex(p => p._id === bestPlayer._id);
        if (index > -1) {
          availablePlayers.splice(index, 1);
        }
      }
    });
  }

  return {
    type,
    teams,
    rounds,
    userPosition,
    strategy: selectedStrategy,
    userPicks,
    allPicks: picks,
    teamAnalysis: analyzeTeam(userPicks, selectedStrategy),
    draftGrade: gradeDraft(userPicks, userPosition)
  };
};

const selectPlayerByStrategy = (players, round, isUserPick, strategy) => {
  if (players.length === 0) return null;
  
  // Score each player based on strategy and round
  const scoredPlayers = players.map(player => {
    let score = player.fantasyScore || 50;
    
    // Adjust based on round
    if (round <= 3) {
      // Early rounds: prioritize stars
      score *= 1.2;
    } else if (round <= 8) {
      // Middle rounds: balance
      score *= 1.0;
    } else {
      // Late rounds: value and upside
      score *= 0.8;
      // Bonus for young players with upside
      if (player.age < 25) score *= 1.1;
    }
    
    // Strategy-specific adjustments
    if (strategy.focus && strategy.focus.includes('Points')) {
      if (player.ppg > 20) score *= 1.1;
    }
    
    return { ...player, strategyScore: score };
  });
  
  // Return highest scored player
  scoredPlayers.sort((a, b) => b.strategyScore - a.strategyScore);
  return scoredPlayers[0];
};

const getPickStrategy = (round, isUserPick, strategy) => {
  if (!isUserPick) return 'auto';
  
  if (round <= 3) return 'star';
  if (round <= 8) return 'core';
  return 'value';
};

const analyzeTeam = (picks, strategy) => {
  const positions = {};
  let totalValue = 0;
  let starCount = 0;
  
  picks.forEach(pick => {
    const position = pick.player.position;
    positions[position] = (positions[position] || 0) + 1;
    totalValue += pick.player.fantasyScore || 0;
    if (pick.round <= 3) starCount++;
  });
  
  return {
    positions,
    totalValue,
    averageValue: totalValue / picks.length,
    starCount,
    positionalBalance: Object.keys(positions).length,
    strategyFit: calculateStrategyFit(picks, strategy)
  };
};

const calculateStrategyFit = (picks, strategy) => {
  // Calculate how well the picks fit the strategy
  let fitScore = 0;
  const maxScore = picks.length * 10;
  
  picks.forEach((pick, index) => {
    const round = index + 1;
    let roundScore = 0;
    
    if (round <= 3) {
      // Early rounds should have high-value players
      if (pick.player.fantasyScore > 80) roundScore += 8;
    } else if (round <= 8) {
      // Middle rounds should fill needs
      roundScore += 6;
    } else {
      // Late rounds should have upside
      if (pick.player.age < 25) roundScore += 7;
    }
    
    fitScore += roundScore;
  });
  
  return {
    score: fitScore,
    percentage: Math.round((fitScore / maxScore) * 100),
    rating: fitScore > (maxScore * 0.7) ? 'Excellent' :
            fitScore > (maxScore * 0.5) ? 'Good' : 'Needs Improvement'
  };
};

const gradeDraft = (picks, position) => {
  const totalValue = picks.reduce((sum, pick) => sum + (pick.player.fantasyScore || 0), 0);
  const averageValue = totalValue / picks.length;
  const expectedValue = 65; // Baseline expected value
  
  const gradeScore = (averageValue / expectedValue) * 100;
  
  let grade, description;
  if (gradeScore >= 110) {
    grade = 'A+'; description = 'Exceptional draft';
  } else if (gradeScore >= 105) {
    grade = 'A'; description = 'Excellent draft';
  } else if (gradeScore >= 100) {
    grade = 'A-'; description = 'Very good draft';
  } else if (gradeScore >= 95) {
    grade = 'B+'; description = 'Good draft';
  } else if (gradeScore >= 90) {
    grade = 'B'; description = 'Above average';
  } else if (gradeScore >= 85) {
    grade = 'B-'; description = 'Average draft';
  } else if (gradeScore >= 80) {
    grade = 'C+'; description = 'Below average';
  } else if (gradeScore >= 75) {
    grade = 'C'; description = 'Poor draft';
  } else if (gradeScore >= 70) {
    grade = 'C-'; description = 'Very poor';
  } else {
    grade = 'D'; description = 'Failed draft';
  }
  
  return {
    grade,
    score: gradeScore.toFixed(1),
    description,
    strengths: picks.filter(p => p.player.fantasyScore > 80).length > 2 ? 'Strong star players' : 'Balanced roster',
    weaknesses: picks.filter(p => p.player.fantasyScore < 60).length > 3 ? 'Too many weak picks' : 'Good depth'
  };
};

const getDraftRecommendations = (simulation, userPosition) => {
  const recommendations = [];
  const userPicks = simulation.userPicks;
  
  // Analyze positions drafted
  const positionCounts = {};
  userPicks.forEach(pick => {
    const pos = pick.player.position;
    positionCounts[pos] = (positionCounts[pos] || 0) + 1;
  });
  
  // Check for positional needs
  const neededPositions = ['PG', 'SG', 'SF', 'PF', 'C'].filter(pos => !positionCounts[pos] || positionCounts[pos] < 2);
  
  if (neededPositions.length > 0) {
    recommendations.push({
      type: 'position',
      message: `Focus on adding ${neededPositions.join(', ')} in upcoming rounds`,
      priority: 'high'
    });
  }
  
  // Check for value picks
  const lateRoundPicks = userPicks.filter(p => p.round > 8);
  const hasValuePicks = lateRoundPicks.some(p => p.player.fantasyScore > 70);
  
  if (!hasValuePicks && userPicks.length < 10) {
    recommendations.push({
      type: 'value',
      message: 'Look for undervalued players in later rounds',
      priority: 'medium'
    });
  }
  
  return recommendations;
};

const analyzeSimulation = (simulation) => {
  const analysis = {
    strengths: [],
    weaknesses: [],
    optimalRounds: [],
    risks: []
  };
  
  // Identify strengths
  const earlyRounds = simulation.userPicks.filter(p => p.round <= 3);
  if (earlyRounds.length > 0 && earlyRounds.every(p => p.player.fantasyScore > 75)) {
    analysis.strengths.push('Strong foundation with elite early picks');
  }
  
  // Identify weaknesses
  const weakPicks = simulation.userPicks.filter(p => p.player.fantasyScore < 60);
  if (weakPicks.length > 2) {
    analysis.weaknesses.push(`Too many low-value picks (${weakPicks.length})`);
  }
  
  // Optimal rounds
  const valueRounds = simulation.userPicks
    .filter(p => p.player.fantasyScore > 70 && p.round > 5)
    .map(p => p.round);
  if (valueRounds.length > 0) {
    analysis.optimalRounds = valueRounds;
  }
  
  // Risks
  const injuryRisks = simulation.userPicks.filter(p => 
    p.player.injuryStatus && p.player.injuryStatus !== 'ACTIVE'
  );
  if (injuryRisks.length > 0) {
    analysis.risks.push(`${injuryRisks.length} players with injury concerns`);
  }
  
  return analysis;
};

const getMockDraftStrategies = (type, teams) => {
  const strategies = {
    snake: [
      'Early Picks (1-3): Secure elite talent, focus on scarcity positions',
      'Middle Picks (4-8): Balance value and positional needs',
      'Late Picks (9+): Target upside and fill roster needs'
    ],
    auction: [
      'Nominate players you don\'t want early to drain opponent budgets',
      'Set strict limits on each player and stick to them',
      'Save 10-15% of budget for late-round value picks'
    ],
    linear: [
      'Know your draft position well - same spot every round',
      'Reach slightly for players you really want',
      'Monitor runs on positions and adjust accordingly'
    ]
  };
  
  return strategies[type] || strategies.snake;
};

// Get snake draft settings
export const getSnakeDraft = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        name: 'Snake Draft',
        description: 'Snake draft implementation'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get turn draft settings
export const getTurnDraft = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        name: 'Turn Draft',
        description: 'Turn draft implementation'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate optimal draft
export const generateOptimalDraft = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        strategy: req.body.strategy || 'balanced',
        recommendations: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getDraftSettings,
  createDraft,
  joinDraft,
  getDraftStatus,
  makePick,
  undoPick,
  getAvailablePlayers,
  getDraftResults,
  getDraftHistory,
  getMockDrafts,
  simulateDraft,
  getSnakeDraft,
  getTurnDraft,
  generateOptimalDraft
};
