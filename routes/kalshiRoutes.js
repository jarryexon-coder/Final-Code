import express from 'express';
import KalshiMarketService from '../services/KalshiMarketService.js';

const router = express.Router();

// GET: Market inefficiencies
router.get('/inefficiencies', async (req, res) => {
  try {
    const { marketType } = req.query;
    
    const markets = await KalshiMarketService.getMarkets({
      marketType: marketType || 'all',
      limit: 20
    });
    
    const inefficiencies = KalshiMarketService.findArbitrageOpportunities(markets);
    
    res.json({
      success: true,
      data: {
        markets: markets.slice(0, 5),
        inefficiencies: inefficiencies,
        totalMarkets: markets.length
      }
    });
  } catch (error) {
    console.error('❌ Error finding market inefficiencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Steam moves
router.get('/steam-moves', async (req, res) => {
  try {
    const steamMoves = await KalshiMarketService.getSteamMoves();
    
    res.json({
      success: true,
      data: steamMoves
    });
  } catch (error) {
    console.error('❌ Error getting steam moves:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Volatility arbitrage
router.get('/volatility-arb', async (req, res) => {
  try {
    const arbOpportunities = await KalshiMarketService.findVolatilityArbitrage();
    
    res.json({
      success: true,
      data: arbOpportunities
    });
  } catch (error) {
    console.error('❌ Error finding volatility arb:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: All markets
router.get('/markets', async (req, res) => {
  try {
    const { limit, marketType } = req.query;
    
    const markets = await KalshiMarketService.getMarkets({
      limit: parseInt(limit) || 10,
      marketType: marketType || 'all'
    });
    
    res.json({
      success: true,
      data: markets
    });
  } catch (error) {
    console.error('❌ Error getting Kalshi markets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
