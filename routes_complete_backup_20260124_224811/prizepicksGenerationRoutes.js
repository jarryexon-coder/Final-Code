import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Player from '../models/Player.js';

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

// GET /api/prizepicks/generate/status
router.get('/generate/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check daily limits
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    const shouldReset = now.getUTCHours() >= 9 && 
                      (now.getUTCDate() !== lastReset.getUTCDate() || 
                       now.getUTCMonth() !== lastReset.getUTCMonth() ||
                       now.getUTCFullYear() !== lastReset.getUTCFullYear());
    
    let selectionsLeft = Math.max(0, user.dailySelections - user.selectionsUsed);
    
    if (shouldReset) {
      selectionsLeft = user.dailySelections;
    }
    
    res.json({
      success: true,
      status: {
        canGenerate: selectionsLeft > 0,
        selectionsLeft,
        lastGeneration: user.lastGeneration || null,
        cooldownRemaining: 0, // Add cooldown logic if needed
        maxDailySelections: user.dailySelections
      }
    });
    
  } catch (error) {
    console.error('Generation status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get generation status'
    });
  }
});

// POST /api/prizepicks/generate/daily
router.post('/generate/daily', authenticate, async (req, res) => {
  try {
    const { sport = 'NBA', type = 'parlay' } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check daily limits
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    const shouldReset = now.getUTCHours() >= 9 && 
                      (now.getUTCDate() !== lastReset.getUTCDate() || 
                       now.getUTCMonth() !== lastReset.getUTCMonth() ||
                       now.getUTCFullYear() !== lastReset.getUTCFullYear());
    
    if (shouldReset) {
      user.selectionsUsed = 0;
      user.lastReset = now;
    }
    
    if (user.selectionsUsed >= user.dailySelections) {
      return res.status(400).json({
        success: false,
        error: 'Daily limit reached'
      });
    }
    
    // Generate 2 selections (3 winners each)
    const selections = [];
    
    for (let i = 0; i < 2; i++) {
      // Get top NBA players for selections
      const players = await Player.find({ sport: 'NBA' })
        .sort({ fantasyPoints: -1 })
        .limit(20)
        .lean();
      
      // Randomly select 3 players for winners
      const winners = [];
      const usedIndices = new Set();
      
      for (let j = 0; j < 3; j++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * Math.min(10, players.length));
        } while (usedIndices.has(randomIndex));
        
        usedIndices.add(randomIndex);
        const player = players[randomIndex];
        
        // Generate a pick (Over/Under with random line)
        const statTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
        const statType = statTypes[Math.floor(Math.random() * statTypes.length)];
        const baseLine = {
          points: 25,
          rebounds: 8,
          assists: 6,
          steals: 1.5,
          blocks: 1.5
        }[statType];
        
        const line = baseLine + (Math.random() > 0.5 ? 0.5 : -0.5);
        const pick = Math.random() > 0.5 ? 'Over' : 'Under';
        
        winners.push({
          playerId: player._id,
          playerName: player.name,
          playerTeam: player.team,
          pick: `${pick} ${line} ${statType}`,
          market: statType,
          odds: `-${Math.floor(Math.random() * 50) + 110}`,
          confidence: Math.floor(Math.random() * 30) + 70
        });
      }
      
      // Calculate total odds
      const totalOdds = `+${Math.floor(Math.random() * 300) + 300}`;
      
      selections.push({
        id: `selection_${Date.now()}_${i}`,
        type: '3-Winner Parlay',
        sport,
        winners,
        totalOdds,
        confidence: Math.floor(Math.random() * 20) + 75,
        edgeScore: (Math.random() * 5 + 5).toFixed(1),
        bumpRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        analysis: `This parlay combines ${winners[0].playerName}'s scoring with ${winners[1].playerName}'s playmaking and ${winners[2].playerName}'s defense for a balanced combination.`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update user's selections used
    user.selectionsUsed += 2;
    user.lastGeneration = now;
    await user.save();
    
    res.json({
      success: true,
      selections,
      selectionsLeft: Math.max(0, user.dailySelections - user.selectionsUsed),
      generatedAt: now.toISOString(),
      message: 'Generated 2 daily selections (3 winners each)'
    });
    
  } catch (error) {
    console.error('Generate daily error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily selections'
    });
  }
});

