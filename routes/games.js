import express from 'express';
const router = express.Router();

// GET /api/games
router.get('/', (req, res) => {
  res.json({
    message: 'games API endpoint',
    status: 'active',
    version: '1.0',
    timestamp: new Date().toISOString(),
    availableMethods: ['GET /', 'GET /test', 'GET /health']
  });
});

// GET /api/games/test
router.get('/test', (req, res) => {
  res.json({
    message: 'games test endpoint',
    success: true,
    data: {
      sample: 'Test data',
      count: 100,
      active: true
    }
  });
});

// GET /api/games/health
router.get('/health', (req, res) => {
  res.json({
    service: 'games',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// GET /api/games/live
router.get("/live", (req, res) => {
  res.json({
    message: "Live games endpoint",
    games: [],
    timestamp: new Date().toISOString()
  });
});export default router;
