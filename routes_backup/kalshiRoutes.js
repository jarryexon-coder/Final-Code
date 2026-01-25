// routes/kalshiRoutes.js - Fixed version
import express from 'express';
const router = express.Router();

// Health check endpoint - Fixed to match File 2 structure
router.get('/health', (req, res) => {
  console.log('🔍 Kalshi health check called');
  res.json({
    success: true,
    status: 'healthy',
    service: 'Kalshi API',
    timestamp: new Date().toISOString()
  });
});

// Markets endpoint
router.get('/markets', (req, res) => {
  const { limit = 5 } = req.query;
  console.log(`📊 Fetching Kalshi markets, limit: ${limit}`);
  
  // Mock markets data
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

// News endpoint
router.get('/news', (req, res) => {
  console.log('📰 Fetching Kalshi news');
  
  // Mock news data
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

// Additional endpoint from File 2 pattern (if needed)
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
