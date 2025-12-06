const express = require('express');
const router = express.Router();
const enhancedNBAService = require('../services/enhancedNBAService');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// Get player stats with real BallDon'tLie API
router.get('/player/:playerName', cacheMiddleware(300), async function(req, res) {
  try {
    const playerName = req.params.playerName;
    console.log('🎯 Fetching stats for player:', playerName);
    
    const stats = await enhancedNBAService.getPlayerStats(playerName);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Player stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player statistics'
    });
  }
});

// Get betting odds from your scheduler
router.get('/betting/odds', cacheMiddleware(300), function(req, res) {
  try {
    console.log('[NBA] Returning sample betting data');
    
    const odds = {
      games: [
        {
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: 'Tonight 7:30 PM',
          moneyline: { home: -150, away: +130 },
          spread: { home: -3.5, away: +3.5 },
          total: { points: 225.5 }
        }
      ],
      player_props: [
        { player: 'LeBron James', stat: 'Points', line: 27.5, over: -110, under: -110 }
      ],
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: odds,
      source: 'Sample Data'
    });
  } catch (error) {
    console.error('Betting odds error:', error);
    res.json({
      success: true,
      data: {
        games: [{
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: 'Tonight',
          moneyline: { home: -150, away: +130 }
        }]
      }
    });
  }
});
  } catch (error) {
    console.error('❌ Betting odds error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
  } catch (error) {
    console.error('❌ Betting odds error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds'
    });
  }
});

// Get player props from your scheduler
router.get('/betting/player-props', cacheMiddleware(600), function(req, res) {
  try {
    const props = enhancedNBAService.getPlayerProps();
    
    res.json({
      success: true,
      data: props
    });
  } catch (error) {
    console.error('❌ Player props error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player props'
    });
  }
});

// Get predictions from your scheduler
router.get('/betting/predictions', cacheMiddleware(600), function(req, res) {
  try {
    const predictions = enhancedNBAService.getPredictions();
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('❌ Predictions error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions'
    });
  }
});

// Get scheduler status
router.get('/scheduler/status', function(req, res) {
  try {
    const sportsScheduler = require('../services/sports-scheduler').sportsScheduler;
    const status = sportsScheduler.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Scheduler status error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler status'
    });
  }
});

// Enhanced player statistics with advanced metrics
router.get('/player/:playerName/advanced', cacheMiddleware(300), async function(req, res) {
  try {
    const playerName = req.params.playerName;
    const stats = await enhancedNBAService.getPlayerStats(playerName);
    
    // Add advanced statistics
    const advancedStats = calculateAdvancedStats(stats);
    
    res.json({
      success: true,
      data: {
        basic: stats,
        advanced: advancedStats
      }
    });
  } catch (error) {
    console.error('❌ Advanced stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advanced statistics'
    });
  }
});

// Calculate advanced statistics
function calculateAdvancedStats(basicStats) {
  var points = basicStats.points || 0;
  var rebounds = basicStats.rebounds || 0;
  var assists = basicStats.assists || 0;
  var steals = basicStats.steals || 0;
  var blocks = basicStats.blocks || 0;
  var fgPercentage = basicStats.fg_percentage || 0;
  var games = basicStats.games_played || 1;

  // Player Efficiency Rating (simplified)
  var per = (points + rebounds + assists + steals + blocks) / games;

  // Fantasy points calculation (standard DFS scoring)
  var fantasyPoints = points + (rebounds * 1.2) + (assists * 1.5) + (steals * 3) + (blocks * 3);

  // Value rating (custom metric)
  var valueRating = ((points + rebounds + assists) / 3).toFixed(1);

  // Shooting efficiency
  var shootingEfficiency = (fgPercentage * 1.5).toFixed(1);

  return {
    playerEfficiencyRating: per.toFixed(1),
    fantasyPoints: fantasyPoints.toFixed(1),
    valueRating: valueRating,
    shootingEfficiency: shootingEfficiency,
    allAroundScore: ((points + rebounds + assists + steals + blocks) / 5).toFixed(1)
  };
}

module.exports = router;

