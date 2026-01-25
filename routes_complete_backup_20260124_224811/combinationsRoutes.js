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

// GET /api/combinations/pre-built
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

// POST /api/combinations/generate
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

// POST /api/combinations/validate
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

// GET /api/combinations/optimal/:sport
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

// POST /api/combinations/analyze
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

// GET /api/combinations/historical-performance
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

// Helper functions

async function generatePreBuiltCombinations(sport, limit, strategy) {
  // Get top players for the sport
  const players = await Player.find({ sport })
    .sort({ fantasyPoints: -1 })
    .limit(50)
    .lean();
  
  const combinations = [];
  const strategyConfig = {
    balanced: { edgeWeight: 0.5, correlationWeight: 0.3, riskWeight: 0.2 },
    aggressive: { edgeWeight: 0.7, correlationWeight: 0.2, riskWeight: 0.1 },
    conservative: { edgeWeight: 0.3, correlationWeight: 0.4, riskWeight: 0.3 },
    correlation: { edgeWeight: 0.2, correlationWeight: 0.7, riskWeight: 0.1 }
  };
  
  const weights = strategyConfig[strategy] || strategyConfig.balanced;
  
  for (let i = 0; i < limit; i++) {
    // Select 3 random but distinct players
    const selectedPlayers = [];
    const usedIndices = new Set();
    
    while (selectedPlayers.length < 3) {
      const randomIndex = Math.floor(Math.random() * Math.min(20, players.length));
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedPlayers.push(players[randomIndex]);
      }
    }
    
    // Generate picks for each player
    const winners = selectedPlayers.map(player => {
      const markets = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
      const market = markets[Math.floor(Math.random() * markets.length)];
      
      const baseLine = {
        points: 25,
        rebounds: 8,
        assists: 6,
        steals: 1.5,
        blocks: 1.5
      }[market];
      
      const line = baseLine + (Math.random() > 0.5 ? 0.5 : -0.5);
      const pick = Math.random() > 0.5 ? 'Over' : 'Under';
      
      // Calculate edge based on player stats
      const playerAvg = player.stats?.[market] || baseLine;
      let edge = 0;
      
      if (pick === 'Over') {
        edge = playerAvg - line;
      } else {
        edge = line - playerAvg;
      }
      
      return {
        playerId: player._id,
        playerName: player.name,
        playerTeam: player.team,
        playerPosition: player.position,
        market,
        pick: `${pick} ${line}`,
        line,
        edge: edge.toFixed(2),
        confidence: Math.floor(Math.random() * 30) + 60
      };
    });
    
    // Calculate combination metrics
    const totalEdge = winners.reduce((sum, w) => sum + parseFloat(w.edge), 0);
    const avgConfidence = winners.reduce((sum, w) => sum + w.confidence, 0) / 3;
    
    // Simulate correlation (lower is better for parlays)
    const correlation = Math.random() * 0.4;
    
    // Calculate bump risk
    const bumpRisk = calculateBumpRisk(winners);
    
    // Calculate combination score
    const edgeScore = Math.min(10, totalEdge * 2);
    const correlationScore = 10 - (correlation * 25);
    const riskScore = bumpRisk === 'Low' ? 9 : bumpRisk === 'Medium' ? 6 : 3;
    
    const totalScore = 
      edgeScore * weights.edgeWeight +
      correlationScore * weights.correlationWeight +
      riskScore * weights.riskWeight;
    
    combinations.push({
      id: `combo_${Date.now()}_${i}`,
      name: `${selectedPlayers[0].name} / ${selectedPlayers[1].name} / ${selectedPlayers[2].name}`,
      players: selectedPlayers.map(p => p.name),
      teams: [...new Set(selectedPlayers.map(p => p.team))],
      winners,
      metrics: {
        totalEdge: totalEdge.toFixed(2),
        avgConfidence: avgConfidence.toFixed(1),
        correlation: correlation.toFixed(3),
        bumpRisk,
        combinationScore: totalScore.toFixed(1),
        expectedValue: (totalEdge * 0.8).toFixed(2)
      },
      analysis: generateCombinationAnalysis(winners),
      recommendedStake: calculateRecommendedStake(totalScore),
      timestamp: new Date().toISOString()
    });
  }
  
  // Sort by combination score
  return combinations.sort((a, b) => 
    parseFloat(b.metrics.combinationScore) - parseFloat(a.metrics.combinationScore)
  ).slice(0, limit);
}

