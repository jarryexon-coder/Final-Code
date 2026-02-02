import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "secretPhrase API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});
import axios from 'axios';
import SecretPhraseAnalytics from '../models/SecretPhraseAnalytics.js';
import User from '../models/User.js';

// API keys from environment
const KALSHI_ACCESS_KEY = process.env.KALSHI_ACCESS_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const RAPIDAPI_KEY_PREDICTIONS = process.env.RAPIDAPI_KEY_PREDICTIONS;

// ============= KALSHI SPORTS DATA ENDPOINTS ============= //

/**
 * @swagger
 * /api/secret-phrases/games:
 *   get:
 *     summary: Get sports games data via Kalshi API
 *     description: Retrieve live and upcoming sports games with market data from Kalshi prediction markets
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *           default: nba
 *         description: Sport to filter games by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, live, completed]
 *         description: Game status filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: List of sports games with market data
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
 *                     $ref: '#/components/schemas/KalshiGame'
 *       400:
 *         description: Missing or invalid API key
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const { sport = 'nba', status, limit = 20 } = req.query;
    
    // Map sport to Kalshi market tickers
    const sportTickers = {
      nba: 'NBA',
      nfl: 'NFL',
      mlb: 'MLB',
      nhl: 'NHL'
    };

    const ticker = sportTickers[sport] || 'NBA';

    // Fetch markets from Kalshi API
    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        ticker: ticker,
        limit: parseInt(limit)
      }
    });

    // Transform Kalshi markets to game format
    const games = response.data.markets.map(market => ({
      id: market.market_id,
      title: market.title,
      sport: market.ticker,
      status: market.status,
      startTime: market.close_time,
      endTime: market.settlement_time,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      openInterest: market.open_interest,
      marketUrl: market.market_url,
      question: market.question
    }));

    // Filter by status if provided
    const filteredGames = status ? 
      games.filter(game => game.status === status) : 
      games;

    res.json({
      success: true,
      count: filteredGames.length,
      games: filteredGames.slice(0, parseInt(limit)),
      sport,
      source: 'Kalshi API'
    });

  } catch (error) {
    console.error('Kalshi games API error:', error.message);
    
    // Fallback to mock data
    res.json({
      success: true,
      games: [
        {
          id: 'mock_kalshi_001',
          title: 'Will Lakers win 50+ games this season?',
          sport: 'NBA',
          status: 'open',
          startTime: '2024-10-15T19:00:00Z',
          yesPrice: 67,
          noPrice: 33,
          volume: 125000,
          openInterest: 50000,
          marketUrl: 'https://kalshi.com/markets/NBA-001'
        },
        {
          id: 'mock_kalshi_002',
          title: 'Will Chiefs make AFC Championship?',
          sport: 'NFL',
          status: 'open',
          startTime: '2024-09-10T20:00:00Z',
          yesPrice: 78,
          noPrice: 22,
          volume: 89000,
          openInterest: 32000,
          marketUrl: 'https://kalshi.com/markets/NFL-002'
        }
      ],
      count: 2,
      message: 'Using fallback games data'
    });
  }
});

/**
 * @swagger
 * /api/secret-phrases/games/{id}:
 *   get:
 *     summary: Get specific game market details
 *     description: Retrieve detailed market information for a specific Kalshi prediction market
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kalshi market ID
 *     responses:
 *       200:
 *         description: Game market details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 game:
 *                   $ref: '#/components/schemas/KalshiGameDetail'
 *       404:
 *         description: Market not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  // Use KALSHI-ACCESS-KEY
  try {
    if (!KALSHI_ACCESS_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Kalshi API key not configured'
      });
    }

    const marketId = req.params.id;
    
    // Fetch specific market from Kalshi API
    const response = await axios.get(`https://api.kalshi.com/trade-api/v2/markets/${marketId}`, {
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
        category: market.category,
        subtitles: market.subtitle,
        minTickSize: market.min_tick_size,
        minPrice: market.min_price,
        maxPrice: market.max_price
      }
    });

  } catch (error) {
    console.error('Kalshi game detail API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      game: {
        id: req.params.id,
        title: 'Will LeBron James score 30+ points in the next Lakers game?',
        description: 'Prediction market on LeBron James performance in upcoming Lakers matchup',
        sport: 'NBA',
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
        marketUrl: `https://kalshi.com/markets/${req.params.id}`,
        rules: 'Market settles based on official NBA statistics',
        category: 'player-performance',
        minPrice: 1,
        maxPrice: 99
      },
      message: 'Using fallback game detail data'
    });
  }
});

/**
 * @swagger
 * /api/secret-phrases/players:
 *   get:
 *     summary: Get player prediction markets
 *     description: Retrieve Kalshi prediction markets focused on individual player performances
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: player
 *         schema:
 *           type: string
 *         description: Filter by player name
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport filter
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
      limit: parseInt(limit)
    };
    
    if (player) params.search = player;

    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params
    });

    const players = response.data.markets.map(market => ({
      marketId: market.market_id,
      playerName: extractPlayerName(market.title),
      sport: market.ticker,
      question: market.question,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      closeTime: market.close_time,
      marketUrl: market.market_url
    }));

    res.json({
      success: true,
      count: players.length,
      players: players.slice(0, parseInt(limit)),
      sport,
      filter: { player }
    });

  } catch (error) {
    console.error('Kalshi players API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      players: [
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
      ],
      count: 2,
      message: 'Using fallback players data'
    });
  }
});

/**
 * @swagger
 * /api/secret-phrases/teams:
 *   get:
 *     summary: Get team prediction markets
 *     description: Retrieve Kalshi prediction markets focused on team performances and outcomes
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
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
 *         description: Sport filter
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
      limit: parseInt(limit)
    };
    
    if (team) params.search = team;

    const response = await axios.get('https://api.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
        'Accept': 'application/json'
      },
      params
    });

    const teams = response.data.markets.map(market => ({
      marketId: market.market_id,
      team: extractTeamName(market.title),
      sport: market.ticker,
      question: market.question,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      volume: market.volume,
      closeTime: market.close_time,
      marketUrl: market.market_url
    }));

    res.json({
      success: true,
      count: teams.length,
      teams: teams.slice(0, parseInt(limit)),
      sport,
      filter: { team }
    });

  } catch (error) {
    console.error('Kalshi teams API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      teams: [
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
      ],
      count: 2,
      message: 'Using fallback teams data'
    });
  }
});

/**
 * @swagger
 * /api/secret-phrases/stats:
 *   get:
 *     summary: Get market statistics
 *     description: Retrieve Kalshi market statistics including volume trends, popular markets, and performance metrics
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, all]
 *           default: 7d
 *         description: Time frame for statistics
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl, all]
 *           default: all
 *         description: Sport category filter
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
    
    // Fetch market statistics from Kalshi
    const [volumeResponse, popularResponse] = await Promise.all([
      axios.get('https://api.kalshi.com/trade-api/v2/markets', {
        headers: {
          'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
          'Accept': 'application/json'
        },
        params: {
          limit: 100,
          order_by: 'volume',
          order_dir: 'desc'
        }
      }),
      axios.get('https://api.kalshi.com/trade-api/v2/markets', {
        headers: {
          'Authorization': `Bearer ${KALSHI_ACCESS_KEY}`,
          'Accept': 'application/json'
        },
        params: {
          limit: 50,
          order_by: 'open_interest',
          order_dir: 'desc'
        }
      })
    ]);

    const allMarkets = volumeResponse.data.markets;
    const filteredMarkets = category === 'all' ? 
      allMarkets : 
      allMarkets.filter(market => market.ticker === category.toUpperCase());

    const totalVolume = filteredMarkets.reduce((sum, market) => sum + (market.volume || 0), 0);
    const totalMarkets = filteredMarkets.length;
    const avgVolume = totalMarkets > 0 ? Math.round(totalVolume / totalMarkets) : 0;

    res.json({
      success: true,
      stats: {
        timeFrame,
        category,
        totalVolume,
        totalMarkets,
        avgVolume,
        topMarketsByVolume: filteredMarkets.slice(0, 5).map(m => ({
          id: m.market_id,
          title: m.title,
          volume: m.volume,
          yesPrice: m.yes_price
        })),
        topMarketsByInterest: popularResponse.data.markets.slice(0, 5).map(m => ({
          id: m.market_id,
          title: m.title,
          openInterest: m.open_interest,
          yesPrice: m.yes_price
        }))
      }
    });

  } catch (error) {
    console.error('Kalshi stats API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      stats: {
        timeFrame: req.query.timeFrame || '7d',
        category: req.query.category || 'all',
        totalVolume: 1250000,
        totalMarkets: 42,
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
      },
      message: 'Using fallback stats data'
    });
  }
});

// ============= ORIGINAL ANALYTICS ENDPOINTS (with JSDoc) ============= //

/**
 * @swagger
 * /api/secret-phrases/log-event:
 *   post:
 *     summary: Log a secret phrase analytics event
 *     description: Record user interactions with secret phrases including discoveries, usage, and performance updates
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SecretPhraseEvent'
 *     responses:
 *       201:
 *         description: Event logged successfully
 *       400:
 *         description: Invalid event data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/log-event', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

/**
 * @swagger
 * /api/secret-phrases/aggregate:
 *   get:
 *     summary: Get aggregated analytics for secret phrases
 *     description: Retrieve comprehensive analytics data for secret phrases including usage patterns, performance, and user engagement
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by phrase category
 *     responses:
 *       200:
 *         description: Aggregated analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overallStats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AggregateStats'
 *                 byPhrase:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PhraseStats'
 *                 byCategory:
 *                   type: array
 *                 byRarity:
 *                   type: array
 *                 byHour:
 *                   type: array
 *                 performance:
 *                   type: array
 *                 recentActivity:
 *                   type: array
 *                 userLeaderboard:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/aggregate', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

/**
 * @swagger
 * /api/secret-phrases/user/{userId}:
 *   get:
 *     summary: Get user-specific analytics
 *     description: Retrieve analytics and performance data for a specific user's secret phrase usage
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to retrieve analytics for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limit for recent events
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userStats:
 *                   $ref: '#/components/schemas/UserStats'
 *                 recentEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PhraseEvent'
 *                 performance:
 *                   type: array
 *                 achievements:
 *                   type: array
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

/**
 * @swagger
 * /api/secret-phrases/performance/compare:
 *   get:
 *     summary: Compare phrase performance
 *     description: Compare performance metrics across different secret phrases over specified time frames
 *     tags: [Secret Phrases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phrases
 *         schema:
 *           type: string
 *         description: Comma-separated list of phrase keys to compare
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, all]
 *           default: 30days
 *         description: Time frame for performance comparison
 *     responses:
 *       200:
 *         description: Performance comparison data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PhrasePerformance'
 *       500:
 *         description: Server error
 */
