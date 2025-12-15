import express from 'express';
const router = express.Router();

router.get('/games', (req, res) => {
  res.json({ 
    success: true, 
    games: [
      { id: 1, home: 'TOR', away: 'MTL', time: '7:00 PM ET' },
      { id: 2, home: 'BOS', away: 'NYR', time: '7:30 PM ET' }
    ] 
  });
});

router.get('/stats', (req, res) => {
  res.json({ 
    success: true, 
    stats: [
      { player: 'Connor McDavid', team: 'EDM', points: 132 },
      { player: 'Nathan MacKinnon', team: 'COL', points: 127 }
    ] 
  });
});

export default router;
