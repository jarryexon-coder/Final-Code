const express = require('express');
const router = express.Router();

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  // In a real app, you'd verify JWT token
  const token = req.headers.authorization;
  
  if (token && token.includes('mock-jwt')) {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
};

// Apply promo code (protected)
router.post('/apply', mockAuthMiddleware, (req, res) => {
  const { code } = req.body;
  
  console.log(`🔐 User ${req.user.id} applying promo code: ${code}`);
  
  // Mock application logic
  if (code === 'TEST123') {
    res.json({
      success: true,
      message: 'Promo code applied successfully!',
      discount: '20% off',
      user: req.user
    });
  } else {
    res.json({
      success: false,
      error: 'Invalid promo code'
    });
  }
});

module.exports = router;
