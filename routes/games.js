import express from 'express';
const router = express.Router();
import axios from 'axios';

// API keys from environment
const KALSHI_ACCESS_KEY = process.env.KALSHI_ACCESS_KEY;

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get prediction market games
 *     description: Retrieve list of prediction market games from Kalshi API with optional filters for sport, status, and time
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl, ncaaf, ncaab]
 *           default: nba
 *         description: Sport category to filter games
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, settled]
 *         description: Filter by market status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return (max 100)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter games starting from this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of prediction market games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *       400:
 *         description: Missing or invalid API key
 *       500:
 *         description: Server error or Kalshi API unavailable
 */
router.get('/', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const { sport = 'nba', status, limit = 20, startDate } = req.query;
    
    // Map sport to Kalshi ticker
    const sportTickers = {
      nba: 'NBA',
      nfl: 'NFL',
      mlb: 'MLB',
      nhl: 'NHL',
      ncaaf: 'NCAAMB',
      ncaab: 'NCAAMB'
    };

    const ticker = sportTickers[sport] || 'NBA';
    
    // Build API parameters
    const params = {
      ticker,
      limit: Math.min(parseInt(limit), 100)
    };
    
    if (status) params.status = status;
    if (startDate) {
      const date = new Date(startDate);
      params.open_time_after = date.toISOString();
    }

    // Fetch markets from Kalshi API
    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params
    });

    // Transform Kalshi markets to game format
    const games = (response.data.markets || []).map(market => ({
      id: market.market_id,
      title: market.title,
      description: market.description,
      sport: market.ticker,
      category: market.category,
      status: market.status,
      openTime: market.open_time,
      closeTime: market.close_time,
      settlementTime: market.settlement_time,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      openInterest: market.open_interest,
      lastPrice: market.last_price,
      marketUrl: market.market_url,
      rules: market.rules,
      settlementDetails: market.settlement_details
    }));

    res.json({
      success: true,
      count: games.length,
      games,
      sport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kalshi games API error:', error.message);
    
    // Fallback to mock data
    const mockGames = getMockGames();
    
    res.json({
      success: true,
      count: mockGames.length,
      games: mockGames,
      message: 'Using fallback games data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Get specific game details
 *     description: Retrieve detailed information about a specific prediction market game including pricing, volume, and settlement details
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi Market ID
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
 *                   $ref: '#/components/schemas/GameDetail'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const gameId = req.params.id;
    
    // Fetch specific market from Kalshi API
    const response = await axios.get(`https://api.kalshi.com/trade-api/v2/markets/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      }
    });

    const market = response.data.market;

    res.json({
      success: true,
      game: {
        id: market.market_id,
        title: market.title,
        description: market.description,
        sport: market.ticker,
        category: market.category,
        status: market.status,
        createdTime: market.created_time,
        openTime: market.open_time,
        closeTime: market.close_time,
        settlementTime: market.settlement_time,
        settlementDetails: market.settlement_details,
        yesPrice: market.yes_price,
        noPrice: market.no_price,
        volume: market.volume,
        openInterest: market.open_interest,
        lastTradePrice: market.last_price,
        lastTradeTime: market.last_trade_time,
        marketUrl: market.market_url,
        rules: market.rules,
        minTickSize: market.min_tick_size,
        minPrice: market.min_price,
        maxPrice: market.max_price,
        orderBook: market.order_book || null,
        timeSeries: market.time_series || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kalshi game detail API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      game: getMockGameDetail(req.params.id),
      message: 'Using fallback game detail data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/games/players:
 *   get:
 *     summary: Get player prediction markets
 *     description: Retrieve prediction markets focused on individual player performances and statistics
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: player
 *         schema:
 *           type: string
 *         description: Filter by player name (supports partial match)
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *           default: nba
 *         description: Sport category filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of player markets to return
 *     responses:
 *       200:
 *         description: List of player prediction markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerMarket'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const { player, sport = 'nba', limit = 20 } = req.query;
    
    const params = {
      category: 'player-performance',
      ticker: sport.toUpperCase(),
      limit: Math.min(parseInt(limit), 100)
    };
    
    if (player) params.search = player;

    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params
    });

    const players = (response.data.markets || []).map(market => ({
      marketId: market.market_id,
      playerName: extractPlayerName(market.title),
      sport: market.ticker,
      question: market.question || market.title,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      closeTime: market.close_time,
      marketUrl: market.market_url,
      status: market.status
    }));

    res.json({
      success: true,
      count: players.length,
      players: players.slice(0, parseInt(limit)),
      sport,
      filter: { player },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kalshi players API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      players: getMockPlayers(),
      count: 2,
      message: 'Using fallback players data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/games/teams:
 *   get:
 *     summary: Get team prediction markets
 *     description: Retrieve prediction markets focused on team performances, outcomes, and season results
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *         description: Filter by team name or abbreviation
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *           default: nba
 *         description: Sport category filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of team markets to return
 *     responses:
 *       200:
 *         description: List of team prediction markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamMarket'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const { team, sport = 'nba', limit = 20 } = req.query;
    
    const params = {
      category: 'team-performance',
      ticker: sport.toUpperCase(),
      limit: Math.min(parseInt(limit), 100)
    };
    
    if (team) params.search = team;

    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params
    });

    const teams = (response.data.markets || []).map(market => ({
      marketId: market.market_id,
      team: extractTeamName(market.title),
      sport: market.ticker,
      question: market.question || market.title,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      closeTime: market.close_time,
      marketUrl: market.market_url,
      status: market.status
    }));

    res.json({
      success: true,
      count: teams.length,
      teams: teams.slice(0, parseInt(limit)),
      sport,
      filter: { team },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kalshi teams API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      teams: getMockTeams(),
      count: 2,
      message: 'Using fallback teams data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/games/stats:
 *   get:
 *     summary: Get market statistics
 *     description: Retrieve Kalshi market statistics including volume trends, popular markets, and performance metrics across different categories
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, all]
 *           default: 7d
 *         description: Time frame for statistics calculation
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl, all]
 *           default: all
 *         description: Sport category to filter statistics
 *     responses:
 *       200:
 *         description: Market statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   $ref: '#/components/schemas/MarketStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const { timeFrame = '7d', category = 'all' } = req.query;
    
    // Fetch all markets for statistics
    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        limit: 200
      }
    });

    const allMarkets = response.data.markets || [];
    
    // Filter by category if not 'all'
    const filteredMarkets = category === 'all' 
      ? allMarkets 
      : allMarkets.filter(market => market.ticker === category.toUpperCase());

    // Calculate statistics
    const totalVolume = filteredMarkets.reduce((sum, market) => sum + (market.volume || 0), 0);
    const totalMarkets = filteredMarkets.length;
    const avgVolume = totalMarkets > 0 ? Math.round(totalVolume / totalMarkets) : 0;
    
    // Find top markets
    const topByVolume = [...filteredMarkets]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 5);
    
    const topByInterest = [...filteredMarkets]
      .sort((a, b) => (b.open_interest || 0) - (a.open_interest || 0))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        timeFrame,
        category,
        totalMarkets,
        totalVolume,
        avgVolume,
        topMarketsByVolume: topByVolume.map(m => ({
          id: m.market_id,
          title: m.title,
          volume: m.volume,
          yesPrice: m.yes_price
        })),
        topMarketsByInterest: topByInterest.map(m => ({
          id: m.market_id,
          title: m.title,
          openInterest: m.open_interest,
          yesPrice: m.yes_price
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kalshi stats API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      stats: getMockStats(req.query),
      message: 'Using fallback stats data',
      timestamp: new Date().toISOString()
    });
  }
});

// ============= ORIGINAL ENDPOINTS WITH UPDATES ============= //

/**
 * @swagger
 * /api/games/test:
 *   get:
 *     summary: Test games endpoint
 *     description: Test endpoint to verify games API functionality with sample data
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Test endpoint working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'games test endpoint',
    success: true,
    data: {
      sample: 'Test data',
      count: 100,
      active: true,
      kalshiConnected: !!KALSHI_ACCESS_KEY,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/games/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health status of the games API service and Kalshi connectivity
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Service status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                 kalshiStatus:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', async (req, res) => {
  let kalshiStatus = 'disconnected';
  
  if (KALSHI_ACCESS_KEY) {
    try {
      // Test Kalshi connectivity
      await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
        headers: {
          'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`
        },
        params: { limit: 1 }
      });
      kalshiStatus = 'connected';
    } catch (error) {
      kalshiStatus = 'error';
    }
  }
  
  res.json({
    service: 'games',
    status: 'healthy',
    kalshiStatus,
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
});

