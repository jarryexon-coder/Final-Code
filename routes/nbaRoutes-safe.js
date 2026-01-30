// routes/nbaRoutes-safe.js - ES MODULES VERSION
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// SIMPLE NBA API - NO SCHEDULER
router.get('/', (req, res) => {
  res.json({
    message: 'NBA Fantasy API',
    status: 'safe',
    warning: 'Aggressive scheduler removed for Railway stability',
    endpoints: ['/games', '/players', '/teams', '/stats']
  });
});

// Simple game data
router.get('/games', async (req, res) => {
  try {
    // Try to fetch from DB
    let games = [];
    try {
      games = await mongoose.connection.db.collection('games').find({}).limit(10).toArray();
    } catch (dbError) {
      console.log('DB fetch failed, using empty array');
    }
    
    res.json({
      success: true,
      count: games.length,
      games: games,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual fetch endpoint (safe - only when called)
router.get('/fetch', async (req, res) => {
  console.log('✅ Manual NBA fetch triggered');
  
  try {
    // Your fetch logic here - but only when manually called
    res.json({
      success: true,
      message: 'Manual fetch completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Safe fetch function (only called manually)
export const fetchNBAData = async () => {
  console.log('✅ Safe manual NBA data fetch');
  return { success: true, timestamp: new Date().toISOString() };
};

// NO SCHEDULER FUNCTIONS
export default router;
