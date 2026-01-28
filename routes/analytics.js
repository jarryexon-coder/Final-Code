import express from 'express';
const router = express.Router();

// ANALYTICS endpoints
router.get('/', (req, res) => {
  res.json({ 
    message: 'analytics endpoint is working',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  res.json({ 
    message: 'analytics test endpoint',
    available: true
  });
});

export default router;
