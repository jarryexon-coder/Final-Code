const express = require('express');
const router = express.Router();

// Simple auth health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth system is available',
    features: ['JWT tokens', 'Protected routes', 'User sessions'],
    timestamp: new Date().toISOString()
  });
});

// Mock login endpoint (for testing)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    // In a real app, you'd validate credentials
    res.json({
      success: true,
      token: 'mock-jwt-token-for-testing',
      user: {
        id: 1,
        email: email,
        name: 'Test User'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email and password required'
    });
  }
});

module.exports = router;
