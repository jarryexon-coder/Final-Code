// File: routes/stubRoutes.js (optional approach)
const express = require('express');
const router = express.Router();

// Central stub endpoints for quick deployment
router.get('/nba/gameSummary', (req, res) => {
  res.json({
    success: true,
    summary: getNBAGameSummary(req.query.gameId),
    stub: true,
    timestamp: new Date().toISOString()
  });
});

router.get('/nfl/gameSummary', (req, res) => {
  res.json({
    success: true,
    summary: getNFLGameSummary(req.query.gameId),
    stub: true,
    timestamp: new Date().toISOString()
  });
});

router.get('/nhl/gameSummary', (req, res) => {
  res.json({
    success: true,
    summary: getNHLGameSummary(req.query.gameId),
    stub: true,
    timestamp: new Date().toISOString()
  });
});

router.get('/nhl/schedule', (req, res) => {
  res.json({
    success: true,
    schedule: getNHLSchedule(),
    stub: true,
    timestamp: new Date().toISOString()
  });
});

router.get('/nhl/scoreboard', (req, res) => {
  res.json({
    success: true,
    scoreboard: getNHLScoreboard(),
    stub: true,
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function getNBAGameSummary(gameId) {
  return {
    gameId: gameId || 'nba_001',
    homeTeam: { id: 1, name: 'Los Angeles Lakers', score: 105 },
    awayTeam: { id: 2, name: 'Golden State Warriors', score: 98 },
    status: 'final',
    period: 4,
    timeRemaining: '0:00',
    venue: 'Crypto.com Arena',
    startTime: '2024-01-15T19:30:00Z'
  };
}

function getNFLGameSummary(gameId) {
  return {
    gameId: gameId || 'nfl_001',
    homeTeam: { id: 1, name: 'Kansas City Chiefs', score: 35 },
    awayTeam: { id: 2, name: 'Philadelphia Eagles', score: 38 },
    status: 'final',
    quarter: 4,
    timeRemaining: '0:00',
    venue: 'Arrowhead Stadium'
  };
}

function getNHLGameSummary(gameId) {
  return {
    gameId: gameId || 'nhl_001',
    homeTeam: { id: 1, name: 'Boston Bruins', score: 3 },
    awayTeam: { id: 2, name: 'Toronto Maple Leafs', score: 2 },
    status: 'final',
    period: 3,
    timeRemaining: '0:00',
    venue: 'TD Garden'
  };
}

function getNHLSchedule() {
  const schedule = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    schedule.push({
      date: date.toISOString().split('T')[0],
      numberOfGames: 2,
      games: [
        {
          id: `nhl_${i}_1`,
          homeTeam: { id: 1, name: 'Boston Bruins' },
          awayTeam: { id: 2, name: 'Toronto Maple Leafs' },
          time: '19:00 ET',
          venue: 'TD Garden'
        },
        {
          id: `nhl_${i}_2`,
          homeTeam: { id: 3, name: 'New York Rangers' },
          awayTeam: { id: 4, name: 'New Jersey Devils' },
          time: '20:00 ET',
          venue: 'Madison Square Garden'
        }
      ]
    });
  }
  
  return schedule;
}

function getNHLScoreboard() {
  return [
    {
      id: 'nhl_001',
      homeTeam: { id: 1, name: 'Boston Bruins', score: 3 },
      awayTeam: { id: 2, name: 'Toronto Maple Leafs', score: 2 },
      status: 'final',
      period: 3,
      timeRemaining: '0:00'
    },
    {
      id: 'nhl_002',
      homeTeam: { id: 3, name: 'New York Rangers', score: 1 },
      awayTeam: { id: 4, name: 'New Jersey Devils', score: 1 },
      status: 'live',
      period: 2,
      timeRemaining: '12:34'
    }
  ];
}

module.exports = router;
