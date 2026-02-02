// routes/simulationsRoutes.js - Simulation endpoints with JSDoc documentation
import express from 'express';
import jwt from 'jsonwebtoken';
import Player from '../models/Player.js';
import Selection from '../models/Selection.js';
import User from '../models/User.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "simulations API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * tags:
 *   - name: Simulations
 *     description: Advanced betting simulation and Monte Carlo analysis
 */

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
 * /api/simulate/selection:
 *   post:
 *     summary: Simulate a 3-player selection outcome
 *     description: Run Monte Carlo simulation for a 3-winner selection with configurable scenarios
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selection
 *               - winners
 *             properties:
 *               selection:
 *                 type: object
 *                 required:
 *                   - winners
 *                 properties:
 *                   winners:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         playerId:
 *                           type: string
 *                         market:
 *                           type: string
 *                         pick:
 *                           type: string
 *                         confidence:
 *                           type: number
 *                   totalOdds:
 *                     type: string
 *                   stake:
 *                     type: number
 *               simulations:
 *                 type: integer
 *                 default: 1000
 *                 minimum: 100
 *                 maximum: 10000
 *               scenario:
 *                 type: string
 *                 enum: [normal, conservative, aggressive, historical]
 *                 default: normal
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
 *                 simulation:
 *                   type: object
 *                   properties:
 *                     totalSimulations:
 *                       type: integer
 *                     wins:
 *                       type: integer
 *                     losses:
 *                       type: integer
 *                     pushes:
 *                       type: integer
 *                     winRate:
 *                       type: string
 *                     expectedValue:
 *                       type: string
 *                     averageWinAmount:
 *                       type: string
 *                     standardDeviation:
 *                       type: string
 *                     totalPayout:
 *                       type: string
 *                     kellyCriterion:
 *                       type: string
 *                     confidence:
 *                       type: string
 *                     scenario:
 *                       type: string
 *                     parameters:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/selection', authenticate, async (req, res) => {
  try {
    const { selection, simulations = 1000, scenario } = req.body;
    
    if (!selection || !selection.winners || selection.winners.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid selection. Need exactly 3 winners.'
      });
    }
    
    // Simulation parameters based on scenario
    const scenarioParams = {
      normal: { variance: 1.0, correlation: 0.15 },
      conservative: { variance: 0.8, correlation: 0.10 },
      aggressive: { variance: 1.2, correlation: 0.20 },
      historical: { variance: 1.1, correlation: 0.18 }
    };
    
    const params = scenarioParams[scenario] || scenarioParams.normal;
    
    // Run simulation
    const simulationResults = await runSelectionSimulation(
      selection, 
      simulations, 
      params
    );
    
    res.json({
      success: true,
      simulation: {
        ...simulationResults,
        scenario: scenario || 'normal',
        parameters: params,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Selection simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Simulation failed'
    });
  }
});

