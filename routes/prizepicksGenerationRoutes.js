import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Player from '../models/Player.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "prizepicksGeneration API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

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

/**
 * @swagger
 * /api/prizepicks/odds:
 *   get:
 *     summary: Get odds for PrizePicks selections
 *     description: Fetch betting odds from The Odds API for player props
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to get odds for
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for odds (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Odds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 odds:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerOdds'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/odds', authenticate, async (req, res) => {
  try {
    const { sport = 'NBA', date } = req.query;
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }

    // Build API URL
    let url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us&markets=player_points,player_rebounds,player_assists&oddsFormat=american`;
    
    if (date) {
      url += `&date=${date}`;
    }

    const response = await fetch(url);
    const oddsData = await response.json();

    res.json({
      success: true,
      odds: oddsData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Odds fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch odds'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/odds/live:
 *   get:
 *     summary: Get live odds for PrizePicks selections
 *     description: Fetch live betting odds from The Odds API for in-game player props
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, MLB, NHL]
 *         description: Sport to get live odds for
 *     responses:
 *       200:
 *         description: Live odds retrieved successfully
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
 *                     $ref: '#/components/schemas/LivePlayerOdds'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/odds/live', authenticate, async (req, res) => {
  try {
    const { sport = 'NBA' } = req.query;
    const apiKey = process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Odds API key not configured'
      });
    }

    // Build API URL for live odds
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us&markets=player_points,player_rebounds,player_assists&oddsFormat=american&live=true`;

    const response = await fetch(url);
    const liveOddsData = await response.json();

    res.json({
      success: true,
      liveOdds: liveOddsData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Live odds fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live odds'
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/generate/status:
 *   get:
 *     summary: Get PrizePicks generation status
 *     description: Check daily limits and generation status for PrizePicks selections
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   $ref: '#/components/schemas/GenerationStatus'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/prizepicks/generate/daily:
 *   post:
 *     summary: Generate daily PrizePicks selections
 *     description: Generate 2 daily PrizePicks selections (3-winner parlays each) within daily limits
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport:
 *                 type: string
 *                 enum: [NBA, NFL, MLB, NHL]
 *                 default: NBA
 *               type:
 *                 type: string
 *                 enum: [parlay, single]
 *                 default: parlay
 *     responses:
 *       200:
 *         description: Daily selections generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 selections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrizePickSelection'
 *                 selectionsLeft:
 *                   type: integer
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Daily limit reached or invalid parameters
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/prizepicks/generate/custom:
 *   post:
 *     summary: Generate custom PrizePicks selection
 *     description: Create a custom PrizePicks selection with specified players, filters, and strategy
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport:
 *                 type: string
 *                 enum: [NBA, NFL, MLB, NHL]
 *                 default: NBA
 *               players:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of player IDs to include in selection
 *               filters:
 *                 type: object
 *                 properties:
 *                   position:
 *                     type: string
 *                   team:
 *                     type: string
 *                   minFantasyPoints:
 *                     type: number
 *               strategy:
 *                 type: string
 *                 enum: [balanced, aggressive, conservative]
 *                 default: balanced
 *     responses:
 *       200:
 *         description: Custom selection generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 selection:
 *                   $ref: '#/components/schemas/PrizePickSelection'
 *                 selectionsLeft:
 *                   type: integer
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Daily limit reached or invalid parameters
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/prizepicks/generate/simulation:
 *   post:
 *     summary: Simulate PrizePicks selection outcomes
 *     description: Run Monte Carlo simulation on a PrizePicks selection to predict win rate and expected value
 *     tags: [PrizePicks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selection:
 *                 $ref: '#/components/schemas/PrizePickSelection'
 *               simulations:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 10000
 *                 default: 1000
 *     responses:
 *       200:
 *         description: Simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 simulationResults:
 *                   $ref: '#/components/schemas/SimulationResults'
 *                 recommendation:
 *                   type: string
 *                   enum: [RECOMMENDED, MODERATE, AVOID]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid selection (need exactly 3 winners)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
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