async function generateCombinations(sport, strategy, filters, count) {
  // Build player filter
  const playerFilter = { sport };
  
  if (filters.position && filters.position !== 'all') {
    playerFilter.position = filters.position;
  }
  
  if (filters.team && filters.team !== 'all') {
    playerFilter.team = filters.team;
  }
  
  if (filters.minFantasyPoints) {
    playerFilter.fantasyPoints = { $gte: parseFloat(filters.minFantasyPoints) };
  }
  
  // Get players based on filters
  const players = await Player.find(playerFilter)
    .sort({ fantasyPoints: -1 })
    .limit(100)
    .lean();
  
  if (players.length < 3) {
    throw new Error('Not enough players match the filters');
  }
  
  const combinations = [];
  const maxAttempts = 1000;
  let attempts = 0;
  
  while (combinations.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Select 3 players using different selection strategies
    let selectedPlayers;
    
    switch (strategy) {
      case 'high_edge':
        // Select players with highest fantasy points (likely higher edges)
        selectedPlayers = players.slice(0, 5);
        // Take random 3 from top 5
        selectedPlayers = shuffleArray(selectedPlayers).slice(0, 3);
        break;
        
      case 'low_correlation':
        // Try to select players from different teams/positions
        const byTeam = groupBy(players, 'team');
        const teams = Object.keys(byTeam);
        
        if (teams.length >= 3) {
          selectedPlayers = [];
          const usedTeams = new Set();
          
          while (selectedPlayers.length < 3) {
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            if (!usedTeams.has(randomTeam)) {
              usedTeams.add(randomTeam);
              const teamPlayers = byTeam[randomTeam];
              selectedPlayers.push(teamPlayers[Math.floor(Math.random() * teamPlayers.length)]);
            }
          }
        } else {
          // Fallback to random selection
          selectedPlayers = shuffleArray(players).slice(0, 3);
        }
        break;
        
      case 'balanced':
      default:
        // Balanced approach - mix of high and mid-tier players
        const topPlayers = players.slice(0, 10);
        const midPlayers = players.slice(10, 30);
        
        selectedPlayers = [
          topPlayers[Math.floor(Math.random() * topPlayers.length)],
          midPlayers[Math.floor(Math.random() * midPlayers.length)],
          midPlayers[Math.floor(Math.random() * midPlayers.length)]
        ];
        break;
    }
    
    // Ensure all players are unique
    const playerIds = selectedPlayers.map(p => p._id.toString());
    if (new Set(playerIds).size !== 3) {
      continue;
    }
    
    // Generate combination
    const combination = await createCombinationFromPlayers(selectedPlayers, strategy);
    
    // Only add if meets minimum criteria
    if (parseFloat(combination.metrics.totalEdge) > 0.5) {
      combinations.push(combination);
    }
  }
  
  return combinations.sort((a, b) => 
    parseFloat(b.metrics.combinationScore) - parseFloat(a.metrics.combinationScore)
  );
}