/**
 * @swagger
 * /api/games/live:
 *   get:
 *     summary: Get live prediction markets
 *     description: Retrieve currently active (open) prediction markets that are accepting trades
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *           default: nba
 *         description: Sport to filter live markets
 *     responses:
 *       200:
 *         description: List of live prediction markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 games:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/live", async (req, res) => {
  const { sport = 'nba' } = req.query;
  
  try {
    if (KALSHI_ACCESS_KEY) {
      const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
        headers: {
          'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`
        },
        params: {
          ticker: sport.toUpperCase(),
          status: 'open',
          limit: 20
        }
      });
      
      const liveGames = (response.data.markets || []).map(market => ({
        id: market.market_id,
        title: market.title,
        yesPrice: market.yes_price,
        noPrice: market.no_price,
        closeTime: market.close_time
      }));
      
      res.json({
        message: "Live games from Kalshi",
        games: liveGames,
        count: liveGames.length,
        sport,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback mock data
      res.json({
        message: "Live games endpoint (mock data)",
        games: getMockLiveGames(),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.json({
      message: "Live games endpoint (mock data)",
      games: getMockLiveGames(),
      timestamp: new Date().toISOString()
    });
  }
});

// ============= HELPER FUNCTIONS ============= //

function extractPlayerName(marketTitle) {
  const playerPatterns = [
    /(?:Will\s+)?([A-Z][a-z]+ [A-Z][a-z]+)/,
    /([A-Z][a-z]+ [A-Z][a-z]+)'s/,
    /([A-Z][a-z]+ [A-Z][a-z]+) to/
  ];
  
  for (const pattern of playerPatterns) {
    const match = marketTitle.match(pattern);
    if (match) return match[1];
  }
  
  return 'Unknown Player';
}

function extractTeamName(marketTitle) {
  const commonTeams = [
    'Lakers', 'Warriors', 'Celtics', 'Bucks', 'Suns', 'Heat', 'Nuggets', '76ers',
    'Chiefs', 'Eagles', '49ers', 'Bills', 'Cowboys', 'Packers', 'Dolphins',
    'Yankees', 'Dodgers', 'Braves', 'Astros', 'Red Sox',
    'Avalanche', 'Golden Knights', 'Bruins', 'Lightning', 'Maple Leafs'
  ];
  
  for (const team of commonTeams) {
    if (marketTitle.includes(team)) return team;
  }
  
  return 'Unknown Team';
}

function getMockGames() {
  return [
    {
      id: 'mock_game_001',
      title: 'Will Lakers win 50+ games this season?',
      description: 'Prediction market on Lakers regular season performance',
      sport: 'NBA',
      category: 'team-performance',
      status: 'open',
      openTime: '2024-10-15T00:00:00Z',
      closeTime: '2024-04-15T23:59:00Z',
      yesPrice: 67,
      noPrice: 33,
      volume: 210000,
      openInterest: 85000,
      marketUrl: 'https://kalshi.com/markets/NBA-001'
    },
    {
      id: 'mock_game_002',
      title: 'Will Chiefs win AFC Championship?',
      description: 'Prediction on Chiefs AFC Championship appearance',
      sport: 'NFL',
      category: 'team-performance',
      status: 'open',
      openTime: '2024-09-01T00:00:00Z',
      closeTime: '2024-01-28T23:59:00Z',
      yesPrice: 85,
      noPrice: 15,
      volume: 180000,
      openInterest: 72000,
      marketUrl: 'https://kalshi.com/markets/NFL-001'
    }
  ];
}

function getMockGameDetail(id) {
  return {
    id: id,
    title: 'Will LeBron James score 30+ points in next Lakers game?',
    description: 'Prediction market on LeBron James individual performance',
    sport: 'NBA',
    category: 'player-performance',
    status: 'open',
    createdTime: '2024-01-15T10:00:00Z',
    openTime: '2024-01-15T10:00:00Z',
    closeTime: '2024-01-20T19:30:00Z',
    settlementTime: '2024-01-21T02:00:00Z',
    yesPrice: 72,
    noPrice: 28,
    volume: 89000,
    openInterest: 45000,
    lastTradePrice: 71,
    lastTradeTime: '2024-01-16T14:30:00Z',
    marketUrl: `https://kalshi.com/markets/${id}`,
    rules: 'Market settles based on official NBA statistics'
  };
}

function getMockPlayers() {
  return [
    {
      marketId: 'mock_player_001',
      playerName: 'LeBron James',
      sport: 'NBA',
      question: 'Will score 30+ points in next game?',
      yesPrice: 72,
      noPrice: 28,
      volume: 125000,
      closeTime: '2024-01-20T19:30:00Z'
    },
    {
      marketId: 'mock_player_002',
      playerName: 'Patrick Mahomes',
      sport: 'NFL',
      question: 'Will throw 3+ TD passes in next game?',
      yesPrice: 68,
      noPrice: 32,
      volume: 98000,
      closeTime: '2024-01-21T20:00:00Z'
    }
  ];
}

function getMockTeams() {
  return [
    {
      marketId: 'mock_team_001',
      team: 'Los Angeles Lakers',
      sport: 'NBA',
      question: 'Will win 50+ games this season?',
      yesPrice: 67,
      noPrice: 33,
      volume: 210000,
      closeTime: '2024-04-15T23:59:00Z'
    },
    {
      marketId: 'mock_team_002',
      team: 'Kansas City Chiefs',
      sport: 'NFL',
      question: 'Will win AFC West division?',
      yesPrice: 85,
      noPrice: 15,
      volume: 180000,
      closeTime: '2024-01-07T23:59:00Z'
    }
  ];
}

function getMockLiveGames() {
  return [
    {
      id: 'live_001',
      title: 'Live: Will this game go to overtime?',
      yesPrice: 42,
      noPrice: 58,
      closeTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    }
  ];
}

function getMockStats(query) {
  return {
    timeFrame: query.timeFrame || '7d',
    category: query.category || 'all',
    totalMarkets: 42,
    totalVolume: 1250000,
    avgVolume: 29761,
    topMarketsByVolume: [
      {
        id: 'top_volume_001',
        title: 'Will Lakers win NBA Championship?',
        volume: 450000,
        yesPrice: 35
      }
    ],
    topMarketsByInterest: [
      {
        id: 'top_interest_001',
        title: 'Will NFL have overtime in playoffs?',
        openInterest: 120000,
        yesPrice: 42
      }
    ]
  };
}

// ============= SWAGGER SCHEMA COMPONENTS ============= //

/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sport:
 *           type: string
 *         category:
 *           type: string
 *         status:
 *           type: string
 *           enum: [open, closed, settled]
 *         openTime:
 *           type: string
 *           format: date-time
 *         closeTime:
 *           type: string
 *           format: date-time
 *         settlementTime:
 *           type: string
 *           format: date-time
 *         yesPrice:
 *           type: integer
 *           minimum: 1
 *           maximum: 99
 *         noPrice:
 *           type: integer
 *           minimum: 1
 *           maximum: 99
 *         volume:
 *           type: integer
 *         openInterest:
 *           type: integer
 *         lastPrice:
 *           type: integer
 *         marketUrl:
 *           type: string
 *         rules:
 *           type: string
 *     
 *     GameDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sport:
 *           type: string
 *         category:
 *           type: string
 *         status:
 *           type: string
 *         createdTime:
 *           type: string
 *           format: date-time
 *         openTime:
 *           type: string
 *           format: date-time
 *         closeTime:
 *           type: string
 *           format: date-time
 *         settlementTime:
 *           type: string
 *           format: date-time
 *         yesPrice:
 *           type: integer
 *         noPrice:
 *           type: integer
 *         volume:
 *           type: integer
 *         openInterest:
 *           type: integer
 *         lastTradePrice:
 *           type: integer
 *         lastTradeTime:
 *           type: string
 *           format: date-time
 *         marketUrl:
 *           type: string
 *         rules:
 *           type: string
 *         minTickSize:
 *           type: integer
 *         minPrice:
 *           type: integer
 *         maxPrice:
 *           type: integer
 *     
 *     PlayerMarket:
 *       type: object
 *       properties:
 *         marketId:
 *           type: string
 *         playerName:
 *           type: string
 *         sport:
 *           type: string
 *         question:
 *           type: string
 *         yesPrice:
 *           type: integer
 *         noPrice:
 *           type: integer
 *         volume:
 *           type: integer
 *         closeTime:
 *           type: string
 *           format: date-time
 *         marketUrl:
 *           type: string
 *         status:
 *           type: string
 *     
 *     TeamMarket:
 *       type: object
 *       properties:
 *         marketId:
 *           type: string
 *         team:
 *           type: string
 *         sport:
 *           type: string
 *         question:
 *           type: string
 *         yesPrice:
 *           type: integer
 *         noPrice:
 *           type: integer
 *         volume:
 *           type: integer
 *         closeTime:
 *           type: string
 *           format: date-time
 *         marketUrl:
 *           type: string
 *         status:
 *           type: string
 *     
 *     MarketStats:
 *       type: object
 *       properties:
 *         timeFrame:
 *           type: string
 *         category:
 *           type: string
 *         totalMarkets:
 *           type: integer
 *         totalVolume:
 *           type: integer
 *         avgVolume:
 *           type: integer
 *         topMarketsByVolume:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               volume:
 *                 type: integer
 *               yesPrice:
 *                 type: integer
 *         topMarketsByInterest:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               openInterest:
 *                 type: integer
 *               yesPrice:
 *                 type: integer
 */

export default router;
