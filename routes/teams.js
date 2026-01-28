import express from 'express';
const router = express.Router();

// GET /api/teams
router.get('/', (req, res) => {
  res.json({
    message: 'teams API endpoint',
    status: 'active',
    version: '1.0',
    timestamp: new Date().toISOString(),
    availableMethods: ['GET /', 'GET /test', 'GET /health']
  });
});

// GET /api/teams/test
router.get('/test', (req, res) => {
  res.json({
    message: 'teams test endpoint',
    success: true,
    data: {
      sample: 'Test data',
      count: 100,
      active: true
    }
  });
});

// GET /api/teams/health
router.get('/health', (req, res) => {
  res.json({
    service: 'teams',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