/**
 * @swagger
 * /api/simulate/parlay:
 *   post:
 *     summary: Simulate a series of parlay bets
 *     description: Run multiple simulations of parlay betting strategies over time
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selections
 *             properties:
 *               selections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     confidence:
 *                       type: number
 *                     totalOdds:
 *                       type: string
 *                     description:
 *                       type: string
 *               bankroll:
 *                 type: number
 *                 default: 1000
 *                 minimum: 100
 *               strategy:
 *                 type: string
 *                 enum: [flat, kelly, aggressive, conservative]
 *                 default: flat
 *               simulations:
 *                 type: integer
 *                 default: 10000
 *                 minimum: 1000
 *                 maximum: 50000
 *     responses:
 *       200:
 *         description: Parlay simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 simulation:
 *                   type: object
 *                   properties:
 *                     simulations:
 *                       type: integer
 *                     totalWins:
 *                       type: integer
 *                     totalLosses:
 *                       type: integer
 *                     winRate:
 *                       type: string
 *                     totalProfit:
 *                       type: string
 *                     medianProfit:
 *                       type: string
 *                     peakBankroll:
 *                       type: string
 *                     troughBankroll:
 *                       type: string
 *                     maxDrawdown:
 *                       type: string
 *                     maxWinningStreak:
 *                       type: integer
 *                     maxLosingStreak:
 *                       type: integer
 *                     valueAtRisk:
 *                       type: string
 *                     expectedShortfall:
 *                       type: string
 *                     kellyOptimal:
 *                       type: object
 *                     bankrollStart:
 *                       type: number
 *                     bankrollEnd:
 *                       type: number
 *                     roi:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/parlay', authenticate, async (req, res) => {
  try {
    const { selections, bankroll = 1000, strategy = 'flat', simulations = 10000 } = req.body;
    
    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of selections'
      });
    }
    
    // Simulate multiple parlays over time
    const parlayResults = await simulateParlaySeries(
      selections,
      bankroll,
      strategy,
      simulations
    );
    
    res.json({
      success: true,
      simulation: {
        ...parlayResults,
        bankrollStart: bankroll,
        bankrollEnd: bankroll + parlayResults.totalProfit,
        roi: ((parlayResults.totalProfit / bankroll) * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Parlay simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Parlay simulation failed'
    });
  }
});

/**
 * @swagger
 * /api/simulate/history:
 *   get:
 *     summary: Get simulation history
 *     description: Retrieve past simulation results with pagination
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [selection, parlay, monte-carlo, scenario]
 *         description: Filter by simulation type
 *     responses:
 *       200:
 *         description: Simulation history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 simulations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       sport:
 *                         type: string
 *                       simulations:
 *                         type: integer
 *                       winRate:
 *                         type: string
 *                       expectedValue:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       result:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSimulations:
 *                       type: integer
 *                     averageWinRate:
 *                       type: string
 *                     bestSimulation:
 *                       type: string
 *                     mostSimulatedSport:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { userId: req.userId };
    if (type) filter.type = type;
    
    // In a real app, you'd have a Simulation model
    // For now, we'll return mock data
    const simulations = generateMockSimulations(parseInt(limit));
    const total = 50; // Mock total
    
    res.json({
      success: true,
      simulations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        totalSimulations: total,
        averageWinRate: '62.5%',
        bestSimulation: '+285% ROI',
        mostSimulatedSport: 'NBA'
      }
    });
    
  } catch (error) {
    console.error('Simulation history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation history'
    });
  }
});

/**
 * @swagger
 * /api/simulate/monte-carlo:
 *   post:
 *     summary: Run advanced Monte Carlo simulation
 *     description: Perform comprehensive Monte Carlo analysis for risk assessment and probability modeling
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selections
 *             properties:
 *               selections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     confidence:
 *                       type: number
 *                     description:
 *                       type: string
 *               bankroll:
 *                 type: number
 *                 default: 1000
 *                 minimum: 100
 *               simulations:
 *                 type: integer
 *                 default: 10000
 *                 minimum: 1000
 *                 maximum: 100000
 *               periods:
 *                 type: integer
 *                 default: 100
 *                 minimum: 10
 *                 maximum: 1000
 *               confidenceLevel:
 *                 type: number
 *                 default: 0.95
 *                 minimum: 0.5
 *                 maximum: 0.99
 *     responses:
 *       200:
 *         description: Monte Carlo simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 monteCarlo:
 *                   type: object
 *                   properties:
 *                     simulations:
 *                       type: integer
 *                     periods:
 *                       type: integer
 *                     meanFinalValue:
 *                       type: string
 *                     medianFinalValue:
 *                       type: string
 *                     bestCase:
 *                       type: string
 *                     worstCase:
 *                       type: string
 *                     valueAtRisk:
 *                       type: string
 *                     expectedShortfall:
 *                       type: string
 *                     probabilityOfProfit:
 *                       type: string
 *                     confidenceLevel:
 *                       type: number
 *                     paths:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: number
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/monte-carlo', authenticate, async (req, res) => {
  try {
    const { 
      selections, 
      bankroll = 1000, 
      simulations = 10000,
      periods = 100,
      confidenceLevel = 0.95 
    } = req.body;
    
    if (!selections || !Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide selections array'
      });
    }
    
    // Run Monte Carlo simulation
    const mcResults = await runMonteCarloSimulation(
      selections,
      bankroll,
      simulations,
      periods,
      confidenceLevel
    );
    
    res.json({
      success: true,
      monteCarlo: {
        ...mcResults,
        confidenceLevel,
        valueAtRisk: mcResults.var.toFixed(2),
        expectedShortfall: mcResults.es.toFixed(2),
        probabilityOfProfit: (mcResults.probProfit * 100).toFixed(1) + '%',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Monte Carlo simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Monte Carlo simulation failed'
    });
  }
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     SimulationResult:
 *       type: object
 *       properties:
 *         totalSimulations:
 *           type: integer
 *         wins:
 *           type: integer
 *         losses:
 *           type: integer
 *         pushes:
 *           type: integer
 *         winRate:
 *           type: string
 *         expectedValue:
 *           type: string
 *         averageWinAmount:
 *           type: string
 *         standardDeviation:
 *           type: string
 *         totalPayout:
 *           type: string
 *         kellyCriterion:
 *           type: string
 *         confidence:
 *           type: string
 *     ParlayResult:
 *       type: object
 *       properties:
 *         simulations:
 *           type: integer
 *         totalWins:
 *           type: integer
 *         totalLosses:
 *           type: integer
 *         winRate:
 *           type: string
 *         totalProfit:
 *           type: string
 *         medianProfit:
 *           type: string
 *         peakBankroll:
 *           type: string
 *         troughBankroll:
 *           type: string
 *         maxDrawdown:
 *           type: string
 *         maxWinningStreak:
 *           type: integer
 *         maxLosingStreak:
 *           type: integer
 *         valueAtRisk:
 *           type: string
 *         expectedShortfall:
 *           type: string
 *     MonteCarloResult:
 *       type: object
 *       properties:
 *         simulations:
 *           type: integer
 *         periods:
 *           type: integer
 *         meanFinalValue:
 *           type: string
 *         medianFinalValue:
 *           type: string
 *         bestCase:
 *           type: string
 *         worstCase:
 *           type: string
 *         valueAtRisk:
 *           type: string
 *         expectedShortfall:
 *           type: string
 *         probabilityOfProfit:
 *           type: string
 */

