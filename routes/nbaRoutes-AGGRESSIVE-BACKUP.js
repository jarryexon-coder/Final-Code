import express from 'express';
const router = express.Router();
import enhancedNBAService from '../services/enhancedNBAService.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';
import { sportsScheduler } from '../services/sports-scheduler.js';
import RealDataService from '../services/realDataService.js';
import axios from 'axios';

const realDataService = new RealDataService();

// ====================
// DELAYED SCHEDULER INITIALIZATION
// ====================
let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  
  console.log('⏳ Delaying scheduler start by 30 seconds...');
  setTimeout(() => {
    console.log('🚀 Starting NBA Scheduler...');
    // Your scheduler code here
    
    // Start the sports scheduler if available
    if (sportsScheduler && typeof sportsScheduler.start === 'function') {
      sportsScheduler.start();
    }
    
    // Initialize any other scheduler tasks here
    // e.g., schedule data refreshes, cache updates, etc.
  }, 30000); // 30 second delay
}

// Async initialization method for server.js to call
export async function initialize() {
  console.log('🏀 NBA Routes initializing...');
  
  // Start the scheduler with delay
  startScheduler();
  
  // Add any other async initialization here
  console.log('✅ NBA Routes initialized (scheduler will start in 30s)');
}

// ====================
// ROUTES
// ====================

// Real NBA games endpoint with caching and fallback (from File 1)
router.get('/games', cacheMiddleware('5 minutes'), async (req, res) => {
  try {
    const { date } = req.query;
    const games = await realDataService.getRealNBAGames(date ? new Date(date) : new Date());
    
    if (games) {
      res.json({
        success: true,
        data: games,
        source: 'realtime_api'
      });
    } else {
      // Fallback to database cache
      const cachedGames = await req.app.locals.db.collection('games')
        .find({ sport: 'NBA', date: { $gte: new Date(new Date().setHours(0,0,0,0)) } })
        .toArray();
      res.json({
        success: true,
        games: cachedGames,
        source: 'database_cache',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ NBA games error:', error.message);
    // Fallback to sample data from File 2
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
      data: sampleGames,
      source: 'fallback_sample'
    });
  }
});

// Get NBA games (today's games) - enhanced version (from File 2)
router.get('/games/today', cacheMiddleware(300), async (req, res) => {
  try {
    // Try to get real data first
    const games = await realDataService.getRealNBAGames(new Date());
    
    if (games && games.length > 0) {
      return res.json({
        success: true,
        data: games,
        source: 'realtime_api'
      });
    }
    
    // Fallback to database
    const cachedGames = await req.app.locals.db.collection('games')
      .find({ 
        sport: 'NBA', 
        date: { 
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lt: new Date(new Date().setHours(23,59,59,999))
        } 
      })
      .toArray();
      
    if (cachedGames && cachedGames.length > 0) {
      return res.json({
        success: true,
        data: cachedGames,
        source: 'database_cache'
      });
    }
    
    // Final fallback to sample data
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
      data: sampleGames,
      source: 'fallback_sample'
    });
  } catch (error) {
    console.error('❌ Games error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
});

// Real NBA standings with caching (from File 1)
router.get('/standings', cacheMiddleware('1 hour'), async (req, res) => {
  try {
    const standings = await realDataService.getRealNBAStandings();
    if (standings) {
      // Cache in database
      await req.app.locals.db.collection('standings')
        .updateOne(
          { sport: 'NBA' },
          { $set: { ...standings, updatedAt: new Date() } },
          { upsert: true }
        );
      res.json({
        success: true,
        data: standings,
        source: 'realtime_api'
      });
    } else {
      const cached = await req.app.locals.db.collection('standings')
        .findOne({ sport: 'NBA' });
        
      if (cached) {
        res.json({
          success: true,
          data: cached,
          source: 'database_cache'
        });
      } else {
        // Fallback to sample data from File 2
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
          data: sampleStandings,
          source: 'fallback_sample'
        });
      }
    }
  } catch (error) {
    console.error('❌ Standings error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standings'
    });
  }
});