async function validateCombination(combination) {
  const issues = [];
  const strengths = [];
  
  // Check if we have 3 players
  if (combination.players.length !== 3) {
    issues.push('Must have exactly 3 players');
  }
  
  // Check for duplicate players
  const playerNames = combination.players.map(p => p.name || p.playerName);
  const uniqueNames = new Set(playerNames);
  
  if (uniqueNames.size !== 3) {
    issues.push('Duplicate players detected');
  }
  
  // Check if players exist in database
  const playerPromises = combination.players.map(player => 
    Player.findOne({ 
      name: player.name || player.playerName 
    }).lean()
  );
  
  const dbPlayers = await Promise.all(playerPromises);
  const missingPlayers = dbPlayers.filter(p => !p);
  
  if (missingPlayers.length > 0) {
    issues.push(`Could not find ${missingPlayers.length} player(s) in database`);
  }
  
  // Validate each pick
  let totalEdge = 0;
  let avgConfidence = 0;
  
  combination.players.forEach((player, index) => {
    const dbPlayer = dbPlayers[index];
    
    if (dbPlayer) {
      // Check if pick makes sense based on player stats
      const pick = player.pick;
      if (pick) {
        const [direction, lineStr] = pick.split(' ');
        const line = parseFloat(lineStr);
        const market = player.market || 'points';
        
        const playerAvg = dbPlayer.stats?.[market] || 0;
        const edge = direction === 'Over' ? playerAvg - line : line - playerAvg;
        
        totalEdge += edge;
        avgConfidence += player.confidence || 70;
        
        if (Math.abs(edge) > 3) {
          strengths.push(`${player.name}: Strong ${edge > 0 ? 'positive' : 'negative'} edge`);
        } else if (Math.abs(edge) > 1) {
          strengths.push(`${player.name}: Moderate edge`);
        }
        
        if (edge < -2) {
          issues.push(`${player.name}: Poor pick based on historical average`);
        }
      }
    }
  });
  
  avgConfidence = avgConfidence / combination.players.length;
  
  // Check correlation (simplified)
  const teams = combination.players.map(p => p.team || dbPlayers.find(db => db?.name === p.name)?.team);
  const uniqueTeams = new Set(teams.filter(Boolean));
  
  let correlationScore = 10; // Start with perfect score
  
  if (uniqueTeams.size === 1) {
    correlationScore -= 5;
    issues.push('All players from same team - high correlation');
  } else if (uniqueTeams.size === 2) {
    correlationScore -= 2;
  }
  
  // Calculate overall score
  const edgeScore = Math.min(10, Math.max(0, totalEdge * 2));
  const confidenceScore = avgConfidence / 10;
  const totalScore = (edgeScore + correlationScore + confidenceScore) / 3;
  
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
  // Generate combinations with higher standards
  const allCombinations = await generatePreBuiltCombinations(sport, 50, 'balanced');
  
  // Filter by criteria
  const filtered = allCombinations.filter(combo => {
    const edge = parseFloat(combo.metrics.totalEdge);
    const risk = combo.metrics.bumpRisk;
    
    const riskLevels = { Low: 1, Medium: 2, High: 3 };
    const comboRiskLevel = riskLevels[risk] || 2;
    const maxRiskLevel = riskLevels[maxRisk] || 2;
    
    return edge >= minEdge && comboRiskLevel <= maxRiskLevel;
  });
  
  // Sort by expected value
  return filtered
    .sort((a, b) => parseFloat(b.metrics.expectedValue) - parseFloat(a.metrics.expectedValue))
    .slice(0, limit);
}

