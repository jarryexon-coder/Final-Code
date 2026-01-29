import express from 'express';
const router = express.Router();

// Simple test endpoints
router.get('/register', (req, res) => {
  res.json({ test: 'GET /api/auth/register works!' });
});

router.post('/register', (req, res) => {
  res.json({ test: 'POST /api/auth/register works!', body: req.body });
});

router.get('/login', (req, res) => {
  res.json({ test: 'GET /api/auth/login works!' });
});

router.post('/login', (req, res) => {
  res.json({ test: 'POST /api/auth/login works!', body: req.body });
});

export default router;
