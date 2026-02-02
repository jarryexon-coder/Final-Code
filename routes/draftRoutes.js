import express from 'express';
import DraftStrategyService from '../services/DraftStrategyService.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "draft API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// GET: Snake draft anchor strategy
router.get('/snake/anchor', async (req, res) => {
  try {
    const { draftPosition, teamCount, sport } = req.query;
    
    const plan = DraftStrategyService.generateDraftPlan({
      draftPosition: parseInt(draftPosition) || 5,
      teamCount: parseInt(teamCount) || 10,
      sport: sport || 'NBA',
      rounds: 10
    });
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('❌ Error generating draft anchor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Snake draft value pivot
router.get('/snake/value-pivot', async (req, res) => {
  try {
    const { draftRound, sport } = req.query;
    
    // Mock response - implement based on your actual logic
    const valuePicks = {
      strategy: 'Target high-value players in rounds 3-4',
      picks: [
        { name: 'Value Player 1', position: 'SG', valueRating: 8.5 },
        { name: 'Value Player 2', position: 'PF', valueRating: 8.2 }
      ],
      confidence: 'Medium'
    };
    
    res.json({
      success: true,
      data: valuePicks
    });
  } catch (error) {
    console.error('❌ Error generating value pivot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Late round gems
router.get('/late-round/gems', async (req, res) => {
  try {
    const { sport } = req.query;
    
    // Mock response
    const gems = {
      strategy: 'High-upside players for final rounds',
      picks: [
        { name: 'Sleeper Pick 1', position: 'PG', upsideRating: 9.0 },
        { name: 'Sleeper Pick 2', position: 'C', upsideRating: 8.7 }
      ],
      confidence: 'Low-Medium'
    };
    
    res.json({
      success: true,
      data: gems
    });
  } catch (error) {
    console.error('❌ Error finding late round gems:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
