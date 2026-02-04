const express = require('express');
const router = express.Router();

// GET /api/players - Returns player data
router.get('/', async (req, res) => {
  try {
    const players = [
      {
        id: '1',
        name: 'LeBron James',
        sport: 'NBA',
        team: 'Los Angeles Lakers',
        position: 'SF',
        stats: {
          pointsPerGame: 25.3,
          reboundsPerGame: 7.9,
          assistsPerGame: 7.3,
          fieldGoalPercentage: 52.1,
          gamesPlayed: 45
        },
        imageUrl: 'https://placehold.co/100x100/1e40af/white?text=LJ',
        status: 'active',
        jerseyNumber: 23,
        height: "6'9\"",
        weight: '250 lbs'
      },
      {
        id: '2',
        name: 'Stephen Curry',
        sport: 'NBA',
        team: 'Golden State Warriors',
        position: 'PG',
        stats: {
          pointsPerGame: 28.5,
          reboundsPerGame: 4.5,
          assistsPerGame: 5.2,
          threePointPercentage: 42.7,
          gamesPlayed: 48
        },
        imageUrl: 'https://placehold.co/100x100/991b1b/white?text=SC',
        status: 'active',
        jerseyNumber: 30,
        height: "6'3\"",
        weight: '185 lbs'
      },
      {
        id: '3',
        name: 'Patrick Mahomes',
        sport: 'NFL',
        team: 'Kansas City Chiefs',
        position: 'QB',
        stats: {
          passingYards: 4743,
          passingTDs: 38,
          interceptions: 14,
          rating: 103.5,
          completions: 385
        },
        imageUrl: 'https://placehold.co/100x100/166534/white?text=PM',
        status: 'active',
        jerseyNumber: 15,
        height: "6'2\"",
        weight: '225 lbs'
      },
      {
        id: '4',
        name: 'Justin Jefferson',
        sport: 'NFL',
        team: 'Minnesota Vikings',
        position: 'WR',
        stats: {
          receivingYards: 1809,
          receivingTDs: 12,
          receptions: 128,
          yardsPerCatch: 14.1
        },
        imageUrl: 'https://placehold.co/100x100/7c2d12/white?text=JJ',
        status: 'active',
        jerseyNumber: 18,
        height: "6'1\"",
        weight: '195 lbs'
      }
    ];

    const { sport } = req.query;
    let filteredPlayers = players;
    
    if (sport) {
      filteredPlayers = players.filter(p => 
        p.sport.toLowerCase() === sport.toLowerCase()
      );
    }

    res.json({
      success: true,
      message: 'Player data',
      timestamp: new Date().toISOString(),
      players: filteredPlayers,
      count: filteredPlayers.length,
      sports: ['NBA', 'NFL', 'NHL', 'MLB']
    });

  } catch (error) {
    console.error('Error in /api/players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

module.exports = router;

