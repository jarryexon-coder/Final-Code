import express from 'express';
import PremiumFeaturesService from '../services/PremiumFeaturesService.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "premium API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// GET: Check feature access
router.get('/check-access', async (req, res) => {
  try {
    const { userId, featureKey } = req.query;
    
    if (!userId || !featureKey) {
      return res.status(400).json({
        success: false,
        error: 'userId and featureKey are required'
      });
    }
    
    const access = await PremiumFeaturesService.canAccessFeature(userId, featureKey);
    
    res.json({
      success: true,
      data: access
    });
  } catch (error) {
    console.error('❌ Error checking feature access:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get user premium status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const status = await PremiumFeaturesService.getUserPremiumStatus(userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Error getting premium status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get available upgrades
router.get('/upgrades/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const upgrades = await PremiumFeaturesService.getAvailableUpgrades(userId);
    
    res.json({
      success: true,
      data: upgrades
    });
  } catch (error) {
    console.error('❌ Error getting upgrades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Process upgrade
router.post('/upgrade', async (req, res) => {
  try {
    const { userId, targetTier, paymentMethod } = req.body;
    
    if (!userId || !targetTier) {
      return res.status(400).json({
        success: false,
        error: 'userId and targetTier are required'
      });
    }
    
    const result = await PremiumFeaturesService.processUpgrade(
      userId,
      targetTier,
      paymentMethod
    );
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error processing upgrade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Track feature usage
router.post('/track-usage', async (req, res) => {
  try {
    const { userId, featureKey, metadata } = req.body;
    
    if (!userId || !featureKey) {
      return res.status(400).json({
        success: false,
        error: 'userId and featureKey are required'
      });
    }
    
    const result = await PremiumFeaturesService.trackFeatureUsage(
      userId,
      featureKey,
      metadata
    );
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error tracking feature usage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get premium analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = await PremiumFeaturesService.getPremiumAnalytics(timeRange);
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ Error getting premium analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Validate subscription
router.get('/validate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const validation = await PremiumFeaturesService.validateSubscription(userId);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('❌ Error validating subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get usage limits
router.get('/limits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { featureKey } = req.query;
    
    if (!featureKey) {
      return res.status(400).json({
        success: false,
        error: 'featureKey is required'
      });
    }
    
    const limits = await PremiumFeaturesService.getUsageLimits(userId, featureKey);
    
    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('❌ Error getting usage limits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
