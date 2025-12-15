import express from 'express';
import NBAService from '../services/nbaService.js';
import Player from '../models/Player.js';

const router = express.Router();

// Get player stats
router.get('/player/:name', async (req, res) => {
  try {
    const playerName = req.params.name;
    const result = await NBAService.getPlayerStats(playerName);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        source: result.source
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in player route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all players (for testing)
router.get('/players', async (req, res) => {
  try {
    const players = await NBAService.getAllPlayers();
    res.json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// Search players
router.get('/search/:query', async (req, res) => {
  try {
    const players = await NBAService.searchPlayers(req.params.query);
    res.json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Database health check
router.get('/db-status', async (req, res) => {
  try {
    const playerCount = await Player.countDocuments();
    const recentPlayers = await Player.find()
      .sort({ lastUpdated: -1 })
      .limit(5)
      .select('name lastUpdated');
    
    res.json({
      success: true,
      data: {
        totalPlayers: playerCount,
        recentlyUpdated: recentPlayers,
        database: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection issue'
    });
  }
});

export default router;
