import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

// GET /api/sportsbooks/odds/:sport
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
    
    // In production, this would fetch from real sportsbook APIs
    // For now, return mock data
    const mockOdds = generateMockOdds(sport, market, gameId);
    
    res.json({
      success: true,
      sport: sport.toUpperCase(),
      market,
      lastUpdated: new Date().toISOString(),
      sportsbooks: Object.keys(MOCK_SPORTSBOOKS),
      odds: mockOdds,
      disclaimer: 'Mock data for demonstration. Real odds require API integration.'
    });
    
  } catch (error) {
    console.error('Sportsbook odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sportsbook odds'
    });
  }
});

// GET /api/sportsbooks/consensus/:market
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

// POST /api/sportsbooks/compare
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

// GET /api/sportsbooks/line-movement/:playerId
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

// GET /api/sportsbooks/arbitrage
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

// Helper functions

function generateMockOdds(sport, market, gameId) {
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
