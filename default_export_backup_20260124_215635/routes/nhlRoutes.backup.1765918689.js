import express from 'express';
const router = express.Router();

// Add at the TOP of nhlRoutes.js, after imports
console.log('🏒 NHL Routes loaded: /games, /stats, /players, /standings');

router.get('/games', (req, res) => {
  console.log(`🎯 [${new Date().toISOString()}] /api/nhl/games called from IP: ${req.ip}`);
  
  res.json({ 
    success: true, 
    games: [
      { id: 1, home: 'TOR', away: 'MTL', time: '7:00 PM ET' },
      { id: 2, home: 'BOS', away: 'NYR', time: '7:30 PM ET' }
    ] 
  });
});

router.get('/stats', (req, res) => {
  console.log(`🎯 [${new Date().toISOString()}] /api/nhl/stats called from IP: ${req.ip}`);
  
  res.json({ 
    success: true, 
    stats: [
      { player: 'Connor McDavid', team: 'EDM', points: 132 },
      { player: 'Nathan MacKinnon', team: 'COL', points: 127 }
    ] 
  });
});

// GET /api/nhl/players
router.get('/players', async (req, res) => {
  try {
    console.log(`🎯 [${new Date().toISOString()}] /api/nhl/players called from IP: ${req.ip}`);
    console.log('📊 Fetching NHL players data');
    
    // Check if you have a service to fetch NHL data
    // If not, use mock data for now
    const players = [
      {
        id: 8478402,
        name: 'Connor McDavid',
        team: 'EDM',
        teamName: 'Edmonton Oilers',
        position: 'C',
        jerseyNumber: 97,
        stats: {
          gamesPlayed: 65,
          goals: 32,
          assists: 67,
          points: 99,
          plusMinus: 28
        },
        headshot: 'https://assets.nhle.com/mugs/nhl/20232024/EDM/8478402.png'
      },
      {
        id: 8477492,
        name: 'Nathan MacKinnon',
        team: 'COL',
        teamName: 'Colorado Avalanche',
        position: 'C',
        jerseyNumber: 29,
        stats: {
          gamesPlayed: 64,
          goals: 42,
          assists: 69,
          points: 111,
          plusMinus: 34
        },
        headshot: 'https://assets.nhle.com/mugs/nhl/20232024/COL/8477492.png'
      },
      {
        id: 8471214,
        name: 'Auston Matthews',
        team: 'TOR',
        teamName: 'Toronto Maple Leafs',
        position: 'C',
        jerseyNumber: 34,
        stats: {
          gamesPlayed: 62,
          goals: 58,
          assists: 26,
          points: 84,
          plusMinus: 31
        },
        headshot: 'https://assets.nhle.com/mugs/nhl/20232024/TOR/8471214.png'
      }
    ];
    
    console.log(`✅ [${new Date().toISOString()}] /api/nhl/players returning ${players.length} players`);
    
    res.json({
      success: true,
      data: players,
      count: players.length,
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    });
    
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error in /api/nhl/players:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NHL players',
      message: error.message
    });
  }
});

// GET /api/nhl/standings
router.get('/standings', async (req, res) => {
  try {
    console.log(`🎯 [${new Date().toISOString()}] /api/nhl/standings called from IP: ${req.ip}`);
    console.log('🏆 Fetching NHL standings');
    
    // Return structured standings data
    const standings = {
      easternConference: {
        metropolitan: [
          {
            teamAbbrev: 'NYR',
            teamName: 'New York Rangers',
            gamesPlayed: 65,
            wins: 42,
            losses: 18,
            otLosses: 5,
            points: 89,
            pointsPercentage: 0.685,
            streak: 'W2'
          },
          {
            teamAbbrev: 'CAR',
            teamName: 'Carolina Hurricanes',
            gamesPlayed: 64,
            wins: 39,
            losses: 20,
            otLosses: 5,
            points: 83,
            pointsPercentage: 0.648,
            streak: 'W1'
          },
          {
            teamAbbrev: 'PHI',
            teamName: 'Philadelphia Flyers',
            gamesPlayed: 66,
            wins: 33,
            losses: 25,
            otLosses: 8,
            points: 74,
            pointsPercentage: 0.561,
            streak: 'L1'
          }
        ],
        atlantic: [
          {
            teamAbbrev: 'FLA',
            teamName: 'Florida Panthers',
            gamesPlayed: 65,
            wins: 45,
            losses: 17,
            otLosses: 3,
            points: 93,
            pointsPercentage: 0.715,
            streak: 'W5'
          },
          {
            teamAbbrev: 'BOS',
            teamName: 'Boston Bruins',
            gamesPlayed: 66,
            wins: 38,
            losses: 14,
            otLosses: 14,
            points: 90,
            pointsPercentage: 0.682,
            streak: 'W2'
          },
          {
            teamAbbrev: 'TOR',
            teamName: 'Toronto Maple Leafs',
            gamesPlayed: 64,
            wins: 37,
            losses: 19,
            otLosses: 8,
            points: 82,
            pointsPercentage: 0.641,
            streak: 'W1'
          }
        ]
      },
      westernConference: {
        central: [
          {
            teamAbbrev: 'DAL',
            teamName: 'Dallas Stars',
            gamesPlayed: 67,
            wins: 41,
            losses: 19,
            otLosses: 7,
            points: 89,
            pointsPercentage: 0.664,
            streak: 'L1'
          },
          {
            teamAbbrev: 'COL',
            teamName: 'Colorado Avalanche',
            gamesPlayed: 66,
            wins: 41,
            losses: 21,
            otLosses: 4,
            points: 86,
            pointsPercentage: 0.652,
            streak: 'W3'
          },
          {
            teamAbbrev: 'WPG',
            teamName: 'Winnipeg Jets',
            gamesPlayed: 64,
            wins: 40,
            losses: 19,
            otLosses: 5,
            points: 85,
            pointsPercentage: 0.664,
            streak: 'L2'
          }
        ],
        pacific: [
          {
            teamAbbrev: 'VAN',
            teamName: 'Vancouver Canucks',
            gamesPlayed: 67,
            wins: 42,
            losses: 18,
            otLosses: 7,
            points: 91,
            pointsPercentage: 0.679,
            streak: 'W1'
          },
          {
            teamAbbrev: 'EDM',
            teamName: 'Edmonton Oilers',
            gamesPlayed: 65,
            wins: 41,
            losses: 21,
            otLosses: 3,
            points: 85,
            pointsPercentage: 0.654,
            streak: 'W2'
          },
          {
            teamAbbrev: 'LAK',
            teamName: 'Los Angeles Kings',
            gamesPlayed: 65,
            wins: 34,
            losses: 22,
            otLosses: 9,
            points: 77,
            pointsPercentage: 0.592,
            streak: 'L1'
          }
        ]
      },
      lastUpdated: new Date().toISOString(),
      season: '2023-2024'
    };
    
    console.log(`✅ [${new Date().toISOString()}] /api/nhl/standings returning standings data`);
    
    res.json({
      success: true,
      data: standings,
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    });
    
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error in /api/nhl/standings:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NHL standings',
      message: error.message
    });
  }
});

export default router;
export default router;
export default router;
