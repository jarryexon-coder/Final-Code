const express = require('express');
const router = express.Router();

console.log('🔄 Loading influencer-test routes...');

// Health endpoint
router.get('/health', (req, res) => {
  console.log('✅ /health endpoint hit');
  res.json({
    success: true,
    message: 'Influencer system is running - TEST VERSION',
    timestamp: new Date().toISOString()
  });
});

// Public influencer directory
router.get('/directory/public', (req, res) => {
  console.log('✅ /directory/public endpoint hit');
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        username: 'NBAInfluencer',
        social_handle: '@nba_influencer'
      }
    ]
  });
});

console.log('✅ All routes defined in influencer-test.js');
module.exports = router;