// Real player stats with sportsdata.io API (from File 1)
router.get('/players/:playerId/stats', cacheMiddleware('30 minutes'), async (req, res) => {
  try {
    const { playerId } = req.params;
    const { season } = req.query;
    
    const response = await axios.get(
      `https://api.sportsdata.io/v3/nba/stats/json/PlayerGameStatsByPlayer/${season || '2024'}/${playerId}`,
      { 
        headers: { 
          'Ocp-Apim-Subscription-Key': process.env.SPORTSDATA_API_KEY || 'demo-key'
        },
        timeout: 5000
      }
    );
    
    res.json({
      success: true,
      playerId,
      stats: response.data,
      season: season || '2024',
      source: 'sportsdata.io'
    });
  } catch (error) {
    console.error('❌ Player stats error:', error.message);
    
    // Fallback to enhanced service
    try {
      const playerName = req.params.playerName || 'LeBron James';
      const stats = await enhancedNBAService.getPlayerStats(playerName);
      
      res.json({
        success: true,
        playerId,
        stats: stats,
        season: season || '2024',
        source: 'fallback_enhanced_service'
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch player stats from all sources' 
      });
    }
  }
});

// Get player stats with real BallDon'tLie API (from File 2)
router.get('/player/:playerName', cacheMiddleware(300), async (req, res) => {
  try {
    const playerName = req.params.playerName;
    console.log('🎯 Fetching stats for player:', playerName);

    const stats = await enhancedNBAService.getPlayerStats(playerName);

    res.json({
      success: true,
      data: stats,
      source: 'ball_dont_lie_api'
    });
  } catch (error) {
    console.error('❌ Player stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player statistics'
    });
  }
});

// Get betting odds from your scheduler (from File 2)
router.get('/betting/odds', cacheMiddleware(300), (req, res) => {
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

// Get player props from your scheduler (from File 2)
router.get('/betting/player-props', cacheMiddleware(600), (req, res) => {
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

// Get predictions from your scheduler (from File 2)
router.get('/betting/predictions', cacheMiddleware(600), (req, res) => {
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

// Get scheduler status (from File 2)
router.get('/scheduler/status', (req, res) => {
  try {
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

// Enhanced player statistics with advanced metrics (from File 2)
router.get('/player/:playerName/advanced', cacheMiddleware(300), async (req, res) => {
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
      },
      source: 'ball_dont_lie_api_with_enhancements'
    });
  } catch (error) {
    console.error('❌ Advanced stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advanced statistics'
    });
  }
});

// Calculate advanced statistics (from File 2)
function calculateAdvancedStats(basicStats) {
  const points = basicStats.points || 0;
  const rebounds = basicStats.rebounds || 0;
  const assists = basicStats.assists || 0;
  const steals = basicStats.steals || 0;
  const blocks = basicStats.blocks || 0;
  const fgPercentage = basicStats.fg_percentage || 0;
  const games = basicStats.games_played || 1;

  // Player Efficiency Rating (simplified)
  const per = (points + rebounds + assists + steals + blocks) / games;

  // Fantasy points calculation (standard DFS scoring)
  const fantasyPoints = points + (rebounds * 1.2) + (assists * 1.5) + (steals * 3) + (blocks * 3);

  // Value rating (custom metric)
  const valueRating = ((points + rebounds + assists) / 3).toFixed(1);

  // Shooting efficiency
  const shootingEfficiency = (fgPercentage * 1.5).toFixed(1);

  return {
    playerEfficiencyRating: per.toFixed(1),
    fantasyPoints: fantasyPoints.toFixed(1),
    valueRating: valueRating,
    shootingEfficiency: shootingEfficiency,
    allAroundScore: ((points + rebounds + assists + steals + blocks) / 5).toFixed(1)
  };
}

// Get team roster (from File 2)
router.get('/teams/:teamId/roster', cacheMiddleware(600), async (req, res) => {
  try {
    const { teamId } = req.params;
    const sampleRoster = [
      { name: 'LeBron James', position: 'SF', salary: 45000000, points_per_game: 25.5 },
      { name: 'Anthony Davis', position: 'PF', salary: 38000000, points_per_game: 24.8 },
      { name: 'D\'Angelo Russell', position: 'PG', salary: 17000000, points_per_game: 17.5 }
    ];
    
    res.json({
      success: true,
      data: sampleRoster,
      source: 'sample_data'
    });
  } catch (error) {
    console.error('❌ Roster error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roster'
    });
  }
});

export default router;