// Helper function to run selection simulation
async function runSelectionSimulation(selection, simulations, params) {
  let wins = 0;
  let pushes = 0;
  let losses = 0;
  let totalPayout = 0;
  const outcomes = [];
  const winAmounts = [];
  
  // Get player data for more accurate simulation
  const playerPromises = selection.winners.map(winner => 
    Player.findById(winner.playerId).lean()
  );
  const players = await Promise.all(playerPromises);
  
  for (let i = 0; i < simulations; i++) {
    let selectionResult = 'win';
    let allWinnersHit = true;
    
    // Simulate each winner
    for (let j = 0; j < selection.winners.length; j++) {
      const winner = selection.winners[j];
      const player = players[j];
      
      // Base probability from confidence or player stats
      let baseProbability = winner.confidence || 70;
      
      // Adjust based on player stats if available
      if (player && player.stats) {
        const statType = winner.market;
        if (player.stats[statType]) {
          // Simple heuristic: if player averages above line, higher probability for Over
          const line = parseFloat(winner.pick.split(' ')[1]);
          const average = player.stats[statType] || line;
          
          if (winner.pick.startsWith('Over')) {
            baseProbability += (average - line) * 5;
          } else {
            baseProbability += (line - average) * 5;
          }
        }
      }
      
      // Apply variance
      const variance = params.variance;
      const adjustedProbability = baseProbability * (0.9 + Math.random() * 0.2 * variance);
      
      // Correlation effect (winners are not independent)
      const correlationEffect = j === 0 ? 0 : Math.random() * params.correlation * 100;
      const finalProbability = Math.min(95, Math.max(5, adjustedProbability + correlationEffect));
      
      const random = Math.random() * 100;
      
      if (random <= finalProbability - 3) {
        // win
      } else if (random <= finalProbability + 3) {
        // push
        selectionResult = 'push';
        allWinnersHit = false;
      } else {
        // loss
        selectionResult = 'loss';
        allWinnersHit = false;
        break;
      }
    }
    
    if (selectionResult === 'win' && allWinnersHit) {
      wins++;
      
      // Calculate payout
      const odds = selection.totalOdds || '+400';
      const stake = selection.stake || 10;
      let payout = stake;
      
      if (odds.startsWith('+')) {
        const multiplier = parseInt(odds.slice(1)) / 100;
        payout += stake * multiplier;
      } else if (odds.startsWith('-')) {
        const multiplier = 100 / parseInt(odds.slice(1));
        payout += stake * multiplier;
      }
      
      totalPayout += payout;
      winAmounts.push(payout - stake);
    } else if (selectionResult === 'push') {
      pushes++;
    } else {
      losses++;
    }
    
    // Record outcomes for analysis
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
  const oddsValue = odds.startsWith('+') ? 
    parseInt(odds.slice(1)) / 100 : 
    100 / parseInt(odds.slice(1));
  
  const expectedValue = (winRate / 100) * oddsValue - (lossRate / 100);
  
  // Calculate statistics
  const avgWin = winAmounts.length > 0 ? 
    winAmounts.reduce((a, b) => a + b, 0) / winAmounts.length : 0;
  
  const stdDev = winAmounts.length > 0 ? 
    Math.sqrt(winAmounts.map(x => Math.pow(x - avgWin, 2)).reduce((a, b) => a + b) / winAmounts.length) : 0;
  
  return {
    totalSimulations: simulations,
    wins,
    pushes,
    losses,
    winRate: winRate.toFixed(2),
    pushRate: pushRate.toFixed(2),
    lossRate: lossRate.toFixed(2),
    expectedValue: expectedValue.toFixed(3),
    averageWinAmount: avgWin.toFixed(2),
    standardDeviation: stdDev.toFixed(2),
    totalPayout: totalPayout.toFixed(2),
    outcomes: outcomes.slice(-20),
    kellyCriterion: calculateKellyCriterion(winRate / 100, oddsValue),
    confidence: winRate > 65 ? 'High' : winRate > 50 ? 'Medium' : 'Low'
  };
}

// Helper function to simulate parlay series
async function simulateParlaySeries(selections, bankroll, strategy, simulations) {
  const results = [];
  let currentBankroll = bankroll;
  let peakBankroll = bankroll;
  let troughBankroll = bankroll;
  let winningStreak = 0;
  let losingStreak = 0;
  let maxWinningStreak = 0;
  let maxLosingStreak = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalProfit = 0;
  
  for (let sim = 0; sim < simulations; sim++) {
    // Reset for each simulation run
    let simBankroll = bankroll;
    const simResults = [];
    
    for (const selection of selections) {
      // Calculate bet size based on strategy
      let betSize;
      switch (strategy) {
        case 'flat':
          betSize = Math.min(100, simBankroll * 0.1); // 10% or max $100
          break;
        case 'kelly':
          const winProb = (selection.confidence || 70) / 100;
          const odds = selection.totalOdds ? 
            (selection.totalOdds.startsWith('+') ? 
              parseInt(selection.totalOdds.slice(1)) / 100 : 
              100 / parseInt(selection.totalOdds.slice(1))) : 4;
          const kelly = ((winProb * odds) - (1 - winProb)) / odds;
          betSize = Math.max(0, Math.min(simBankroll * kelly * 0.5, simBankroll * 0.25)); // Half-kelly, max 25%
          break;
        case 'aggressive':
          betSize = simBankroll * 0.2; // 20%
          break;
        default:
          betSize = Math.min(50, simBankroll * 0.05); // 5% or max $50
      }
      
      // Simulate the selection
      const winProb = (selection.confidence || 70) / 100;
      const win = Math.random() < winProb;
      
      if (win) {
        const oddsValue = selection.totalOdds ? 
          (selection.totalOdds.startsWith('+') ? 
            parseInt(selection.totalOdds.slice(1)) / 100 : 
            100 / parseInt(selection.totalOdds.slice(1))) : 4;
        
        const profit = betSize * oddsValue;
        simBankroll += profit;
        totalProfit += profit;
        winningStreak++;
        losingStreak = 0;
        totalWins++;
      } else {
        simBankroll -= betSize;
        totalProfit -= betSize;
        losingStreak++;
        winningStreak = 0;
        totalLosses++;
      }
      
      maxWinningStreak = Math.max(maxWinningStreak, winningStreak);
      maxLosingStreak = Math.max(maxLosingStreak, losingStreak);
      
      peakBankroll = Math.max(peakBankroll, simBankroll);
      troughBankroll = Math.min(troughBankroll, simBankroll);
      
      simResults.push({
        betSize,
        win,
        bankrollAfter: simBankroll
      });
    }
    
    results.push({
      simulation: sim,
      finalBankroll: simBankroll,
      profit: simBankroll - bankroll,
      maxDrawdown: ((bankroll - troughBankroll) / bankroll) * 100
    });
    
    currentBankroll = simBankroll;
  }
  
  // Calculate statistics
  const profits = results.map(r => r.profit);
  const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
  const medianProfit = profits.sort((a, b) => a - b)[Math.floor(profits.length / 2)];
  
  const sortedProfits = [...profits].sort((a, b) => a - b);
  const varIndex = Math.floor((1 - 0.95) * sortedProfits.length);
  const valueAtRisk = -sortedProfits[varIndex];
  
  const expectedShortfall = sortedProfits
    .slice(0, varIndex)
    .reduce((a, b) => a + b, 0) / varIndex;
  
  return {
    simulations: simulations,
    totalWins,
    totalLosses,
    winRate: ((totalWins / (totalWins + totalLosses)) * 100).toFixed(2),
    totalProfit: avgProfit.toFixed(2),
    medianProfit: medianProfit.toFixed(2),
    peakBankroll: peakBankroll.toFixed(2),
    troughBankroll: troughBankroll.toFixed(2),
    maxDrawdown: ((bankroll - troughBankroll) / bankroll * 100).toFixed(2),
    maxWinningStreak,
    maxLosingStreak,
    valueAtRisk: valueAtRisk.toFixed(2),
    expectedShortfall: expectedShortfall.toFixed(2),
    kellyOptimal: calculateOptimalKelly(selections),
    results: results.slice(0, 10) // First 10 results for sample
  };
}

// Helper function for Monte Carlo simulation
async function runMonteCarloSimulation(selections, bankroll, simulations, periods, confidenceLevel) {
  const paths = [];
  const finalValues = [];
  
  for (let sim = 0; sim < simulations; sim++) {
    let path = [bankroll];
    
    for (let period = 0; period < periods; period++) {
      let periodValue = path[path.length - 1];
      
      // Simulate each selection in this period
      for (const selection of selections) {
        if (periodValue <= 0) break; // Bankrupt
        
        // Random selection based on confidence
        const winProb = (selection.confidence || 70) / 100;
        const win = Math.random() < winProb;
        
        const betSize = periodValue * 0.1; // Bet 10% of current bankroll
        const oddsValue = 4; // Default +300
        
        if (win) {
          periodValue += betSize * oddsValue;
        } else {
          periodValue -= betSize;
        }
      }
      
      path.push(periodValue);
    }
    
    paths.push(path);
    finalValues.push(path[path.length - 1]);
  }
  
  // Calculate statistics
  const finalSorted = [...finalValues].sort((a, b) => a - b);
  const meanFinal = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
  
  const varIndex = Math.floor((1 - confidenceLevel) * finalSorted.length);
  const valueAtRisk = bankroll - finalSorted[varIndex];
  
  const expectedShortfall = finalSorted
    .slice(0, varIndex)
    .reduce((a, b) => a + b, 0) / varIndex;
  
  const profitablePaths = finalValues.filter(v => v > bankroll).length;
  const probabilityOfProfit = profitablePaths / simulations;
  
  return {
    simulations,
    periods,
    meanFinalValue: meanFinal.toFixed(2),
    medianFinalValue: finalSorted[Math.floor(finalSorted.length / 2)].toFixed(2),
    bestCase: finalSorted[finalSorted.length - 1].toFixed(2),
    worstCase: finalSorted[0].toFixed(2),
    var: valueAtRisk.toFixed(2),
    es: expectedShortfall.toFixed(2),
    probProfit: probabilityOfProfit,
    paths: paths.slice(0, 5) // Return first 5 paths as sample
  };
}

// Helper function to calculate Kelly Criterion
function calculateKellyCriterion(winProbability, odds) {
  // Kelly formula: (bp - q) / b
  // where b = odds, p = win probability, q = loss probability
  const b = odds;
  const p = winProbability;
  const q = 1 - p;
  
  const kelly = (b * p - q) / b;
  
  // Return half-kelly for conservative approach
  return Math.max(0, (kelly * 0.5).toFixed(3));
}

// Helper function to calculate optimal Kelly for multiple selections
function calculateOptimalKelly(selections) {
  const kellyValues = selections.map(selection => {
    const winProb = (selection.confidence || 70) / 100;
    const odds = selection.totalOdds ? 
      (selection.totalOdds.startsWith('+') ? 
        parseInt(selection.totalOdds.slice(1)) / 100 : 
        100 / parseInt(selection.totalOdds.slice(1))) : 4;
    
    return calculateKellyCriterion(winProb, odds);
  });
  
  const avgKelly = kellyValues.reduce((a, b) => a + parseFloat(b), 0) / kellyValues.length;
  return {
    average: avgKelly.toFixed(3),
    min: Math.min(...kellyValues.map(k => parseFloat(k))).toFixed(3),
    max: Math.max(...kellyValues.map(k => parseFloat(k))).toFixed(3),
    recommendation: avgKelly > 0.05 ? 'Bet' : avgKelly > 0.02 ? 'Small Bet' : 'Avoid'
  };
}

// Helper function to generate mock simulations
function generateMockSimulations(limit) {
  const simulations = [];
  const types = ['selection', 'parlay', 'monte-carlo', 'scenario'];
  const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
  
  for (let i = 0; i < limit; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const sport = sports[Math.floor(Math.random() * sports.length)];
    const winRate = 50 + Math.random() * 30;
    
    simulations.push({
      id: `sim_${Date.now()}_${i}`,
      type,
      sport,
      simulations: Math.floor(Math.random() * 5000) + 1000,
      winRate: winRate.toFixed(1) + '%',
      expectedValue: (Math.random() * 0.5 - 0.1).toFixed(3),
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      duration: Math.floor(Math.random() * 5000) + 100,
      result: winRate > 60 ? 'Profitable' : winRate > 45 ? 'Breakeven' : 'Unprofitable'
    });
  }
  
  return simulations;
}

export default router;