// POST /api/prizepicks/generate/custom
router.post('/generate/custom', authenticate, async (req, res) => {
  try {
    const { sport, players, filters, strategy = 'balanced' } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check daily limits
    if (user.selectionsUsed >= user.dailySelections) {
      return res.status(400).json({
        success: false,
        error: 'Daily limit reached'
      });
    }
    
    // Generate custom selection
    const winners = [];
    
    if (players && players.length >= 3) {
      // Use provided players
      for (let i = 0; i < Math.min(3, players.length); i++) {
        const playerId = players[i];
        const player = await Player.findById(playerId).lean();
        
        if (player) {
          const statTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
          const statType = statTypes[Math.floor(Math.random() * statTypes.length)];
          const baseLine = {
            points: 25,
            rebounds: 8,
            assists: 6,
            steals: 1.5,
            blocks: 1.5
          }[statType];
          
          const line = baseLine + (Math.random() > 0.5 ? 0.5 : -0.5);
          const pick = Math.random() > 0.5 ? 'Over' : 'Under';
          
          winners.push({
            playerId: player._id,
            playerName: player.name,
            playerTeam: player.team,
            pick: `${pick} ${line} ${statType}`,
            market: statType,
            odds: `-${Math.floor(Math.random() * 50) + 110}`,
            confidence: Math.floor(Math.random() * 30) + 70
          });
        }
      }
    } else {
      // Generate random players based on filters
      const filter = { sport: sport || 'NBA' };
      
      if (filters) {
        if (filters.position) filter.position = filters.position;
        if (filters.team) filter.team = filters.team;
        if (filters.minFantasyPoints) filter.fantasyPoints = { $gte: filters.minFantasyPoints };
      }
      
      const availablePlayers = await Player.find(filter)
        .sort({ fantasyPoints: -1 })
        .limit(15)
        .lean();
      
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * Math.min(10, availablePlayers.length));
        const player = availablePlayers[randomIndex];
        
        const statTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
        const statType = statTypes[Math.floor(Math.random() * statTypes.length)];
        const baseLine = {
          points: 25,
          rebounds: 8,
          assists: 6,
          steals: 1.5,
          blocks: 1.5
        }[statType];
        
        const line = baseLine + (Math.random() > 0.5 ? 0.5 : -0.5);
        const pick = Math.random() > 0.5 ? 'Over' : 'Under';
        
        winners.push({
          playerId: player._id,
          playerName: player.name,
          playerTeam: player.team,
          pick: `${pick} ${line} ${statType}`,
          market: statType,
          odds: `-${Math.floor(Math.random() * 50) + 110}`,
          confidence: Math.floor(Math.random() * 30) + 70
        });
      }
    }
    
    const selection = {
      id: `custom_${Date.now()}`,
      type: 'Custom 3-Winner Parlay',
      sport: sport || 'NBA',
      winners,
      totalOdds: `+${Math.floor(Math.random() * 300) + 300}`,
      confidence: Math.floor(Math.random() * 20) + 75,
      edgeScore: (Math.random() * 5 + 5).toFixed(1),
      bumpRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      strategy: strategy,
      timestamp: new Date().toISOString()
    };
    
    // Update user's selections used
    user.selectionsUsed += 1;
    await user.save();
    
    res.json({
      success: true,
      selection,
      selectionsLeft: Math.max(0, user.dailySelections - user.selectionsUsed),
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Generate custom error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom selection'
    });
  }
});

// POST /api/prizepicks/generate/simulation
router.post('/generate/simulation', authenticate, async (req, res) => {
  try {
    const { selection, simulations = 1000 } = req.body;
    
    if (!selection || !selection.winners || selection.winners.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid selection. Need exactly 3 winners.'
      });
    }
    
    // Simulate outcomes
    let wins = 0;
    let pushes = 0;
    let losses = 0;
    const outcomes = [];
    
    for (let i = 0; i < simulations; i++) {
      let selectionResult = 'win';
      
      // Simulate each winner
      for (const winner of selection.winners) {
        const confidence = winner.confidence || 70;
        const random = Math.random() * 100;
        
        if (random <= confidence - 5) {
          // win
        } else if (random <= confidence + 5) {
          // push (close to line)
          selectionResult = 'push';
        } else {
          // loss
          selectionResult = 'loss';
          break;
        }
      }
      
      if (selectionResult === 'win') wins++;
      else if (selectionResult === 'push') pushes++;
      else losses++;
      
      // Record occasional outcomes
      if (i % 100 === 0) {
        outcomes.push({
          simulation: i,
          result: selectionResult,
          cumulativeWinRate: (wins / (i + 1)) * 100
        });
      }
    }
    
    const winRate = (wins / simulations) * 100;
    const pushRate = (pushes / simulations) * 100;
    const lossRate = (losses / simulations) * 100;
    
    // Calculate expected value
    const odds = selection.totalOdds || '+400';
    const oddsValue = parseInt(odds.replace('+', '')) / 100;
    const expectedValue = (winRate / 100) * oddsValue - (lossRate / 100);
    
    res.json({
      success: true,
      simulationResults: {
        totalSimulations: simulations,
        wins,
        pushes,
        losses,
        winRate: winRate.toFixed(2),
        pushRate: pushRate.toFixed(2),
        lossRate: lossRate.toFixed(2),
        expectedValue: expectedValue.toFixed(3),
        outcomes: outcomes.slice(-10), // Last 10 outcomes
        confidence: winRate > 60 ? 'High' : winRate > 40 ? 'Medium' : 'Low'
      },
      recommendation: winRate > 55 ? 'RECOMMENDED' : winRate > 45 ? 'MODERATE' : 'AVOID',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Simulation failed'
    });
  }
});

export default router;
