// routes/nbaRoutes-patch.js
// EMERGENCY: Completely disable aggressive 60/min scheduler

export default function createSafeNBARouter() {
  const express = require('express');
  const router = express.Router();
  
  // Simple NBA endpoints without scheduler
  router.get('/', (req, res) => {
    res.json({
      message: 'NBA API (EMERGENCY SAFE MODE)',
      status: 'operational',
      warning: 'Aggressive scheduler DISABLED',
      endpoints: ['/games', '/players', '/teams']
    });
  });
  
  router.get('/games', async (req, res) => {
    try {
      // Minimal safe fetch
      res.json({ games: [], message: 'Safe mode active' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/players', (req, res) => {
    res.json({ players: [], message: 'Safe mode active' });
  });
  
  router.get('/teams', (req, res) => {
    res.json({ teams: [], message: 'Safe mode active' });
  });
  
  // EMERGENCY: Completely disable the scheduler
  if (typeof router.startScheduler === 'function') {
    console.log('🚨 DISABLED: router.startScheduler()');
    router.startScheduler = () => {
      console.log('🛑 EMERGENCY: Aggressive scheduler BLOCKED');
      return null;
    };
  }
  
  // Add fetchNBAData function that does nothing
  router.fetchNBAData = async () => {
    console.log('🛑 SAFE: fetchNBAData blocked (60/min issue)');
    return { success: true, message: 'Blocked for safety' };
  };
  
  return router;
}
