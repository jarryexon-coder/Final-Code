const express = require('express');
const router = express.Router();
const bettingAlgorithms = require('../services/bettingAlgorithms');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// Get betting insights for specific game
router.get('/insights/game/:homeTeam/:awayTeam', cacheMiddleware(300), async (req, res) => {
  try {
    const { homeTeam, awayTeam } = req.params;
    
    const insights = await bettingAlgorithms.generateGameInsights(homeTeam, awayTeam);
    
    res.json({
      success: true,
      data: insights,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Betting insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate betting insights'
    });
  }
});

// Analyze player prop
router.get('/props/analyze', cacheMiddleware(600), async (req, res) => {
  try {
    const { player, propType, line, odds } = req.query;
    
    if (!player || !propType || !line || !odds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: player, propType, line, odds'
      });
    }

    const analysis = bettingAlgorithms.analyzePlayerProps(
      player, 
      propType, 
      parseFloat(line), 
      parseFloat(odds)
    );

    res.json({
      success: true,
      data: {
        player,
        propType,
        line: parseFloat(line),
        odds: parseFloat(odds),
        analysis,
        recommendation: analysis.isValueBet ? 'BET' : 'PASS',
        confidence: Math.abs(analysis.edge)
      }
    });
  } catch (error) {
    console.error('Player prop analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze player prop'
    });
  }
});

// Get value bets for today's games
router.get('/value-bets/today', cacheMiddleware(900), async (req, res) => {
  try {
    const todayGames = [
      {
        game: 'Lakers vs Warriors',
        market: 'Moneyline',
        pick: 'Lakers',
        odds: 2.10,
        edge: 5.2,
        confidence: 'High',
        reasoning: 'Home court advantage and matchup favor Lakers'
      },
      {
        game: 'Lakers vs Warriors', 
        market: 'Player Points',
        pick: 'LeBron James Over 25.5',
        odds: 1.90,
        edge: 3.8,
        confidence: 'Medium',
        reasoning: 'Averaging 27.3 ppg in last 10 games vs Warriors'
      }
    ];

    res.json({
      success: true,
      data: {
        valueBets: todayGames,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Betting involves risk. Only bet what you can afford to lose.'
      }
    });
  } catch (error) {
    console.error('Value bets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch value bets'
    });
  }
});

module.exports = router;
