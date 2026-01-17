// routes/kalshiRoutes.js - Kalshi API integration for Sports Analytics
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Kalshi API Configuration
const KALSHI_API_BASE = 'https://api.kalshi.com/v1';
const KALSHI_API_KEY = process.env.KALSHI_API_KEY;

// Mock data for fallback
const mockKalshiMarkets = [
  {
    "id": "1",
    "marketId": "CHIEFS-SB-LXI-2026",
    "question": "Will Chiefs win Super Bowl LXI?",
    "category": "Sports",
    "yesPrice": "0.68",
    "noPrice": "0.32",
    "volume": "$4.2M",
    "confidence": 85,
    "edge": "+3.2%",
    "analysis": "Market underrating Chiefs defense. Current price implies 68% probability, true probability estimated at 71.2%.",
    "expires": "Feb 9, 2026",
    "lastTradeTime": "2 minutes ago",
    "ticker": "CHIEFS-SB61"
  },
  {
    "id": "2",
    "marketId": "FED-RATE-CUT-JUNE-2026",
    "question": "Will Fed cut rates before June 2026?",
    "category": "Economics",
    "yesPrice": "0.42",
    "noPrice": "0.58",
    "volume": "$2.8M",
    "confidence": 72,
    "edge": "+5.8%",
    "analysis": "Inflation data suggests earlier cuts. Market sentiment lags recent CPI reports.",
    "expires": "May 30, 2026",
    "lastTradeTime": "15 minutes ago",
    "ticker": "FED-JUNE26"
  },
  {
    "id": "3",
    "marketId": "SENATE-DEMS-2026",
    "question": "Will Democrats control Senate after 2026?",
    "category": "Politics",
    "yesPrice": "0.55",
    "noPrice": "0.45",
    "volume": "$3.5M",
    "confidence": 68,
    "edge": "+4.1%",
    "analysis": "Current polling vs. market pricing shows 4.1% edge. Key races in GA, PA undervalued.",
    "expires": "Nov 5, 2026",
    "lastTradeTime": "1 hour ago",
    "ticker": "SENATE26-D"
  },
  {
    "id": "4",
    "marketId": "NBA-WARRIORS-2024",
    "question": "Will Warriors win 2024 NBA Championship?",
    "category": "Sports",
    "yesPrice": "0.25",
    "noPrice": "0.75",
    "volume": "$1.8M",
    "confidence": 45,
    "edge": "-2.3%",
    "analysis": "Warriors aging roster showing signs of decline. Market overvaluing past success.",
    "expires": "Jun 20, 2024",
    "lastTradeTime": "30 minutes ago",
    "ticker": "NBA-GSW-2024"
  },
  {
    "id": "5",
    "marketId": "NHL-BRUINS-2024",
    "question": "Will Bruins win 2024 Stanley Cup?",
    "category": "Sports",
    "yesPrice": "0.18",
    "noPrice": "0.82",
    "volume": "$1.2M",
    "confidence": 38,
    "edge": "+1.5%",
    "analysis": "Strong regular season team but playoff history concerning. Slight edge on NO side.",
    "expires": "Jun 15, 2024",
    "lastTradeTime": "45 minutes ago",
    "ticker": "NHL-BOS-2024"
  }
];

const mockNews = {
  "kalshiNews": [
    {
      "id": "1",
      "title": "Kalshi Hits $2B Weekly Volume, Commands 66% Market Share",
      "summary": "Kalshi has become the dominant prediction market platform with $2 billion in weekly volume and 66.4% market share, surpassing competitors through CFTC regulation and Robinhood integration.",
      "category": "Economics",
      "timestamp": "Today",
      "url": "https://example.com/kalshi-growth"
    },
    {
      "id": "2",
      "title": "NCAA Petitions CFTC to Pause College Sports Markets",
      "summary": "NCAA President Charlie Baker calls for pause on college sports prediction markets until better safeguards are in place.",
      "category": "Legal",
      "timestamp": "Yesterday",
      "url": "https://example.com/ncaa-kalshi"
    },
    {
      "id": "3",
      "title": "Sports Betting Meets Prediction Markets: Kalshi's Edge",
      "summary": "How Kalshi's regulated prediction markets offer advantages over traditional sportsbooks with better pricing and more markets.",
      "category": "Sports",
      "timestamp": "2 days ago",
      "url": "https://example.com/kalshi-sports-edge"
    }
  ]
};

