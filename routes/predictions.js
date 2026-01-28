import express from 'express';
const router = express.Router();

// PREDICTIONS endpoints
router.get('/', (req, res) => {
  res.json({ 
    message: 'predictions endpoint is working',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  res.json({ 
    message: 'predictions test endpoint',
    available: true
  });
});

export default router;
