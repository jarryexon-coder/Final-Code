import express from 'express';
const router = express.Router();

// SECRET-PHRASES endpoints
router.get('/', (req, res) => {
  res.json({ 
    message: 'secret-phrases endpoint is working',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  res.json({ 
    message: 'secret-phrases test endpoint',
    available: true
  });
});

export default router;
