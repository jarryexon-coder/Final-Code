import express from 'express';
const router = express.Router();

// Live games endpoint
router.get('/live', async (req, res) => {
  console.log('🎮 /api/games/live endpoint called');
  
  const liveGames = {
    nba: [
      {
        gameId: 'nba-live-001',
        status: 'live',
        clock: '2:15',
        period: '4th Qtr',
        homeTeam: { abbreviation: 'LAL', name: 'Lakers', score: 98 },
        awayTeam: { abbreviation: 'GSW', name: 'Warriors', score: 102 }
      }
    ],
    nhl: [
      {
        gameId: 'nhl-live-001',
        status: 'live',
        clock: '10:45',
        period: '3rd',
        homeTeam: { abbreviation: 'BOS', name: 'Bruins', score: 3 },
        awayTeam: { abbreviation: 'TOR', name: 'Maple Leafs', score: 2 }
      }
    ],
    nfl: [],
    updated: new Date().toISOString(),
    totalLiveGames: 2
  };
  
  res.json({
    success: true,
    data: liveGames,
    count: liveGames.totalLiveGames,
    timestamp: new Date().toISOString()
  });
});

// Make sure this is at the END of the file
export default router;
export default router;
