const express = require('express');
const router = express.Router();
const FantasyTeam = require('../models/FantasyTeam');
// const authenticateToken = require('../middleware/auth'); // Uncomment when auth is ready
const cacheMiddleware = require('../middleware/cacheMiddleware');

// Get user's fantasy teams
router.get('/my-teams', /* authenticateToken, */ cacheMiddleware(300), async (req, res) => {
  try {
    // For now, return mock data until auth is implemented
    const mockTeams = [
      {
        _id: '1',
        teamName: 'Dream Team',
        players: [
          { playerId: '1', name: 'LeBron James', position: 'F', team: 'Lakers', salary: 50000, points: 25.3, rebounds: 7.8, assists: 7.3 }
        ],
        totalSalary: 50000,
        totalProjectedPoints: 25.3
      }
    ];
    
    res.json({
      success: true,
      data: mockTeams,
      count: mockTeams.length
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fantasy teams'
    });
  }
});

// Create new fantasy team
router.post('/create', /* authenticateToken, */ async (req, res) => {
  try {
    const { teamName, players } = req.body;
    
    // Validate team
    if (!teamName || !players || players.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Team name and players are required'
      });
    }

    // Check salary cap (example: $100,000 cap)
    const totalSalary = players.reduce((sum, player) => sum + (player.salary || 0), 0);
    if (totalSalary > 100000) {
      return res.status(400).json({
        success: false,
        error: `Team salary ${totalSalary} exceeds salary cap of $100,000`
      });
    }

    // For now, return success without saving to database
    const newTeam = {
      _id: Date.now().toString(),
      userId: 'mock-user-id',
      teamName,
      players,
      totalSalary,
      totalProjectedPoints: players.reduce((sum, player) => sum + (player.points || 0), 0),
      created: new Date(),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: newTeam,
      message: 'Fantasy team created successfully!'
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fantasy team'
    });
  }
});

// Get team analytics
router.get('/:teamId/analytics', /* authenticateToken, */ cacheMiddleware(600), async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Mock analytics for now
    const analytics = {
      totalPlayers: 5,
      totalSalary: 85000,
      totalProjectedPoints: 112.5,
      averagePlayerSalary: 17000,
      positionDistribution: { 'F': 2, 'G': 2, 'C': 1 },
      teamDistribution: { 'Lakers': 2, 'Warriors': 1, 'Celtics': 1, 'Bucks': 1 }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team analytics'
    });
  }
});

module.exports = router;
