import express from 'express';
import ContestOptimizer from '../services/ContestOptimizer.js';

const router = express.Router();

// GET: GPP leverage plays
router.get('/gpp/leverage', async (req, res) => {
  try {
    const { sport, contestSize } = req.query;
    
    const leveragePlays = await ContestOptimizer.findLeveragePlays({
      sport: sport || 'NFL',
      contestSize: contestSize || 'large'
    });
    
    res.json({
      success: true,
      data: leveragePlays
    });
  } catch (error) {
    console.error('❌ Error finding GPP leverage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Game stack engine
router.get('/game-stack/engine', async (req, res) => {
  try {
    const { sport } = req.query;
    
    // Mock response
    const gameStack = {
      game: 'Mock Game: Team A vs Team B',
      total: 235.5,
      strategy: 'Stack highest total game on slate',
      players: [
        { name: 'Star Player 1', position: 'QB', projection: 28.5 },
        { name: 'Star Player 2', position: 'WR', projection: 22.3 }
      ],
      confidence: 'High'
    };
    
    res.json({
      success: true,
      data: gameStack
    });
  } catch (error) {
    console.error('❌ Error generating game stack:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Generate optimized lineups
router.post('/optimize', async (req, res) => {
  try {
    const { playerPool, lineupCount, contestType } = req.body;
    
    const result = await ContestOptimizer.generateOptimizedLineups({
      playerPool: playerPool || [],
      lineupCount: lineupCount || 3,
      contestType: contestType || 'GPP'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error optimizing lineups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
