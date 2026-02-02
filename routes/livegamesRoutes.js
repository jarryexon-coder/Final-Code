import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "livegames API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

console.log('🎮 Live games routes loaded');

/**
 * @swagger
 * /api/livegames/live:
 *   get:
 *     summary: Get live games data
 *     description: Retrieve real-time data for currently active games across multiple sports
 *     tags: [Live Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB, all]
 *           default: 'all'
 *         description: Filter by specific sport
 *       - in: query
 *         name: include_betting
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include live betting odds data
 *       - in: query
 *         name: include_play_by_play
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent play-by-play data
 *       - in: query
 *         name: update_frequency
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 5
 *           maximum: 300
 *         description: Suggested update frequency in seconds
 *     responses:
 *       200:
 *         description: Live games data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LiveGames'
 *                 count:
 *                   type: integer
 *                 breakdown:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 note:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/live', async (req, res) => {
  console.log('🎮 /api/games/live called');
  
  try {
    // Create realistic live games data
    const liveGames = {
      nba: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'LAL',
            name: 'Los Angeles Lakers',
            score: 108,
            color: '#552583',
            record: '35-30'
          },
          awayTeam: {
            abbreviation: 'GSW',
            name: 'Golden State Warriors',
            score: 105,
            color: '#1D428A',
            record: '33-30'
          },
          status: 'live',
          clock: '2:14',
          period: '4th Qtr',
          timeRemaining: '2:14',
          lastPlay: 'LeBron James makes 2pt driving layup',
          arena: 'Crypto.com Arena',
          attendance: '18997',
          broadcast: 'ESPN',
          gameId: 'nba-live-001',
          league: 'NBA',
          date: new Date().toISOString(),
          betting: {
            spread: 'GSW -4.5',
            overUnder: '225.5',
            moneylineHome: '+180',
            moneylineAway: '-220'
          }
        },
        {
          id: 2,
          homeTeam: {
            abbreviation: 'BOS',
            name: 'Boston Celtics',
            score: 95,
            color: '#007A33',
            record: '48-13'
          },
          awayTeam: {
            abbreviation: 'MIA',
            name: 'Miami Heat',
            score: 89,
            color: '#98002E',
            record: '35-29'
          },
          status: 'live',
          clock: '5:42',
          period: '3rd Qtr',
          timeRemaining: '5:42',
          lastPlay: 'Jayson Tatum makes 3pt jump shot',
          arena: 'TD Garden',
          attendance: '19156',
          broadcast: 'TNT',
          gameId: 'nba-live-002',
          league: 'NBA',
          date: new Date().toISOString(),
          betting: {
            spread: 'BOS -8.5',
            overUnder: '218.5',
            moneylineHome: '-350',
            moneylineAway: '+280'
          }
        }
      ],
      nhl: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'BOS',
            name: 'Boston Bruins',
            score: 3,
            color: '#FFB81C',
            record: '38-14-14'
          },
          awayTeam: {
            abbreviation: 'TOR',
            name: 'Toronto Maple Leafs',
            score: 2,
            color: '#00205B',
            record: '37-19-8'
          },
          status: 'live',
          clock: '10:45',
          period: '3rd',
          timeRemaining: '10:45',
          lastPlay: 'Pastrnak scores (3-2)',
          arena: 'TD Garden',
          attendance: '17565',
          broadcast: 'ESPN+',
          gameId: 'nhl-live-001',
          league: 'NHL',
          date: new Date().toISOString(),
          shotsOnGoal: {
            home: 28,
            away: 24
          },
          powerPlay: {
            home: '1/3',
            away: '0/2'
          }
        }
      ],
      nfl: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'KC',
            name: 'Kansas City Chiefs',
            score: 24,
            color: '#E31837',
            record: '11-6'
          },
          awayTeam: {
            abbreviation: 'SF',
            name: 'San Francisco 49ers',
            score: 21,
            color: '#AA0000',
            record: '12-5'
          },
          status: 'live',
          clock: '4:30',
          period: '4th',
          quarter: '4th',
          timeRemaining: '4:30',
          lastPlay: 'Mahomes pass complete to Kelce for 8 yards',
          arena: 'Arrowhead Stadium',
          attendance: '76416',
          broadcast: 'FOX',
          gameId: 'nfl-live-001',
          league: 'NFL',
          date: new Date().toISOString(),
          downDistance: '3rd & 2',
          possession: 'KC',
          yardLine: 'SF 42'
        }
      ],
      updated: new Date().toISOString(),
      totalLiveGames: 4
    };
    
    // Apply sport filter if specified
    const { sport } = req.query;
    if (sport && sport.toLowerCase() !== 'all') {
      const filteredGames = {};
      const sportKey = sport.toLowerCase();
      if (liveGames[sportKey]) {
        filteredGames[sportKey] = liveGames[sportKey];
        filteredGames.updated = liveGames.updated;
        filteredGames.totalLiveGames = liveGames[sportKey].length;
        
        // Count total games
        const totalGames = filteredGames[sportKey].length;
        
        res.json({
          success: true,
          data: filteredGames,
          count: totalGames,
          breakdown: {
            [sportKey]: filteredGames[sportKey].length
          },
          timestamp: new Date().toISOString(),
          note: 'mock-data-for-development'
        });
        return;
      }
    }
    
    // Count total games
    const totalGames = liveGames.nba.length + liveGames.nhl.length + liveGames.nfl.length;
    
    res.json({
      success: true,
      data: liveGames,
      count: totalGames,
      breakdown: {
        nba: liveGames.nba.length,
        nhl: liveGames.nhl.length,
        nfl: liveGames.nfl.length
      },
      timestamp: new Date().toISOString(),
      note: 'mock-data-for-development'
    });
    
  } catch (error) {
    console.error('Error in /api/games/live:', error);
    
    // Even on error, return structured response to prevent frontend crashes
    res.json({
      success: true,
      data: {
        nba: [],
        nhl: [],
        nfl: [],
        updated: new Date().toISOString(),
        totalLiveGames: 0
      },
      count: 0,
      timestamp: new Date().toISOString(),
      note: 'error-recovery-mode'
    });
  }
});

/**
 * @swagger
 * /api/livegames/games:
 *   get:
 *     summary: Get live games with detailed data
 *     description: Retrieve live games with comprehensive real-time statistics and updates
 *     tags: [Live Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter games
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [live, final, scheduled]
 *         description: Filter by game status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: include_detailed_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include detailed real-time statistics
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: Live games with detailed data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveGameDetail'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, status, date, include_detailed_stats, limit } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await LiveGamesService.getLiveGames(sport, status, date, include_detailed_stats, limit);
    
    res.json({
      success: true,
      message: 'Games endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching live games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/livegames/games/{id}:
 *   get:
 *     summary: Get specific live game details
 *     description: Retrieve detailed real-time information for a specific live game
 *     tags: [Live Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_play_by_play
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include play-by-play data
 *       - in: query
 *         name: include_box_score
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include box score data
 *       - in: query
 *         name: include_momentum
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include momentum analysis
 *     responses:
 *       200:
 *         description: Detailed live game data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LiveGameFullDetail'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_play_by_play, include_box_score, include_momentum } = req.query;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching live game details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/livegames/players:
 *   get:
 *     summary: Get player performance in live games
 *     description: Retrieve real-time player statistics for currently active games
 *     tags: [Live Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter players
 *       - in: query
 *         name: game_id
 *         schema:
 *           type: string
 *         description: Filter by specific game
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'current'
 *           enum: [current, projected, season]
 *         description: Type of statistics to include
 *     responses:
 *       200:
 *         description: Live player performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LivePlayerStats'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, game_id, team_id, stat_type } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching live player stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/livegames/teams:
 *   get:
 *     summary: Get team performance in live games
 *     description: Retrieve real-time team statistics for currently active games
 *     tags: [Live Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter teams
 *       - in: query
 *         name: game_id
 *         schema:
 *           type: string
 *         description: Filter by specific game
 *       - in: query
 *         name: include_momentum
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include momentum and run analysis
 *       - in: query
 *         name: include_efficiency
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include efficiency metrics
 *     responses:
 *       200:
 *         description: Live team performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveTeamStats'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, game_id, include_momentum, include_efficiency } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching live team stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/livegames/stats:
 *   get:
 *     summary: Get comprehensive live game statistics
 *     description: Retrieve aggregated real-time statistical data across live games
 *     tags: [Live Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to get stats for
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'game'
 *           enum: [game, quarter, half, period]
 *         description: Statistical period to analyze
 *       - in: query
 *         name: include_trends
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include statistical trends
 *       - in: query
 *         name: include_comparisons
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include comparisons to season averages
 *     responses:
 *       200:
 *         description: Comprehensive live game statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveGameStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, stat_type, include_trends, include_comparisons } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching live game stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
