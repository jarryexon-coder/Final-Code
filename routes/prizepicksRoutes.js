// routes/prizepicksRoutes.js - UPDATED WITH ANALYTICS AND NFL GAMES
import express from 'express';
const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PrizePicks API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/api/prizepicks',
      analytics: '/api/prizepicks/analytics',
      picks: '/api/prizepicks/picks',
      limits: '/api/prizepicks/limits',
      games: '/api/prizepicks/games',  // Added new endpoint
      'nfl-games': '/api/prizepicks/nfl/games'  // Added NFL-specific endpoint
    }
  });
});

// Analytics endpoint (YOUR FRONTEND IS CALLING THIS)
// PrizePicks Analytics endpoint - RETURNS ARRAY, NOT OBJECT
router.get('/analytics', async (req, res) => {
  try {
    console.log('🎯 Fetching PrizePicks analytics...');
    
    // Your existing data (as object)
    const analyticsData = {
      performance: {
        totalPicks: 1247,
        correctPicks: 721,
        winRate: "57.8%",
        roi: "+12.4%",
        streak: { current: 5, longest: 11 }
      },
      bySport: [
        { sport: "NBA", picks: 512, correct: 302, winRate: "59.0%", roi: "+14.2%" },
        { sport: "NFL", picks: 489, correct: 278, winRate: "56.9%", roi: "+11.8%" },
        { sport: "NHL", picks: 246, correct: 141, winRate: "57.3%", roi: "+10.5%" }
      ],
      topPerformers: [
        { player: "LeBron James", sport: "NBA", accuracy: 0.75, edge: 12.4 },
        { player: "Patrick Mahomes", sport: "NFL", accuracy: 0.72, edge: 10.8 },
        { player: "Connor McDavid", sport: "NHL", accuracy: 0.69, edge: 9.2 }
      ]
    };
    
    // CONVERT OBJECT TO ARRAY
    const allItems = [];
    
    // Add bySport data as array items
    if (analyticsData.bySport && Array.isArray(analyticsData.bySport)) {
      allItems.push(...analyticsData.bySport.map(item => ({
        type: 'sport_performance',
        ...item
      })));
    }
    
    // Add top performers as array items
    if (analyticsData.topPerformers && Array.isArray(analyticsData.topPerformers)) {
      allItems.push(...analyticsData.topPerformers.map(item => ({
        type: 'top_performer',
        ...item
      })));
    }
    
    // Add performance summary as array item
    if (analyticsData.performance) {
      allItems.push({
        type: 'performance_summary',
        ...analyticsData.performance
      });
    }
    
    res.json({
      success: true,
      analytics: allItems,  // ← NOW RETURNS ARRAY
      generatedAt: new Date().toISOString(),
      totalItems: allItems.length,
      summary: {
        totalPicks: analyticsData.performance.totalPicks,
        winRate: analyticsData.performance.winRate,
        roi: analyticsData.performance.roi
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching PrizePicks analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PrizePicks analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/games:
 *   get:
 *     summary: Get sports games for PrizePicks predictions
 *     description: Returns sports games data that can be used for PrizePicks predictions across multiple sports
 *     tags: [PrizePicks]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nfl, nba, mlb, nhl]
 *         description: Filter games by sport
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter games by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, final]
 *         description: Filter games by status
 *     responses:
 *       200:
 *         description: Sports games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    const { sport, date, status } = req.query;
    
    console.log(`🎮 Fetching PrizePicks games, sport: ${sport || 'all'}, date: ${date || 'all'}, status: ${status || 'all'}`);
    
    // TODO: Replace with real data source
    const games = [
      // NBA Games
      {
        id: 'nba_1',
        sport: 'NBA',
        awayTeam: 'Los Angeles Lakers',
        homeTeam: 'Golden State Warriors',
        awayScore: 112,
        homeScore: 108,
        status: 'final',
        quarter: '4th',
        timeRemaining: '0:00',
        stadium: 'Chase Center',
        broadcast: 'ESPN',
        date: '2026-02-01T22:30:00Z',
        spread: -3.5,
        overUnder: 227.5,
        awayTeamRecord: '28-24',
        homeTeamRecord: '30-22'
      },
      {
        id: 'nba_2',
        sport: 'NBA',
        awayTeam: 'Boston Celtics',
        homeTeam: 'Miami Heat',
        awayScore: 0,
        homeScore: 0,
        status: 'scheduled',
        quarter: '1st',
        timeRemaining: '12:00',
        stadium: 'FTX Arena',
        broadcast: 'TNT',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        spread: -6.5,
        overUnder: 215.5,
        awayTeamRecord: '40-12',
        homeTeamRecord: '30-22'
      },
      // NFL Games (from File 1)
      {
        id: 'nfl_1',
        sport: 'NFL',
        awayTeam: 'Kansas City Chiefs',
        homeTeam: 'Baltimore Ravens',
        awayScore: 24,
        homeScore: 27,
        status: 'final',
        quarter: '4th',
        timeRemaining: '0:00',
        stadium: 'M&T Bank Stadium',
        broadcast: 'CBS',
        date: '2026-02-02T20:00:00Z',
        spread: 2.5,
        overUnder: 48.5,
        awayTeamRecord: '12-5',
        homeTeamRecord: '14-3'
      },
      // MLB Games
      {
        id: 'mlb_1',
        sport: 'MLB',
        awayTeam: 'New York Yankees',
        homeTeam: 'Boston Red Sox',
        awayScore: 0,
        homeScore: 0,
        status: 'scheduled',
        inning: '1st',
        outs: 0,
        stadium: 'Fenway Park',
        broadcast: 'ESPN',
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        moneyline: -120,
        overUnder: 8.5,
        awayTeamRecord: '45-35',
        homeTeamRecord: '40-40'
      },
      // NHL Games
      {
        id: 'nhl_1',
        sport: 'NHL',
        awayTeam: 'Toronto Maple Leafs',
        homeTeam: 'Montreal Canadiens',
        awayScore: 3,
        homeScore: 2,
        status: 'final',
        period: '3rd',
        timeRemaining: '0:00',
        stadium: 'Bell Centre',
        broadcast: 'Sportsnet',
        date: '2026-02-01T19:00:00Z',
        puckLine: -1.5,
        overUnder: 6.5,
        awayTeamRecord: '32-20',
        homeTeamRecord: '25-27'
      }
    ];

    // Apply filters
    let filteredGames = games;
    
    if (sport) {
      filteredGames = filteredGames.filter(game => game.sport.toLowerCase() === sport.toLowerCase());
    }
    
    if (status) {
      filteredGames = filteredGames.filter(game => game.status === status);
    }
    
    if (date) {
      const filterDate = new Date(date).toISOString().split('T')[0];
      filteredGames = filteredGames.filter(game => {
        const gameDate = new Date(game.date).toISOString().split('T')[0];
        return gameDate === filterDate;
      });
    }

    // Add PrizePicks-specific data
    const gamesWithPicks = filteredGames.map(game => ({
      ...game,
      prizePicks: {
        available: true,
        popularPicks: [
          { type: 'points', line: game.sport === 'NBA' ? 25.5 : game.sport === 'NFL' ? 275.5 : 3.5 },
          { type: 'assists', line: game.sport === 'NBA' ? 7.5 : game.sport === 'NHL' ? 0.5 : null },
          { type: 'rebounds', line: game.sport === 'NBA' ? 8.5 : null }
        ].filter(pick => pick.line !== null),
        maxEntry: 250,
        entryFee: 10
      }
    }));

    res.json({
      success: true,
      message: 'Sports games for PrizePicks predictions',
      timestamp: new Date().toISOString(),
      games: gamesWithPicks,
      count: gamesWithPicks.length,
      filtersApplied: {
        sport: sport || 'none',
        date: date || 'none',
        status: status || 'none'
      }
    });

  } catch (error) {
    console.error('Error fetching PrizePicks games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/prizepicks/nfl/games:
 *   get:
 *     summary: Get NFL games for PrizePicks predictions
 *     description: Returns NFL game data specifically for PrizePicks NFL predictions
 *     tags: [PrizePicks]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: NFL week number (1-18 for regular season)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter games by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, final]
 *         description: Filter games by status
 *     responses:
 *       200:
 *         description: NFL games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/nfl/games', async (req, res) => {
  try {
    const { week, date, status } = req.query;
    
    console.log(`🏈 Fetching PrizePicks NFL games, week: ${week || 'all'}, date: ${date || 'all'}, status: ${status || 'all'}`);
    
    // TODO: Replace with real data source
    const games = [
      {
        id: '1',
        awayTeam: 'Kansas City Chiefs',
        homeTeam: 'Baltimore Ravens',
        awayScore: 24,
        homeScore: 27,
        status: 'final',
        quarter: '4th',
        timeRemaining: '0:00',
        stadium: 'M&T Bank Stadium',
        broadcast: 'CBS',
        date: '2026-02-02T20:00:00Z',
        week: 20,
        spread: 2.5,
        overUnder: 48.5,
        awayTeamRecord: '12-5',
        homeTeamRecord: '14-3',
        attendance: 71000,
        weather: 'Clear, 42°F'
      },
      {
        id: '2',
        awayTeam: 'San Francisco 49ers',
        homeTeam: 'Detroit Lions',
        awayScore: 34,
        homeScore: 31,
        status: 'final',
        quarter: '4th',
        timeRemaining: '0:00',
        stadium: 'Ford Field',
        broadcast: 'FOX',
        date: '2026-02-01T20:00:00Z',
        week: 20,
        spread: -3.5,
        overUnder: 51.5,
        awayTeamRecord: '13-4',
        homeTeamRecord: '12-5',
        attendance: 65000,
        weather: 'Indoor'
      },
      {
        id: '3',
        awayTeam: 'Buffalo Bills',
        homeTeam: 'Miami Dolphins',
        awayScore: 21,
        homeScore: 14,
        status: 'in_progress',
        quarter: '3rd',
        timeRemaining: '5:43',
        stadium: 'Hard Rock Stadium',
        broadcast: 'ESPN',
        date: new Date().toISOString(),
        week: 18,
        spread: 1.5,
        overUnder: 47.0,
        awayTeamRecord: '11-6',
        homeTeamRecord: '10-7',
        attendance: 65500,
        weather: 'Partly Cloudy, 68°F'
      },
      {
        id: '4',
        awayTeam: 'Dallas Cowboys',
        homeTeam: 'Philadelphia Eagles',
        awayScore: 0,
        homeScore: 0,
        status: 'scheduled',
        quarter: '1st',
        timeRemaining: '15:00',
        stadium: 'Lincoln Financial Field',
        broadcast: 'NBC',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        week: 18,
        spread: -2.5,
        overUnder: 49.0,
        awayTeamRecord: '10-7',
        homeTeamRecord: '11-6',
        attendance: 69500,
        weather: 'Rain, 45°F'
      },
      {
        id: '5',
        awayTeam: 'Green Bay Packers',
        homeTeam: 'Chicago Bears',
        awayScore: 0,
        homeScore: 0,
        status: 'scheduled',
        quarter: '1st',
        timeRemaining: '15:00',
        stadium: 'Soldier Field',
        broadcast: 'FOX',
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        week: 18,
        spread: -6.5,
        overUnder: 44.5,
        awayTeamRecord: '9-8',
        homeTeamRecord: '7-10',
        attendance: 61500,
        weather: 'Cold, 28°F'
      }
    ];

    // Apply filters
    let filteredGames = games;
    
    if (week) {
      filteredGames = filteredGames.filter(game => game.week === parseInt(week));
    }
    
    if (status) {
      filteredGames = filteredGames.filter(game => game.status === status);
    }
    
    if (date) {
      const filterDate = new Date(date).toISOString().split('T')[0];
      filteredGames = filteredGames.filter(game => {
        const gameDate = new Date(game.date).toISOString().split('T')[0];
        return gameDate === filterDate;
      });
    }

    // Add PrizePicks-specific NFL data
    const gamesWithPicks = filteredGames.map(game => ({
      ...game,
      prizePicks: {
        sport: 'NFL',
        available: true,
        playerProps: [
          { player: 'Patrick Mahomes', type: 'passingYards', line: 275.5, odds: -110 },
          { player: 'Lamar Jackson', type: 'rushingYards', line: 65.5, odds: -115 },
          { player: 'Travis Kelce', type: 'receivingYards', line: 72.5, odds: -110 },
          { player: 'Christian McCaffrey', type: 'rushingYards', line: 85.5, odds: -115 }
        ],
        popularParlays: [
          { name: 'QB Double', description: 'Mahomes 250+ yards & Jackson 50+ rushing', odds: +250 },
          { name: 'TD Scorer', description: 'Any WR to score 2+ TDs', odds: +400 }
        ],
        maxEntry: 250,
        entryFee: 10,
        featured: game.week >= 20 // Playoff games are featured
      }
    }));

    res.json({
      success: true,
      message: 'NFL games for PrizePicks predictions',
      timestamp: new Date().toISOString(),
      games: gamesWithPicks,
      count: gamesWithPicks.length,
      filtersApplied: {
        week: week || 'none',
        date: date || 'none',
        status: status || 'none'
      }
    });

  } catch (error) {
    console.error('Error fetching NFL games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFL games',
      message: error.message
    });
  }
});

// Other endpoints (if you have them)
router.get('/picks', (req, res) => {
  res.json({
    success: true,
    picks: [],
    count: 0,
    timestamp: new Date().toISOString()
  });
});

router.get('/limits', (req, res) => {
  res.json({
    success: true,
    limits: [],
    timestamp: new Date().toISOString()
  });
});

export default router;
