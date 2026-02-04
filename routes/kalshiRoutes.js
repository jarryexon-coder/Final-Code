// routes/kalshiRoutes.js - Updated version with API Key implementation and JSDoc
import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "kalshi API",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/health",
      "/games",
      "/games/:id",
      "/players", 
      "/teams",
      "/stats",
      "/markets",
      "/news",
      "/markets/:id",
      "/nfl/games"  // Added new endpoint
    ]
  });
});

/**
 * @swagger
 * /api/kalshi/health:
 *   get:
 *     summary: Check Kalshi API health status
 *     description: Returns the health status of the Kalshi API service
 *     tags: [Kalshi]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/health', (req, res) => {
  console.log('🔍 Kalshi health check called');
  res.json({
    success: true,
    status: 'healthy',
    service: 'Kalshi API',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/kalshi/games:
 *   get:
 *     summary: Get Kalshi prediction market games
 *     description: Fetch available games from Kalshi prediction markets using KALSHI-ACCESS-KEY
 *     tags: [Kalshi]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of games to return
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi API access key
 *     responses:
 *       200:
 *         description: List of games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 */
router.get('/games', async (req, res) => {
  const { limit = 5 } = req.query;
  const apiKey = req.headers['kalshi-access-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'KALSHI-ACCESS-KEY header is required'
    });
  }
  
  console.log(`📊 Fetching Kalshi games with API key, limit: ${limit}`);
  
  // Mock implementation with API key validation
  const games = Array.from({ length: parseInt(limit) }, (_, i) => ({
    id: `game_${i + 1}`,
    title: `Game ${i + 1}: ${['Team A vs Team B', 'Team C vs Team D', 'Team E vs Team F'][i % 3]}`,
    description: `Prediction market for ${['NBA', 'NFL', 'MLB'][i % 3]} game`,
    category: 'Sports',
    volume: Math.floor(Math.random() * 1000000),
    yesPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    noPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    closeDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    status: ['open', 'closed', 'settled'][i % 3]
  }));
  
  res.status(200).json({ 
    success: true,
    games: games,
    count: games.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/kalshi/nfl/games:
 *   get:
 *     summary: Get NFL games with scores and status
 *     description: Returns NFL game data including live scores, status, and broadcast information (mock data - replace with real API later)
 *     tags: [Kalshi]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, final]
 *         description: Filter games by status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter games by date (YYYY-MM-DD)
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: false
 *         schema:
 *           type: string
 *         description: Kalshi API access key (optional for this endpoint)
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       awayTeam:
 *                         type: string
 *                       homeTeam:
 *                         type: string
 *                       awayScore:
 *                         type: integer
 *                       homeScore:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, final]
 *                       quarter:
 *                         type: string
 *                       timeRemaining:
 *                         type: string
 *                       stadium:
 *                         type: string
 *                       broadcast:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/nfl/games', async (req, res) => {
  try {
    const { status, date } = req.query;
    const apiKey = req.headers['kalshi-access-key'];
    
    console.log(`🏈 Fetching NFL games, status: ${status || 'all'}, date: ${date || 'all'}`);
    
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
        spread: -6.5,
        overUnder: 44.5,
        awayTeamRecord: '9-8',
        homeTeamRecord: '7-10',
        attendance: 61500,
        weather: 'Cold, 28°F'
      },
      {
        id: '6',
        awayTeam: 'Los Angeles Rams',
        homeTeam: 'Seattle Seahawks',
        awayScore: 28,
        homeScore: 24,
        status: 'final',
        quarter: '4th',
        timeRemaining: '0:00',
        stadium: 'Lumen Field',
        broadcast: 'CBS',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        spread: 3.5,
        overUnder: 46.0,
        awayTeamRecord: '10-7',
        homeTeamRecord: '9-8',
        attendance: 68500,
        weather: 'Rain, 52°F'
      }
    ];

    // Filter by status if provided
    let filteredGames = games;
    if (status) {
      filteredGames = games.filter(game => game.status === status);
    }
    
    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date).toISOString().split('T')[0];
      filteredGames = filteredGames.filter(game => {
        const gameDate = new Date(game.date).toISOString().split('T')[0];
        return gameDate === filterDate;
      });
    }

    // Add Kalshi market data if API key is provided
    if (apiKey) {
      filteredGames = filteredGames.map(game => ({
        ...game,
        kalshiMarket: {
          marketId: `nfl_${game.id}`,
          yesPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
          noPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
          volume: Math.floor(Math.random() * 1000000),
          openInterest: Math.floor(Math.random() * 500000)
        }
      }));
    }

    res.json({
      success: true,
      message: 'NFL games',
      timestamp: new Date().toISOString(),
      games: filteredGames,
      count: filteredGames.length,
      hasKalshiData: !!apiKey,
      note: apiKey ? 'Includes Kalshi market data' : 'Basic game data only'
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

/**
 * @swagger
 * /api/kalshi/games/{id}:
 *   get:
 *     summary: Get specific Kalshi game details
 *     description: Fetch detailed information for a specific game using KALSHI-ACCESS-KEY
 *     tags: [Kalshi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi API access key
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 game:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get('/games/:id', async (req, res) => {
  const { id } = req.params;
  const apiKey = req.headers['kalshi-access-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'KALSHI-ACCESS-KEY header is required'
    });
  }
  
  console.log(`📊 Fetching Kalshi game details for: ${id} with API key`);
  
  const game = {
    id: id,
    title: `Game: Will Team X win?`,
    description: `Detailed game prediction market`,
    category: 'Sports',
    volume: Math.floor(Math.random() * 1000000),
    yesPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    noPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    closeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    details: {
      totalTrades: 1500,
      openInterest: 75000,
      lastTradePrice: 0.65,
      lastTradeTime: new Date().toISOString(),
      participants: 342,
      marketType: 'binary'
    }
  };
  
  res.json({
    success: true,
    game: game,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/kalshi/players:
 *   get:
 *     summary: Get Kalshi market players/participants
 *     description: Fetch players/participants data from Kalshi markets using KALSHI-ACCESS-KEY
 *     tags: [Kalshi]
 *     parameters:
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi API access key
 *     responses:
 *       200:
 *         description: Players data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 players:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 */
router.get('/players', async (req, res) => {
  const apiKey = req.headers['kalshi-access-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'KALSHI-ACCESS-KEY header is required'
    });
  }
  
  console.log('👥 Fetching Kalshi players with API key');
  
  // Mock players data
  const players = [
    {
      id: 'player_1',
      username: 'trader_john',
      totalTrades: 1250,
      winRate: 0.68,
      totalVolume: 500000,
      joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'player_2',
      username: 'market_wizard',
      totalTrades: 890,
      winRate: 0.72,
      totalVolume: 750000,
      joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'player_3',
      username: 'sports_pro',
      totalTrades: 2100,
      winRate: 0.61,
      totalVolume: 1200000,
      joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    players: players,
    count: players.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/kalshi/teams:
 *   get:
 *     summary: Get Kalshi market teams
 *     description: Fetch team data from Kalshi prediction markets using KALSHI-ACCESS-KEY
 *     tags: [Kalshi]
 *     parameters:
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi API access key
 *     responses:
 *       200:
 *         description: Teams data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 */
router.get('/teams', async (req, res) => {
  const apiKey = req.headers['kalshi-access-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'KALSHI-ACCESS-KEY header is required'
    });
  }
  
  console.log('🏀 Fetching Kalshi teams with API key');
  
  // Mock teams data
  const teams = [
    {
      id: 'team_1',
      name: 'Lakers',
      sport: 'Basketball',
      totalMarkets: 45,
      totalVolume: 2500000,
      winProbability: 0.55
    },
    {
      id: 'team_2',
      name: 'Warriors',
      sport: 'Basketball',
      totalMarkets: 38,
      totalVolume: 1800000,
      winProbability: 0.48
    },
    {
      id: 'team_3',
      name: 'Celtics',
      sport: 'Basketball',
      totalMarkets: 42,
      totalVolume: 2200000,
      winProbability: 0.52
    }
  ];
  
  res.status(200).json({
    success: true,
    teams: teams,
    count: teams.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/kalshi/stats:
 *   get:
 *     summary: Get Kalshi market statistics
 *     description: Fetch comprehensive statistics from Kalshi prediction markets using KALSHI-ACCESS-KEY
 *     tags: [Kalshi]
 *     parameters:
 *       - in: header
 *         name: KALSHI-ACCESS-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi API access key
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get('/stats', async (req, res) => {
  const apiKey = req.headers['kalshi-access-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'KALSHI-ACCESS-KEY header is required'
    });
  }
  
  console.log('📈 Fetching Kalshi stats with API key');
  
  // Mock stats data
  const stats = {
    totalMarkets: 1250,
    totalVolume: 50000000,
    activeTraders: 12500,
    totalTrades: 450000,
    averageTradeSize: 111.11,
    mostTradedMarket: 'NBA Championship Winner',
    highestVolumeDay: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dailyStats: {
      today: {
        volume: 1250000,
        trades: 4500,
        newMarkets: 12
      },
      yesterday: {
        volume: 1100000,
        trades: 4200,
        newMarkets: 8
      }
    }
  };
  
  res.status(200).json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Keep existing endpoints for backward compatibility
router.get('/markets', (req, res) => {
  const { limit = 5 } = req.query;
  console.log(`📊 Fetching Kalshi markets, limit: ${limit}`);
  
  const markets = Array.from({ length: parseInt(limit) }, (_, i) => ({
    id: `market_${i + 1}`,
    title: `Market ${i + 1}: Will ${['Team A', 'Team B', 'Team C'][i % 3]} win?`,
    description: `Market description ${i + 1}`,
    category: ['Sports', 'Politics', 'Finance'][i % 3],
    volume: Math.floor(Math.random() * 1000000),
    yesPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    noPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    closeDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  res.status(200).json({ 
    success: true,
    markets: markets,
    count: markets.length,
    timestamp: new Date().toISOString()
  });
});

router.get('/news', (req, res) => {
  console.log('📰 Fetching Kalshi news');
  
  const news = [
    {
      id: 'news_1',
      title: 'Big Market Move on Sports Event',
      summary: 'Significant trading activity detected',
      category: 'Sports',
      publishedAt: new Date().toISOString()
    },
    {
      id: 'news_2',
      title: 'New Prediction Market Launched',
      summary: 'Exciting new market now available',
      category: 'Announcement',
      publishedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'news_3',
      title: 'Weekly Market Recap',
      summary: 'Review of last week\'s trading activity',
      category: 'Analysis',
      publishedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  
  res.status(200).json({ 
    success: true,
    news: news,
    count: news.length,
    timestamp: new Date().toISOString()
  });
});

router.get('/markets/:id', (req, res) => {
  const { id } = req.params;
  console.log(`📊 Fetching Kalshi market details for: ${id}`);
  
  const market = {
    id: id,
    title: `Market: Will Team win?`,
    description: `Detailed market description`,
    category: 'Sports',
    volume: Math.floor(Math.random() * 1000000),
    yesPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    noPrice: (Math.random() * 0.5 + 0.4).toFixed(2),
    closeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    details: {
      totalTrades: 1500,
      openInterest: 75000,
      lastTradePrice: 0.65,
      lastTradeTime: new Date().toISOString()
    }
  };
  
  res.json({
    success: true,
    market: market,
    timestamp: new Date().toISOString()
  });
});

export default router;
