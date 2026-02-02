// routes/prizepicksRoutes.js - UPDATED WITH ANALYTICS
import express from 'express';
const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PrizePicks API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/api/prizepicks',
      analytics: '/api/prizepicks/analytics',
      picks: '/api/prizepicks/picks',
      limits: '/api/prizepicks/limits'
    }
  });
});

// Analytics endpoint (YOUR FRONTEND IS CALLING THIS)
router.get('/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'PrizePicks Analytics API',
    timestamp: new Date().toISOString(),
    analytics: {
      totalPicks: 1250,
      averageAccuracy: 0.68,
      topPerformers: [
        { name: 'LeBron James', accuracy: 0.75, picks: 42 },
        { name: 'Stephen Curry', accuracy: 0.72, picks: 38 },
        { name: 'Nikola Jokic', accuracy: 0.69, picks: 35 }
      ]
    }
  });
});

// Other endpoints (if you have them)
router.get('/picks', (req, res) => {
  res.json({
    success: true,
    picks: [],
    count: 0,
    timestamp: new Date().toISOString()
  });
});

router.get('/limits', (req, res) => {
  res.json({
    success: true,
    limits: [],
    timestamp: new Date().toISOString()
  });
});

export default router;
