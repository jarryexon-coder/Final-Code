// routes/predictionsRoutes.js
import express from 'express';
const router = express.Router();

// POST /api/predictions/generate - Test endpoint
router.post('/generate', (req, res) => {
  console.log('🤖 Generating AI prediction');
  
  const { gameId, team1, team2, sport = 'NBA' } = req.body;
  
  // Mock AI prediction response
  const prediction = {
    success: true,
    predictionId: `pred_${Date.now()}`,
    sport: sport,
    game: `${team1 || 'Team A'} vs ${team2 || 'Team B'}`,
    predictedWinner: Math.random() > 0.5 ? team1 || 'Team A' : team2 || 'Team B',
    confidence: (Math.random() * 0.3 + 0.65).toFixed(2),
    predictedScore: {
      home: Math.floor(Math.random() * 30 + 90),
      away: Math.floor(Math.random() * 30 + 85)
    },
    keyFactors: [
      'Team momentum in last 5 games',
      'Home court advantage',
      'Head-to-head record',
      'Injury reports',
      'Rest days advantage'
    ],
    riskLevel: Math.random() > 0.7 ? 'High' : 'Medium',
    recommendedBet: Math.random() > 0.5 ? 'Moneyline' : 'Spread',
    timestamp: new Date().toISOString(),
    note: 'Mock prediction for testing'
  };
  
  res.status(200).json(prediction);
});

export default router;
