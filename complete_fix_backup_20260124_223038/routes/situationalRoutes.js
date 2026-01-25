import express from 'express';
import SituationalAnalysisService from '../services/SituationalAnalysisService.js';

const router = express.Router();

// GET: Identify spot plays
router.get('/spot-plays', async (req, res) => {
  try {
    const { sport, date } = req.query;
    
    const spotPlays = await SituationalAnalysisService.identifySpotPlays(
      sport,
      date
    );
    
    res.json({
      success: true,
      data: spotPlays
    });
  } catch (error) {
    console.error('❌ Error identifying spot plays:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Analyze psychological edges
router.get('/psychological-edges', async (req, res) => {
  try {
    const { sport, gameId } = req.query;
    
    const edges = await SituationalAnalysisService.analyzePsychologicalEdges(
      sport,
      gameId
    );
    
    res.json({
      success: true,
      data: edges
    });
  } catch (error) {
    console.error('❌ Error analyzing psychological edges:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Analyze weather impacts
router.get('/weather-impacts', async (req, res) => {
  try {
    const { sport, location, gameTime } = req.query;
    
    const impacts = await SituationalAnalysisService.analyzeWeatherImpacts(
      sport,
      location,
      gameTime
    );
    
    res.json({
      success: true,
      data: impacts
    });
  } catch (error) {
    console.error('❌ Error analyzing weather impacts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Find live betting opportunities
router.get('/live-betting', async (req, res) => {
  try {
    const { sport, gameState } = req.query;
    
    const opportunities = await SituationalAnalysisService.findLiveBettingOpportunities(
      sport,
      gameState ? JSON.parse(gameState) : {}
    );
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('❌ Error finding live betting opportunities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Calculate live expected value
router.post('/live-ev', async (req, res) => {
  try {
    const { currentOdds, modelProbability, gameState } = req.body;
    
    const ev = SituationalAnalysisService.calculateLiveEV(
      currentOdds,
      modelProbability,
      gameState
    );
    
    res.json({
      success: true,
      data: ev
    });
  } catch (error) {
    console.error('❌ Error calculating live EV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