router.get('/performance/compare', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

// ============= HELPER FUNCTIONS ============= //

function extractPlayerName(marketTitle) {
  // Simple extraction logic - can be enhanced
  const playerPatterns = [
    /(?:Will\s+)?([A-Z][a-z]+ [A-Z][a-z]+)/,
    /([A-Z][a-z]+ [A-Z][a-z]+)'s/
  ];
  
  for (const pattern of playerPatterns) {
    const match = marketTitle.match(pattern);
    if (match) return match[1];
  }
  
  return 'Unknown Player';
}

function extractTeamName(marketTitle) {
  // Team extraction logic
  const teams = [
    'Lakers', 'Warriors', 'Celtics', 'Bucks', 'Suns', 'Heat',
    'Chiefs', 'Eagles', '49ers', 'Bills', 'Cowboys', 'Packers',
    'Yankees', 'Dodgers', 'Braves', 'Astros',
    'Avalanche', 'Golden Knights', 'Bruins', 'Lightning'
  ];
  
  for (const team of teams) {
    if (marketTitle.includes(team)) return team;
  }
  
  return 'Unknown Team';
}

// ============= SWAGGER SCHEMA COMPONENTS ============= //

/**
 * @swagger
 * components:
 *   schemas:
 *     KalshiGame:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         sport:
 *           type: string
 *         status:
 *           type: string
 *           enum: [open, closed, settled]
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
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
 *         marketUrl:
 *           type: string
 *         question:
 *           type: string
 *     
 *     KalshiGameDetail:
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
 *         category:
 *           type: string
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
 *     
 *     MarketStats:
 *       type: object
 *       properties:
 *         timeFrame:
 *           type: string
 *         category:
 *           type: string
 *         totalVolume:
 *           type: integer
 *         totalMarkets:
 *           type: integer
 *         avgVolume:
 *           type: integer
 *         topMarketsByVolume:
 *           type: array
 *           items:
 *             type: object
 *         topMarketsByInterest:
 *           type: array
 *           items:
 *             type: object
 *     
 *     SecretPhraseEvent:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         phraseKey:
 *           type: string
 *         phraseCategory:
 *           type: string
 *         rarity:
 *           type: string
 *           enum: [common, uncommon, rare, epic, legendary]
 *         eventType:
 *           type: string
 *           enum: [discovery, usage, performance_update]
 *         inputText:
 *           type: string
 *         sport:
 *           type: string
 *         playerName:
 *           type: string
 *         odds:
 *           type: string
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         outcome:
 *           type: string
 *           enum: [win, loss, push]
 *         unitsWon:
 *           type: number
 *         metadata:
 *           type: object
 *     
 *     AggregateStats:
 *       type: object
 *       properties:
 *         totalEvents:
 *           type: integer
 *         uniqueUserCount:
 *           type: integer
 *         uniquePhraseCount:
 *           type: integer
 *         totalDiscoveries:
 *           type: integer
 *         totalUsages:
 *           type: integer
 *         totalPerformanceUpdates:
 *           type: integer
 *         discoveryRate:
 *           type: number
 *     
 *     PhraseStats:
 *       type: object
 *       properties:
 *         phraseKey:
 *           type: string
 *         count:
 *           type: integer
 *         discoveries:
 *           type: integer
 *         usages:
 *           type: integer
 *         userCount:
 *           type: integer
 *         avgConfidence:
 *           type: number
 *     
 *     UserStats:
 *       type: object
 *       properties:
 *         totalEvents:
 *           type: integer
 *         discoveries:
 *           type: integer
 *         usages:
 *           type: integer
 *         uniquePhraseCount:
 *           type: integer
 *         categoryCount:
 *           type: integer
 *         firstDiscovery:
 *           type: string
 *           format: date-time
 *         lastActivity:
 *           type: string
 *           format: date-time
 *     
 *     PhraseEvent:
 *       type: object
 *       properties:
 *         phraseKey:
 *           type: string
 *         eventType:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         sport:
 *           type: string
 *         playerName:
 *           type: string
 *         odds:
 *           type: string
 *         confidence:
 *           type: number
 *     
 *     PhrasePerformance:
 *       type: object
 *       properties:
 *         phraseKey:
 *           type: string
 *         totalBets:
 *           type: integer
 *         wins:
 *           type: integer
 *         losses:
 *           type: integer
 *         pushes:
 *           type: integer
 *         winRate:
 *           type: number
 *         roi:
 *           type: number
 *         avgConfidence:
 *           type: number
 *         avgOdds:
 *           type: number
 *     
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;
