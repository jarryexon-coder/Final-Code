import express from 'express';
const router = express.Router();

router.get('/all', (req, res) => {
  res.json({
    success: true,
    news: {
      nba: [
        { title: 'NBA Trade Deadline Recap', category: 'transactions' },
        { title: 'MVP Race Heating Up', category: 'analysis' }
      ],
      nhl: [
        { title: 'Playoff Picture Taking Shape', category: 'standings' }
      ],
      nfl: [
        { title: 'Free Agency Frenzy Begins', category: 'transactions' }
      ],
      injuries: [
        { player: 'Joel Embiid', injury: 'knee', status: 'day-to-day' }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