// Authentication middleware for Kalshi API
const authenticateKalshiApi = (req, res, next) => {
  const apiKey = req.headers['kalshi-access-key'] || req.headers['authorization']?.replace('Bearer ', '') || KALSHI_API_KEY;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Kalshi API key is required',
      note: 'Set KALSHI_API_KEY environment variable or include kalshi-access-key header'
    });
  }
  
  req.kalshiApiKey = apiKey;
  next();
};

// ============ KALSHI ENDPOINTS ============

// Get Kalshi markets
router.get('/markets', authenticateKalshiApi, async (req, res) => {
  try {
    const { category, limit = 50, status = 'open', sport } = req.query;
    
    console.log(`🔍 Fetching Kalshi markets: category=${category}, sport=${sport}, limit=${limit}`);
    
    let filteredMarkets = [...mockKalshiMarkets];
    
    // Filter by category if provided
    if (category && category !== 'All') {
      filteredMarkets = filteredMarkets.filter(market => 
        market.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by sport if provided
    if (sport) {
      filteredMarkets = filteredMarkets.filter(market => 
        market.question.toLowerCase().includes(sport.toLowerCase()) ||
        market.category.toLowerCase() === 'sports'
      );
    }
    
    // Apply limit
    const limitedMarkets = filteredMarkets.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      markets: limitedMarkets,
      platformStats: {
        weeklyVolume: '$2.0B',
        marketShare: '66.4%',
        sportsPercentage: '91.1%',
        topMarket: 'NFL Combos',
        recordDay: '$466M',
        totalMarkets: limitedMarkets.length,
        timestamp: new Date().toISOString()
      },
      metadata: {
        totalAvailable: filteredMarkets.length,
        filteredBy: { category, sport, status },
        note: 'Using mock Kalshi data - Set up real Kalshi API integration for production'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Kalshi markets:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Falling back to mock data'
    });
  }
});

// Get specific Kalshi market
router.get('/markets/:marketId', authenticateKalshiApi, async (req, res) => {
  try {
    const { marketId } = req.params;
    
    console.log(`🔍 Fetching Kalshi market: ${marketId}`);
    
    const market = mockKalshiMarkets.find(m => 
      m.id === marketId || m.marketId === marketId
    );
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    // Generate realistic trading history
    const basePrice = parseFloat(market.yesPrice);
    const tradingHistory = [
      { time: '2:30 PM', price: basePrice.toFixed(2), volume: 150, type: 'buy' },
      { time: '2:15 PM', price: (basePrice - 0.01).toFixed(2), volume: 85, type: 'sell' },
      { time: '1:45 PM', price: basePrice.toFixed(2), volume: 120, type: 'buy' },
      { time: '1:20 PM', price: (basePrice - 0.02).toFixed(2), volume: 95, type: 'sell' },
      { time: '12:50 PM', price: (basePrice + 0.01).toFixed(2), volume: 200, type: 'buy' },
      { time: '12:30 PM', price: (basePrice - 0.03).toFixed(2), volume: 75, type: 'sell' }
    ];
    
    // Find related markets
    const relatedMarkets = mockKalshiMarkets
      .filter(m => m.category === market.category && m.id !== marketId)
      .slice(0, 3);
    
    res.json({
      success: true,
      market,
      tradingHistory,
      relatedMarkets,
      volume24h: market.volume,
      openInterest: {
        yes: Math.floor(Math.random() * 10000) + 5000,
        no: Math.floor(Math.random() * 10000) + 5000,
        total: Math.floor(Math.random() * 20000) + 10000
      },
      marketMetrics: {
        impliedProbability: `${(parseFloat(market.yesPrice) * 100).toFixed(1)}%`,
        expectedValue: market.edge,
        confidence: market.confidence,
        liquidityScore: Math.floor(Math.random() * 100) + 1,
        volatility: (Math.random() * 15 + 5).toFixed(1) + '%'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Kalshi market:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Place a trade (mock for now)
router.post('/trades', authenticateKalshiApi, async (req, res) => {
  try {
    const { marketId, side, amount, price, orderType = 'market' } = req.body;
    
    console.log(`💱 Processing trade: ${side} ${amount} @ ${price} for ${marketId}`);
    
    // Validate input
    if (!marketId || !side || !amount || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: marketId, side, amount, price'
      });
    }
    
    if (!['yes', 'no'].includes(side.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Side must be "yes" or "no"'
      });
    }
    
    // Find the market
    const market = mockKalshiMarkets.find(m => 
      m.id === marketId || m.marketId === marketId
    );
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    // Simulate trade processing
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filledPrice = orderType === 'market' ? parseFloat(market.yesPrice) : parseFloat(price);
    const filledAmount = parseFloat(amount);
    const fees = (filledAmount * 0.02).toFixed(2);
    
    // Calculate P&L based on current market price
    const currentPrice = parseFloat(market.yesPrice);
    const priceDiff = side === 'yes' 
      ? (currentPrice - filledPrice) * filledAmount * 100
      : (filledPrice - currentPrice) * filledAmount * 100;
    
    res.json({
      success: true,
      trade: {
        id: tradeId,
        marketId,
        marketQuestion: market.question,
        side: side.toLowerCase(),
        amount: filledAmount,
        price: filledPrice,
        orderType,
        filled: filledAmount,
        remaining: 0,
        status: 'filled',
        timestamp: new Date().toISOString(),
        fees: parseFloat(fees),
        totalCost: (filledAmount * filledPrice) + parseFloat(fees),
        estimatedPnl: priceDiff.toFixed(2),
        currentValue: (filledAmount * currentPrice).toFixed(2)
      },
      marketSnapshot: {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        volume: market.volume
      },
      note: 'Mock trade execution - No real money is being traded'
    });
    
  } catch (error) {
    console.error('❌ Error placing trade:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's trade history
router.get('/trades/history', authenticateKalshiApi, async (req, res) => {
  try {
    const { limit = 20, status } = req.query;
    
    console.log(`📜 Fetching trade history: limit=${limit}, status=${status}`);
    
    // Mock trade history
    const mockTrades = [
      {
        id: 'trade_1',
        marketId: '1',
        marketQuestion: 'Will Chiefs win Super Bowl LXI?',
        side: 'yes',
        amount: 10,
        price: 0.68,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'filled',
        profitLoss: '+3.20',
        currentValue: '6.80',
        fees: '0.14',
        roi: '+47.1%'
      },
      {
        id: 'trade_2',
        marketId: '2',
        marketQuestion: 'Will Fed cut rates before June 2026?',
        side: 'no',
        amount: 5,
        price: 0.58,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'filled',
        profitLoss: '+0.45',
        currentValue: '2.90',
        fees: '0.06',
        roi: '+15.5%'
      },
      {
        id: 'trade_3',
        marketId: '4',
        marketQuestion: 'Will Warriors win 2024 NBA Championship?',
        side: 'no',
        amount: 8,
        price: 0.75,
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        status: 'filled',
        profitLoss: '+0.80',
        currentValue: '6.00',
        fees: '0.12',
        roi: '+13.3%'
      },
      {
        id: 'trade_4',
        marketId: '5',
        marketQuestion: 'Will Bruins win 2024 Stanley Cup?',
        side: 'yes',
        amount: 3,
        price: 0.18,
        timestamp: new Date(Date.now() - 432000000).toISOString(),
        status: 'filled',
        profitLoss: '-0.15',
        currentValue: '0.54',
        fees: '0.01',
        roi: '-8.3%'
      }
    ];
    
    // Filter by status if provided
    let filteredTrades = mockTrades;
    if (status) {
      filteredTrades = mockTrades.filter(trade => 
        trade.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Calculate statistics
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => parseFloat(t.profitLoss) > 0).length;
    const totalProfit = filteredTrades.reduce((sum, trade) => 
      sum + parseFloat(trade.profitLoss), 0
    );
    const totalInvestment = filteredTrades.reduce((sum, trade) => 
      sum + (trade.amount * trade.price), 0
    );
    const overallRoi = totalInvestment > 0 
      ? ((totalProfit / totalInvestment) * 100).toFixed(1) + '%'
      : '0.0%';
    
    res.json({
      success: true,
      trades: filteredTrades.slice(0, parseInt(limit)),
      stats: {
        totalTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        winRate: totalTrades > 0 ? `${((winningTrades / totalTrades) * 100).toFixed(1)}%` : '0%',
        totalProfit: `$${totalProfit.toFixed(2)}`,
        totalInvestment: `$${totalInvestment.toFixed(2)}`,
        roi: overallRoi,
        avgTradeSize: `$${(totalInvestment / totalTrades).toFixed(2)}`
      },
      pagination: {
        limit: parseInt(limit),
        total: filteredTrades.length,
        hasMore: filteredTrades.length > parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching trade history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Kalshi news
router.get('/news', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log(`📰 Fetching Kalshi news: category=${category}, limit=${limit}`);
    
    let news = [...mockNews.kalshiNews];
    
    if (category && category !== 'All') {
      news = news.filter(item => item.category === category);
    }
    
    res.json({
      success: true,
      news: news.slice(0, parseInt(limit)),
      categories: ['All', 'Sports', 'Legal', 'Economics', 'Politics'],
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalArticles: mockNews.kalshiNews.length,
        filteredCount: news.length,
        note: 'Mock Kalshi news data'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Kalshi news:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Kalshi platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      platform: {
        name: 'Kalshi',
        status: 'active',
        regulation: 'CFTC-regulated',
        launchDate: '2021',
        headquarters: 'New York, NY'
      },
      performance: {
        weeklyVolume: '$2.0B',
        monthlyVolume: '$8.5B',
        yearlyVolume: '$95B',
        marketShare: '66.4%',
        activeTraders: '450K+',
        totalMarkets: '12,500+',
        sportsMarketsPercentage: '91.1%'
      },
      records: {
        largestSingleMarket: 'NFL Sunday Combo - $42M',
        recordDailyVolume: '$466M',
        mostTradedCategory: 'Sports (91.1%)',
        fastestGrowingCategory: 'Politics (+320% YoY)'
      },
      integration: {
        hasAPI: true,
        hasMobileApp: true,
        hasRobinhoodIntegration: true,
        apiDocumentation: 'https://docs.kalshi.com',
        apiVersion: 'v1'
      },
      timestamp: new Date().toISOString(),
      note: 'Mock Kalshi statistics - Replace with real API data in production'
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error fetching Kalshi stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'sports', name: 'Sports', count: 85, volume: '$1.8B', icon: '🏀' },
      { id: 'politics', name: 'Politics', count: 32, volume: '$450M', icon: '🏛️' },
      { id: 'economics', name: 'Economics', count: 28, volume: '$620M', icon: '📈' },
      { id: 'entertainment', name: 'Entertainment', count: 15, volume: '$180M', icon: '🎬' },
      { id: 'technology', name: 'Technology', count: 12, volume: '$220M', icon: '💻' },
      { id: 'weather', name: 'Weather', count: 8, volume: '$75M', icon: '⛅' }
    ];
    
    res.json({
      success: true,
      categories,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real Kalshi API integration (commented out for now)
router.get('/api/real/markets', authenticateKalshiApi, async (req, res) => {
  try {
    // Uncomment and configure for real Kalshi API integration
    /*
    const response = await axios.get(`${KALSHI_API_BASE}/markets`, {
      headers: {
        'Authorization': `Bearer ${req.kalshiApiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: req.query.limit || 50,
        status: req.query.status || 'open'
      }
    });
    
    res.json({
      success: true,
      data: response.data,
      source: 'real-kalshi-api'
    });
    */
    
    // Fallback to mock data until real API is configured
    res.json({
      success: true,
      message: 'Real Kalshi API integration is available but not configured',
      instructions: [
        '1. Get API key from Kalshi developer portal',
        '2. Set KALSHI_API_KEY environment variable',
        '3. Uncomment real API code in kalshiRoutes.js',
        '4. Update headers and endpoints as needed'
      ],
      documentation: 'https://docs.kalshi.com',
      currentStatus: 'using-mock-data'
    });
    
  } catch (error) {
    console.error('❌ Real Kalshi API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Check KALSHI_API_KEY configuration'
    });
  }
});

// Health check for Kalshi service
router.get('/health', async (req, res) => {
  const hasApiKey = !!process.env.KALSHI_API_KEY;
  
  res.json({
    service: 'kalshi-api',
    status: hasApiKey ? 'configured' : 'mock-mode',
    apiKeyConfigured: hasApiKey,
    mockData: true,
    endpoints: [
      'GET /api/kalshi/markets',
      'GET /api/kalshi/markets/:marketId',
      'POST /api/kalshi/trades',
      'GET /api/kalshi/trades/history',
      'GET /api/kalshi/news',
      'GET /api/kalshi/stats',
      'GET /api/kalshi/categories'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
