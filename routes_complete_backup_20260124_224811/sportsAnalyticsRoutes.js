import express from 'express';
import SportsBettingAnalyticsService from '../services/SportsBettingAnalyticsService.js';

const router = express.Router();

// GET: Find arbitrage opportunities
router.get('/arbitrage', async (req, res) => {
  try {
    const { sport, marketType } = req.query;
    
    const opportunities = await SportsBettingAnalyticsService.findArbitrageOpportunities(
      sport,
      marketType
    );
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('❌ Error finding arbitrage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Track sharp money
router.get('/sharp-money', async (req, res) => {
  try {
    const { sport, timeWindow = '24h' } = req.query;
    
    const sharpMoves = await SportsBettingAnalyticsService.trackSharpMoney(
      sport,
      timeWindow
    );
    
    res.json({
      success: true,
      data: sharpMoves
    });
  } catch (error) {
    console.error('❌ Error tracking sharp money:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Analyze public vs sharp
router.get('/public-vs-sharp', async (req, res) => {
  try {
    const { sport } = req.query;
    
    const analysis = await SportsBettingAnalyticsService.analyzePublicVsSharp(sport);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Error analyzing public vs sharp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Find regression candidates
router.get('/regression', async (req, res) => {
  try {
    const { sport, statType } = req.query;
    
    const candidates = await SportsBettingAnalyticsService.findRegressionCandidates(
      sport,
      statType
    );
    
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('❌ Error finding regression candidates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Analyze historical trends
router.get('/historical-trends', async (req, res) => {
  try {
    const { sport, trendType } = req.query;
    
    const trends = await SportsBettingAnalyticsService.analyzeHistoricalTrends(
      sport,
      trendType
    );
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('❌ Error analyzing historical trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Calculate expected value
router.post('/expected-value', async (req, res) => {
  try {
    const { probability, odds, stake } = req.body;
    
    const ev = SportsBettingAnalyticsService.calculateExpectedValue(
      probability,
      odds,
      stake
    );
    
    res.json({
      success: true,
      data: ev
    });
  } catch (error) {
    console.error('❌ Error calculating EV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