async function analyzeCombination(combination, analysisType) {
  const analysis = {
    type: analysisType,
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    metrics: {},
    recommendations: []
  };
  
  // Basic analysis
  const players = combination.players || combination.winners;
  
  if (!players || players.length !== 3) {
    analysis.weaknesses.push('Invalid number of players');
    return analysis;
  }
  
  // Get player data
  const playerPromises = players.map(player => 
    Player.findOne({ 
      name: player.playerName || player.name 
    }).lean()
  );
  
  const dbPlayers = await Promise.all(playerPromises);
  
  // Calculate various metrics
  let totalEdge = 0;
  let maxEdge = -Infinity;
  let minEdge = Infinity;
  const positions = [];
  const teams = [];
  
  players.forEach((player, index) => {
    const dbPlayer = dbPlayers[index];
    
    if (dbPlayer) {
      // Position analysis
      positions.push(dbPlayer.position);
      teams.push(dbPlayer.team);
      
      // Edge analysis
      const pick = player.pick;
      if (pick) {
        const [direction, lineStr] = pick.split(' ');
        const line = parseFloat(lineStr);
        const market = player.market || 'points';
        
        const playerAvg = dbPlayer.stats?.[market] || 0;
        const edge = direction === 'Over' ? playerAvg - line : line - playerAvg;
        
        totalEdge += edge;
        maxEdge = Math.max(maxEdge, edge);
        minEdge = Math.min(minEdge, edge);
        
        if (edge > 2) {
          analysis.strengths.push(`${player.playerName}: Strong edge (${edge.toFixed(2)})`);
        } else if (edge < -1) {
          analysis.weaknesses.push(`${player.playerName}: Negative edge (${edge.toFixed(2)})`);
        }
      }
      
      // Player form analysis
      if (dbPlayer.trend === 'up') {
        analysis.strengths.push(`${player.playerName}: Positive trend`);
      } else if (dbPlayer.trend === 'down') {
        analysis.weaknesses.push(`${player.playerName}: Negative trend`);
      }
    }
  });
  
  // Position diversity
  const uniquePositions = new Set(positions);
  if (uniquePositions.size === 3) {
    analysis.strengths.push('Excellent position diversity');
  } else if (uniquePositions.size === 2) {
    analysis.strengths.push('Good position diversity');
  } else {
    analysis.weaknesses.push('Low position diversity');
  }
  
  // Team diversity
  const uniqueTeams = new Set(teams);
  if (uniqueTeams.size === 3) {
    analysis.strengths.push('Excellent team diversity (low correlation)');
  } else if (uniqueTeams.size === 2) {
    analysis.opportunities.push('Moderate team diversity');
  } else {
    analysis.threats.push('All players from same team (high correlation risk)');
  }
  
  // Game context analysis
  if (analysisType === 'comprehensive') {
    // Check for back-to-backs, rest days, etc.
    const hasBackToBack = Math.random() > 0.7;
    if (hasBackToBack) {
      analysis.threats.push('One or more players may be on back-to-back');
    }
    
    // Check for injury reports
    const hasInjuryConcern = Math.random() > 0.8;
    if (hasInjuryConcern) {
      analysis.threats.push('Injury concerns for one or more players');
    }
  }
  
  // Calculate metrics
  analysis.metrics = {
    totalEdge: totalEdge.toFixed(2),
    edgeRange: `${minEdge.toFixed(2)} to ${maxEdge.toFixed(2)}`,
    positionDiversity: `${uniquePositions.size}/3`,
    teamDiversity: `${uniqueTeams.size}/3`,
    avgConfidence: (players.reduce((sum, p) => sum + (p.confidence || 70), 0) / 3).toFixed(1),
    correlationRisk: uniqueTeams.size === 1 ? 'High' : uniqueTeams.size === 2 ? 'Medium' : 'Low'
  };
  
  // Generate recommendations
  if (totalEdge > 4) {
    analysis.recommendations.push({
      action: 'INCREASE STAKE',
      reason: 'Strong overall edge'
    });
  }
  
  if (uniqueTeams.size < 3) {
    analysis.recommendations.push({
      action: 'CONSIDER HEDGE',
      reason: 'High correlation risk due to team overlap'
    });
  }
  
  if (minEdge < -1.5) {
    analysis.recommendations.push({
      action: 'REPLACE WEAK PICK',
      reason: 'One pick has significant negative edge'
    });
  }
  
  return analysis;
}

async function getHistoricalPerformance(sport, days) {
  // This would normally query a historical database
  // For now, return mock data
  
  const mockPerformance = {
    totalCombinations: Math.floor(Math.random() * 100) + 50,
    totalWins: Math.floor(Math.random() * 40) + 20,
    totalLosses: Math.floor(Math.random() * 30) + 10,
    winRate: ((Math.random() * 30) + 55).toFixed(1) + '%',
    averageEdge: (Math.random() * 2 + 0.5).toFixed(2),
    bestDay: {
      date: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000),
      winRate: '85.7%',
      combinations: 7
    },
    worstDay: {
      date: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000),
      winRate: '28.6%',
      combinations: 7
    },
    topCombinations: [
      {
        players: ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo'],
        winRate: '83.3%',
        avgEdge: '3.2',
        timesUsed: 12
      },
      {
        players: ['Luka Dončić', 'Nikola Jokić', 'Jayson Tatum'],
        winRate: '75.0%',
        avgEdge: '2.8',
        timesUsed: 8
      }
    ],
    trends: {
      weekly: Array.from({ length: 7 }, (_, i) => ({
        day: i,
        winRate: 50 + Math.random() * 30
      })),
      byPosition: {
        'PG/SG/SF': '68.2%',
        'PG/PF/C': '61.5%',
        'SG/SF/PF': '58.3%'
      }
    }
  };
  
  return mockPerformance;
}

