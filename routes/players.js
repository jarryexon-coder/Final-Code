import express from 'express';
const router = express.Router();

// GET /api/players
router.get('/', (req, res) => {
  res.json({
    message: 'players API endpoint',
    status: 'active',
    version: '1.0',
    timestamp: new Date().toISOString(),
    availableMethods: ['GET /', 'GET /test', 'GET /health']
  });
});

// GET /api/players/test
router.get('/test', (req, res) => {
  res.json({
    message: 'players test endpoint',
    success: true,
    data: {
      sample: 'Test data',
      count: 100,
      active: true
    }
  });
});

// GET /api/players/health
router.get('/health', (req, res) => {
  res.json({
    service: 'players',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
