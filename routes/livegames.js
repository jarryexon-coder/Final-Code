const express = require('express');
const router = express.Router();

// Get current live games
router.get('/live', (req, res) => {
  // This would connect to a real NBA API
  const liveGames = [
    {
      id: 1,
      home_team: "Lakers",
      away_team: "Warriors",
      home_score: 98,
      away_score: 95,
      period: "4th",
      time_remaining: "2:15",
      status: "in_progress",
      broadcast: "ESPN"
    },
    {
      id: 2,
      home_team: "Celtics", 
      away_team: "Heat",
      home_score: 85,
      away_score: 82,
      period: "3rd",
      time_remaining: "1:20",
      status: "in_progress",
      broadcast: "TNT"
    }
  ];

  res.json({
    success: true,
    data: liveGames,
    last_updated: new Date().toISOString()
  });
});

module.exports = router;