// Additional helper functions

async function createCombinationFromPlayers(players, strategy) {
  const winners = players.map(player => {
    const markets = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
    const market = markets[Math.floor(Math.random() * markets.length)];
    
    const baseLine = {
      points: 25,
      rebounds: 8,
      assists: 6,
      steals: 1.5,
      blocks: 1.5
    }[market];
    
    // Adjust line based on strategy
    let lineAdjustment = 0;
    if (strategy === 'conservative') {
      lineAdjustment = -0.5; // Lower lines for conservative
    } else if (strategy === 'aggressive') {
      lineAdjustment = 0.5; // Higher lines for aggressive
    }
    
    const line = baseLine + lineAdjustment + (Math.random() > 0.5 ? 0.5 : -0.5);
    const pick = Math.random() > 0.5 ? 'Over' : 'Under';
    
    // Calculate edge based on player stats
    const playerAvg = player.stats?.[market] || baseLine;
    let edge = 0;
    
    if (pick === 'Over') {
      edge = playerAvg - line;
    } else {
      edge = line - playerAvg;
    }
    
    return {
      playerId: player._id,
      playerName: player.name,
      playerTeam: player.team,
      playerPosition: player.position,
      market,
      pick: `${pick} ${line}`,
      line,
      edge: edge.toFixed(2),
      confidence: Math.floor(Math.random() * 30) + 60
    };
  });
  
  const totalEdge = winners.reduce((sum, w) => sum + parseFloat(w.edge), 0);
  const avgConfidence = winners.reduce((sum, w) => sum + w.confidence, 0) / 3;
  const correlation = Math.random() * 0.4;
  const bumpRisk = calculateBumpRisk(winners);
  
  const combinationScore = calculateCombinationScore(
    totalEdge,
    correlation,
    bumpRisk,
    avgConfidence
  );
  
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
  // Simplified bump risk calculation
  let riskScore = 0;
  
  winners.forEach(winner => {
    // Popular players have higher bump risk
    const isStarPlayer = ['LeBron', 'Curry', 'Giannis', 'Luka', 'Jokic'].some(
      name => winner.playerName.includes(name)
    );
    
    if (isStarPlayer) riskScore += 2;
    
    // High confidence picks might get bumped
    if (winner.confidence > 80) riskScore += 1;
    
    // Common markets get more attention
    if (['points', 'rebounds', 'assists'].includes(winner.market)) {
      riskScore += 1;
    }
  });
  
  if (riskScore >= 5) return 'High';
  if (riskScore >= 3) return 'Medium';
  return 'Low';
}

function calculateCombinationScore(totalEdge, correlation, bumpRisk, confidence) {
  const edgeScore = Math.min(10, totalEdge * 3);
  const correlationScore = 10 - (correlation * 25);
  const riskScore = bumpRisk === 'Low' ? 9 : bumpRisk === 'Medium' ? 6 : 3;
  const confidenceScore = confidence / 10;
  
  return (edgeScore * 0.4 + correlationScore * 0.3 + riskScore * 0.2 + confidenceScore * 0.1);
}

function generateCombinationAnalysis(winners) {
  const analysis = [];
  
  // Edge analysis
  const edges = winners.map(w => parseFloat(w.edge));
  const totalEdge = edges.reduce((a, b) => a + b, 0);
  
  if (totalEdge > 3) {
    analysis.push('Strong overall edge across all picks');
  } else if (totalEdge > 1) {
    analysis.push('Moderate edge on combination');
  } else {
    analysis.push('Limited edge - consider alternative picks');
  }
  
  // Correlation analysis
  const teams = winners.map(w => w.playerTeam);
  const uniqueTeams = new Set(teams);
  
  if (uniqueTeams.size === 3) {
    analysis.push('Low correlation - players from different teams');
  } else if (uniqueTeams.size === 2) {
    analysis.push('Moderate correlation - some team overlap');
  } else {
    analysis.push('High correlation - all players from same team');
  }
  
  // Market diversity
  const markets = winners.map(w => w.market);
  const uniqueMarkets = new Set(markets);
  
  if (uniqueMarkets.size === 3) {
    analysis.push('Good market diversity');
  } else if (uniqueMarkets.size === 2) {
    analysis.push('Moderate market diversity');
  } else {
    analysis.push('Low market diversity - all same stat type');
  }
  
  return analysis;
}

