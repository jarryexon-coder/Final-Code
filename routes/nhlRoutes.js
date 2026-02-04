// routes/nhlRoutes.js - COMPLETE VERSION
import express from 'express';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
    success: true,
  standings: allTeamsArray,  // ← THIS SHOULD BE AN ARRAY
  lastUpdated: new Date().toISOString()
});res.json({
    success: true,
    message: "nhl API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// NHL Games endpoint
router.get('/games', async (req, res) => {
  try {
    console.log('🏒 /api/nhl/games called');
    
    const games = [
      {
        id: 1,
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        homeScore: 3,
        awayScore: 2,
        period: '3rd',
        timeRemaining: '5:30',
        status: 'live',
        date: new Date().toISOString(),
        arena: 'Scotiabank Arena'
      },
      {
        id: 2,
        homeTeam: 'Boston Bruins',
        awayTeam: 'New York Rangers',
        homeScore: 1,
        awayScore: 1,
        period: '2nd',
        timeRemaining: '10:15',
        status: 'live',
        date: new Date().toISOString(),
        arena: 'TD Garden'
      },
      {
        id: 3,
        homeTeam: 'Vancouver Canucks',
        awayTeam: 'Edmonton Oilers',
        homeScore: 0,
        awayScore: 0,
        period: 'Pregame',
        timeRemaining: '',
        status: 'scheduled',
        date: new Date(Date.now() + 86400000).toISOString(),
        arena: 'Rogers Arena'
      }
    ];
    
    res.json({
      success: true,
      games,
      count: games.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/games:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// NHL Standings endpoint - RETURNS ARRAY, NOT OBJECT
router.get('/standings', async (req, res) => {
  try {
    console.log('🏒 Fetching NHL standings...');
    
    // Your existing data (as object)
    const standingsData = {
      eastern: [
        {
          division: "Atlantic",
          teams: [
            { rank: 1, team: "Boston Bruins", wins: 42, losses: 18, ot: 7, points: 91, row: 38 },
            { rank: 2, team: "Florida Panthers", wins: 41, losses: 20, ot: 6, points: 88, row: 37 }
          ]
        },
        {
          division: "Metropolitan",
          teams: [
            { rank: 1, team: "New York Rangers", wins: 44, losses: 18, ot: 4, points: 92, row: 40 },
            { rank: 2, team: "Carolina Hurricanes", wins: 39, losses: 20, ot: 6, points: 84, row: 36 }
          ]
        }
      ],
      western: [
        {
          division: "Central",
          teams: [
            { rank: 1, team: "Colorado Avalanche", wins: 42, losses: 20, ot: 5, points: 89, row: 39 },
            { rank: 2, team: "Winnipeg Jets", wins: 41, losses: 19, ot: 6, points: 88, row: 37 }
          ]
        },
        {
          division: "Pacific",
          teams: [
            { rank: 1, team: "Vancouver Canucks", wins: 42, losses: 18, ot: 7, points: 91, row: 38 },
            { rank: 2, team: "Edmonton Oilers", wins: 38, losses: 21, ot: 2, points: 78, row: 34 }
          ]
        }
      ]
    };
    
    // CONVERT OBJECT TO ARRAY
    const allTeams = [];
    
    // Process Eastern divisions
    if (standingsData.eastern && Array.isArray(standingsData.eastern)) {
      standingsData.eastern.forEach(division => {
        if (division.teams && Array.isArray(division.teams)) {
          allTeams.push(...division.teams.map(team => ({
            ...team,
            conference: 'Eastern',
            division: division.division
          })));
        }
      });
    }
    
    // Process Western divisions
    if (standingsData.western && Array.isArray(standingsData.western)) {
      standingsData.western.forEach(division => {
        if (division.teams && Array.isArray(division.teams)) {
          allTeams.push(...division.teams.map(team => ({
            ...team,
            conference: 'Western',
            division: division.division
          })));
        }
      });
    }
    
    res.json({
      success: true,
      standings: allTeams,  // ← NOW RETURNS ARRAY
      lastUpdated: new Date().toISOString(),
      season: "2024-2025",
      gamesPlayed: 67,
      totalTeams: allTeams.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching NHL standings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NHL standings',
      error: error.message
    });
  }
});

// NHL Stats endpoint
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 /api/nhl/stats called');
    
    const stats = {
      pointsLeaders: [
        { player: 'Nathan MacKinnon', team: 'COL', points: 111, goals: 42, assists: 69 },
        { player: 'Connor McDavid', team: 'EDM', points: 96, goals: 32, assists: 64 },
        { player: 'Nikita Kucherov', team: 'TBL', points: 94, goals: 37, assists: 57 }
      ],
      goalLeaders: [
        { player: 'Auston Matthews', team: 'TOR', goals: 69, assists: 38, points: 107 },
        { player: 'Sam Reinhart', team: 'FLA', goals: 52, assists: 34, points: 86 },
        { player: 'Zach Hyman', team: 'EDM', goals: 50, assists: 36, points: 86 }
      ],
      assistLeaders: [
        { player: 'Connor McDavid', team: 'EDM', assists: 64, goals: 32, points: 96 },
        { player: 'Quinn Hughes', team: 'VAN', assists: 62, goals: 15, points: 77 },
        { player: 'Nathan MacKinnon', team: 'COL', assists: 69, goals: 42, points: 111 }
      ],
      savePercentageLeaders: [
        { player: 'Connor Hellebuyck', team: 'WPG', savePct: 0.924, wins: 35, losses: 15 },
        { player: 'Sergei Bobrovsky', team: 'FLA', savePct: 0.915, wins: 32, losses: 16 },
        { player: 'Thatcher Demko', team: 'VAN', savePct: 0.918, wins: 34, losses: 18 }
      ]
    };
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// NHL Players endpoint
router.get('/players', async (req, res) => {
  try {
    console.log('👤 /api/nhl/players called');
    
    const players = [
      {
        id: 1,
        name: 'Connor McDavid',
        team: 'Edmonton Oilers',
        position: 'C',
        number: 97,
        age: 27,
        height: '6\'1"',
        weight: 193,
        nationality: 'CAN',
        gamesPlayed: 65,
        goals: 32,
        assists: 64,
        points: 96,
        plusMinus: 15,
        penaltyMinutes: 28,
        timeOnIce: '22:15'
      },
      {
        id: 2,
        name: 'Nathan MacKinnon',
        team: 'Colorado Avalanche',
        position: 'C',
        number: 29,
        age: 28,
        height: '6\'0"',
        weight: 200,
        nationality: 'CAN',
        gamesPlayed: 66,
        goals: 42,
        assists: 69,
        points: 111,
        plusMinus: 25,
        penaltyMinutes: 42,
        timeOnIce: '23:30'
      },
      {
        id: 3,
        name: 'David Pastrnak',
        team: 'Boston Bruins',
        position: 'RW',
        number: 88,
        age: 27,
        height: '6\'0"',
        weight: 195,
        nationality: 'CZE',
        gamesPlayed: 68,
        goals: 47,
        assists: 43,
        points: 90,
        plusMinus: 18,
        penaltyMinutes: 38,
        timeOnIce: '21:45'
      },
      {
        id: 4,
        name: 'Auston Matthews',
        team: 'Toronto Maple Leafs',
        position: 'C',
        number: 34,
        age: 26,
        height: '6\'3"',
        weight: 216,
        nationality: 'USA',
        gamesPlayed: 64,
        goals: 69,
        assists: 38,
        points: 107,
        plusMinus: 31,
        penaltyMinutes: 20,
        timeOnIce: '20:55'
      }
    ];
    
    res.json({
      success: true,
      players,
      count: players.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/players:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// NHL Game Summary endpoint
router.get('/gameSummary', async (req, res) => {
  const { gameId } = req.query;
  
  res.json({
    success: true,
    summary: {
      gameId: gameId || 'mock_nhl_game_001',
      homeTeam: 'NHL Home Team',
      awayTeam: 'NHL Away Team',
      status: 'scheduled',
    },
    message: 'Stub endpoint'
  });
});

// NHL Schedule endpoint
router.get('/schedule', async (req, res) => {
  // Return mock schedule for next 7 days
  const schedule = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    schedule.push({
      date: date.toISOString().split('T')[0],
      games: [
        {
          id: `mock_nhl_${i}`,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          time: '19:00 ET'
        }
      ]
    });
  }
  
  res.json({
    success: true,
    schedule: schedule,
    message: 'Stub schedule endpoint'
  });
});

// NHL Scoreboard endpoint
router.get('/scoreboard', async (req, res) => {
  res.json({
    success: true,
    scoreboard: [
      {
        id: 'mock_nhl_game_1',
        homeTeam: { name: 'Boston Bruins', score: 3 },
        awayTeam: { name: 'Toronto Maple Leafs', score: 2 },
        status: 'final',
        period: 3
      }
    ],
    message: 'Stub scoreboard endpoint'
  });
});

// Export the router
export default router;