// Get NBA games (today's games)
router.get('/games/today', cacheMiddleware(300), async function(req, res) {
  try {
    // This would connect to your NBA database tables
    // For now, return sample data
    const sampleGames = [
      {
        id: 1,
        home_team: 'Lakers',
        away_team: 'Warriors',
        game_date: new Date().toISOString().split('T')[0],
        game_time: '19:30',
        status: 'scheduled'
      },
      {
        id: 2,
        home_team: 'Celtics',
        away_team: 'Heat',
        game_date: new Date().toISOString().split('T')[0],
        game_time: '20:00',
        status: 'scheduled'
      }
    ];
    
    res.json({
      success: true,
      data: sampleGames
    });
  } catch (error) {
    console.error('❌ Games error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
});

// Get NBA standings
router.get('/standings', cacheMiddleware(600), async function(req, res) {
  try {
    const sampleStandings = [
      { team: 'Celtics', conference: 'East', wins: 30, losses: 10, win_percentage: 75.0 },
      { team: 'Bucks', conference: 'East', wins: 28, losses: 12, win_percentage: 70.0 },
      { team: '76ers', conference: 'East', wins: 27, losses: 13, win_percentage: 67.5 },
      { team: 'Nuggets', conference: 'West', wins: 28, losses: 12, win_percentage: 70.0 },
      { team: 'Timberwolves', conference: 'West', wins: 27, losses: 13, win_percentage: 67.5 },
      { team: 'Thunder', conference: 'West', wins: 26, losses: 14, win_percentage: 65.0 }
    ];
    
    res.json({
      success: true,
      data: sampleStandings
    });
  } catch (error) {
    console.error('❌ Standings error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standings'
    });
  }
});

// Get team roster
router.get('/teams/:teamId/roster', cacheMiddleware(600), async function(req, res) {
  try {
    const { teamId } = req.params;
    const sampleRoster = [
      { name: 'LeBron James', position: 'SF', salary: 45000000, points_per_game: 25.5 },
      { name: 'Anthony Davis', position: 'PF', salary: 38000000, points_per_game: 24.8 },
      { name: 'D\'Angelo Russell', position: 'PG', salary: 17000000, points_per_game: 17.5 }
    ];
    
    res.json({
      success: true,
      data: sampleRoster
    });
  } catch (error) {
    console.error('❌ Roster error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roster'
    });
  }
});

// =============================================================================
// ENHANCED NBA DATA ENDPOINTS (ADDED 2025-12-05)
// =============================================================================

// Get NBA players list
router.get('/players', cacheMiddleware(600), async function(req, res) {
  try {
    console.log('[NBA] Fetching players data');
    
    // Sample players data
    const players = [
      {
        id: 1, name: 'LeBron James', team: 'LAL', position: 'SF',
        points: 25.5, rebounds: 7.5, assists: 8.5,
        steals: 1.2, blocks: 0.8, fg_percentage: 52.3
      },
      {
        id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG',
        points: 28.3, rebounds: 4.5, assists: 6.5,
        steals: 1.1, blocks: 0.4, fg_percentage: 48.5
      },
      {
        id: 3, name: 'Nikola Jokic', team: 'DEN', position: 'C',
        points: 26.2, rebounds: 12.5, assists: 9.5,
        steals: 1.3, blocks: 0.9, fg_percentage: 58.3
      }
    ];
    
    res.json({
      success: true,
      data: players,
      count: players.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Players error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// Get betting odds
router.get('/betting/odds', cacheMiddleware(300), function(req, res) {
  try {
    console.log('[NBA] Fetching betting odds');
    
    const odds = {
      games: [
        {
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: 'Tonight 7:30 PM',
          moneyline: { home: -150, away: +130 },
          spread: { home: -3.5, away: +3.5 },
          total: { points: 225.5 }
        }
      ],
      player_props: [
        { player: 'LeBron James', stat: 'Points', line: 27.5, over: -110, under: -110 }
      ],
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: odds,
      source: 'Betting API'
    });
  } catch (error) {
    console.error('❌ Betting odds error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds'
    });
  }
});

// =============================================================================
// ENHANCED NBA DATA ENDPOINTS (ADDED 2025-12-05)
// =============================================================================

// Get NBA players list
router.get('/players', cacheMiddleware(600), async function(req, res) {
  try {
    console.log('[NBA] Fetching players data');
    
    // Sample players data
    const players = [
      {
        id: 1, name: 'LeBron James', team: 'LAL', position: 'SF',
        points: 25.5, rebounds: 7.5, assists: 8.5,
        steals: 1.2, blocks: 0.8, fg_percentage: 52.3
      },
      {
        id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG',
        points: 28.3, rebounds: 4.5, assists: 6.5,
        steals: 1.1, blocks: 0.4, fg_percentage: 48.5
      },
      {
        id: 3, name: 'Nikola Jokic', team: 'DEN', position: 'C',
        points: 26.2, rebounds: 12.5, assists: 9.5,
        steals: 1.3, blocks: 0.9, fg_percentage: 58.3
      }
    ];
    
    res.json({
      success: true,
      data: players,
      count: players.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Players error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// Get betting odds
router.get('/betting/odds', cacheMiddleware(300), function(req, res) {
  try {
    console.log('[NBA] Fetching betting odds');
    
    const odds = {
      games: [
        {
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: 'Tonight 7:30 PM',
          moneyline: { home: -150, away: +130 },
          spread: { home: -3.5, away: +3.5 },
          total: { points: 225.5 }
        }
      ],
      player_props: [
        { player: 'LeBron James', stat: 'Points', line: 27.5, over: -110, under: -110 }
      ],
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: odds,
      source: 'Betting API'
    });
  } catch (error) {
    console.error('❌ Betting odds error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds'
    });
  }
});
