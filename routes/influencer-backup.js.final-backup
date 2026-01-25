const express = require('express');
const router = express.Router();

// Health endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Influencer system is running',
    timestamp: new Date().toISOString()
  });
});

// Public influencer directory
router.get('/directory/public', (req, res) => {
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        username: 'NBAInfluencer',
        social_handle: '@nba_influencer',
        total_commission: 500.00,
        referral_count: 25,
        influencer_code: 'NBAINFLUENCER',
        commission_rate: 15.00,
        uses_count: 10
      },
      {
        id: 2,
        username: 'BallIsLife',
        social_handle: '@ballislife',
        total_commission: 250.00,
        referral_count: 15,
        influencer_code: 'BALLISLIFE',
        commission_rate: 12.00,
        uses_count: 8
      }
    ]
  });
});

// Get influencer analytics
router.get('/:influencerId/analytics', (req, res) => {
  const { influencerId } = req.params;
  
  res.json({
    success: true,
    influencer: {
      id: parseInt(influencerId),
      username: 'Sample Influencer',
      email: 'influencer@example.com',
      total_commission: 500.00,
      referral_count: 25,
      social_handle: '@sample_influencer',
      is_influencer: true
    },
    codes: [
      {
        code: 'NBAINFLUENCER',
        commission_rate: 15.00,
        uses_count: 10,
        total_commission: 500.00,
        created_at: new Date().toISOString()
      },
      {
        code: 'SAMPLE20',
        commission_rate: 20.00,
        uses_count: 5,
        total_commission: 100.00,
        created_at: new Date().toISOString()
      }
    ],
    recentCommissions: [
      {
        amount: 25.00,
        transaction_type: 'promo_usage',
        status: 'completed',
        created_at: new Date().toISOString(),
        referred_user: 'user123'
      }
    ],
    dailyStats: [],
    summary: {
      totalCodes: 2,
      totalReferrals: 15,
      totalCommission: 600.00
    }
  });
});

// Generate influencer code
router.post('/generate-code', (req, res) => {
  const { influencerId, code, commissionRate = 10.00 } = req.body;
  
  const uniqueCode = code || `NBA${Date.now().toString(36).toUpperCase()}`;
  
  res.json({
    success: true,
    code: {
      id: Date.now(),
      influencer_id: influencerId,
      code: uniqueCode,
      commission_rate: commissionRate,
      uses_count: 0,
      total_commission: 0,
      created_at: new Date().toISOString()
    },
    message: `Code ${uniqueCode} generated successfully with ${commissionRate}% commission`
  });
});

module.exports = router;
