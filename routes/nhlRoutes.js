// routes/nhlRoutes.js - COMPLETE VERSION
import express from 'express';
import { cacheService } from '../server.js';

const router = express.Router();

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

// NHL Standings endpoint (from your code)
router.get('/standings', async (req, res) => {
  console.log('🎯 /api/nhl/standings called');
  
  const standings = [
    {
      conference: 'Eastern',
      division: 'Atlantic',
      teams: [
        { 
          teamAbbrev: 'FLA',
          teamName: 'Florida Panthers',
          gamesPlayed: 65,
          wins: 45,
          losses: 17,
          otLosses: 3,
          points: 93,
          pointsPercentage: 0.715,
          streak: 'W5',
          rank: 1
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
          streak: 'W2',
          rank: 2
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
          streak: 'W1',
          rank: 3
        }
      ]
    },
    {
      conference: 'Eastern',
      division: 'Metropolitan',
      teams: [
        { 
          teamAbbrev: 'NYR',
          teamName: 'New York Rangers',
          gamesPlayed: 65,
          wins: 42,
          losses: 18,
          otLosses: 5,
          points: 89,
          pointsPercentage: 0.685,
          streak: 'W2',
          rank: 1
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
          streak: 'W1',
          rank: 2
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
          streak: 'L1',
          rank: 3
        }
      ]
    },
    {
      conference: 'Western',
      division: 'Central',
      teams: [
        { 
          teamAbbrev: 'DAL',
          teamName: 'Dallas Stars',
          gamesPlayed: 67,
          wins: 41,
          losses: 19,
          otLosses: 7,
          points: 89,
          pointsPercentage: 0.664,
          streak: 'L1',
          rank: 1
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
          streak: 'W3',
          rank: 2
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
          streak: 'L2',
          rank: 3
        }
      ]
    },
    {
      conference: 'Western',
      division: 'Pacific',
      teams: [
        { 
          teamAbbrev: 'VAN',
          teamName: 'Vancouver Canucks',
          gamesPlayed: 67,
          wins: 42,
          losses: 18,
          otLosses: 7,
          points: 91,
          pointsPercentage: 0.679,
          streak: 'W1',
          rank: 1
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
          streak: 'W2',
          rank: 2
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
          streak: 'L1',
          rank: 3
        }
      ]
    }
  ];
  
  res.json({
    success: true,
    data: standings,
    count: standings.length,
    timestamp: new Date().toISOString(),
    season: '2023-2024',
    lastUpdated: new Date().toISOString()
  });
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
      },
      {
        id: 5,
        name: 'Cale Makar',
        team: 'Colorado Avalanche',
        position: 'D',
        number: 8,
        age: 25,
        height: '5\'11"',
        weight: 187,
        nationality: 'CAN',
        gamesPlayed: 62,
        goals: 19,
        assists: 52,
        points: 71,
        plusMinus: 22,
        penaltyMinutes: 34,
        timeOnIce: '25:10'
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

// NHL Team info endpoint
router.get('/teams', async (req, res) => {
  try {
    console.log('🏒 /api/nhl/teams called');
    
    const teams = [
      {
        id: 1,
        abbreviation: 'TOR',
        name: 'Toronto Maple Leafs',
        city: 'Toronto',
        division: 'Atlantic',
        conference: 'Eastern',
        arena: 'Scotiabank Arena',
        established: 1917,
        colors: ['#003E7E', '#FFFFFF'],
        website: 'https://www.nhl.com/mapleleafs'
      },
      {
        id: 2,
        abbreviation: 'MTL',
        name: 'Montreal Canadiens',
        city: 'Montreal',
        division: 'Atlantic',
        conference: 'Eastern',
        arena: 'Bell Centre',
        established: 1909,
        colors: ['#AF1E2D', '#192168'],
        website: 'https://www.nhl.com/canadiens'
      },
      {
        id: 3,
        abbreviation: 'BOS',
        name: 'Boston Bruins',
        city: 'Boston',
        division: 'Atlantic',
        conference: 'Eastern',
        arena: 'TD Garden',
        established: 1924,
        colors: ['#FFB81C', '#000000'],
        website: 'https://www.nhl.com/bruins'
      },
      {
        id: 4,
        abbreviation: 'VAN',
        name: 'Vancouver Canucks',
        city: 'Vancouver',
        division: 'Pacific',
        conference: 'Western',
        arena: 'Rogers Arena',
        established: 1970,
        colors: ['#008852', '#041E42'],
        website: 'https://www.nhl.com/canucks'
      }
    ];
    
    res.json({
      success: true,
      teams,
      count: teams.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/teams:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'NHL API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: ['/games', '/standings', '/stats', '/players', '/teams']
  });
});

// Export the router - THIS IS CRITICAL!
export default router;

// Also export as named export for compatibility
export { router };