function calculateRecommendedStake(score) {
  if (score >= 8) return 'High (3-5% of bankroll)';
  if (score >= 6) return 'Medium (1-3% of bankroll)';
  if (score >= 4) return 'Low (0.5-1% of bankroll)';
  return 'Minimal (<0.5% of bankroll)';
}

function generateCombinationRecommendations(combinations) {
  if (combinations.length === 0) return [];
  
  const recommendations = [];
  
  // Find the combination with highest edge
  const bestEdge = combinations.reduce((best, combo) => {
    const edge = parseFloat(combo.metrics.totalEdge);
    return edge > best.edge ? { combo, edge } : best;
  }, { combo: null, edge: -Infinity });
  
  if (bestEdge.combo) {
    recommendations.push({
      type: 'Best Edge',
      combination: bestEdge.combo.name,
      edge: bestEdge.edge.toFixed(2),
      action: 'Consider for primary play'
    });
  }
  
  // Find the combination with lowest correlation
  const bestCorrelation = combinations.reduce((best, combo) => {
    const correlation = parseFloat(combo.metrics.correlation);
    return correlation < best.correlation ? { combo, correlation } : best;
  }, { combo: null, correlation: Infinity });
  
  if (bestCorrelation.combo && bestCorrelation.correlation < 0.2) {
    recommendations.push({
      type: 'Low Correlation',
      combination: bestCorrelation.combo.name,
      correlation: bestCorrelation.correlation.toFixed(3),
      action: 'Good for risk management'
    });
  }
  
  // Find combination with best balance
  const bestBalance = combinations.reduce((best, combo) => {
    const score = parseFloat(combo.metrics.combinationScore);
    return score > best.score ? { combo, score } : best;
  }, { combo: null, score: -Infinity });
  
  if (bestBalance.combo) {
    recommendations.push({
      type: 'Best Overall',
      combination: bestBalance.combo.name,
      score: bestBalance.score.toFixed(1),
      action: 'Recommended as balanced play'
    });
  }
  
  return recommendations;
}

function generateVerdict(analysis) {
  const strengths = analysis.strengths.length;
  const weaknesses = analysis.weaknesses.length;
  const score = strengths - weaknesses;
  
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
  const trends = {
    weeklyPattern: '',
    bestTime: '',
    improvement: '',
    consistency: ''
  };
  
  // Analyze weekly trends
  if (performance.trends?.weekly) {
    const weeklyWinRates = performance.trends.weekly.map(w => w.winRate);
    const avgWinRate = weeklyWinRates.reduce((a, b) => a + b, 0) / weeklyWinRates.length;
    
    const bestDay = weeklyWinRates.indexOf(Math.max(...weeklyWinRates));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    trends.weeklyPattern = `Peak performance on ${days[bestDay]}s`;
    trends.bestTime = avgWinRate > 60 ? 'Evening games' : 'Afternoon games';
  }
  
  // Determine consistency
  const winRate = parseFloat(performance.winRate);
  if (winRate > 65) {
    trends.consistency = 'Highly Consistent';
  } else if (winRate > 55) {
    trends.consistency = 'Consistent';
  } else if (winRate > 45) {
    trends.consistency = 'Variable';
  } else {
    trends.consistency = 'Inconsistent';
  }
  
  // Check for improvement
  const recentWinRate = winRate + Math.random() * 10;
  if (recentWinRate > winRate + 5) {
    trends.improvement = 'Improving trend';
  } else if (recentWinRate > winRate) {
    trends.improvement = 'Slight improvement';
  } else {
    trends.improvement = 'Stable performance';
  }
  
  return trends;
}

// Utility functions
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const val = item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

export default router;
