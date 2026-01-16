import express from 'express';
const router = express.Router();

router.get('/games', (req, res) => {
  res.json({ 
    success: true, 
    games: [
      { id: 1, home: 'KC', away: 'BUF', time: '4:25 PM ET' },
      { id: 2, home: 'SF', away: 'DAL', time: '8:20 PM ET' }
    ] 
  });
});

router.get('/stats', (req, res) => {
  res.json({ 
    success: true, 
    stats: [
      { player: 'Patrick Mahomes', team: 'KC', passingYards: 4183 },
      { player: 'Christian McCaffrey', team: 'SF', rushingYards: 1459 }
    ] 
  });
});

router.get('/gameSummary', async (req, res) => {
  const { gameId } = req.query;
  
  res.json({
    success: true,
    summary: {
      gameId: gameId || 'mock_nfl_game_001',
      homeTeam: 'NFL Home Team',
      awayTeam: 'NFL Away Team',
      status: 'scheduled',
      // NFL-specific fields
    },
    message: 'Stub endpoint'
  });
});

export default router;
