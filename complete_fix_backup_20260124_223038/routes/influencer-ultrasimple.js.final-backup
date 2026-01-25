const express = require('express');
const router = express.Router();

console.log('🔄 Loading ULTRA SIMPLE influencer routes...');

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test route works!' });
});

// Health endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Influencer system is running - ULTRA SIMPLE',
    timestamp: new Date().toISOString()
  });
});

// Public influencer directory
router.get('/directory/public', (req, res) => {
  res.json({
    success: true,
    influencers: [
      { id: 1, username: 'Test1' },
      { id: 2, username: 'Test2' }
    ]
  });
});

module.exports = router;
