// routes/kalshiRoutes.js - Updated version with API Key implementation and JSDoc
import express from 'express';
const router = express.Router();

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
