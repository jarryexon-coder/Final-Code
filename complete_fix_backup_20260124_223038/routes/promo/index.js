const express = require('express');
const router = express.Router();

// Use existing promo routes
const validateRouter = require('./validate');
const applyRouter = require('./apply');
const publicRouter = require('./public');
const enhancedRouter = require('./enhanced'); // Our enhanced version

// Mount all promo routes
router.use('/validate', validateRouter);
router.use('/apply', applyRouter);
router.use('/public', publicRouter);

// Add enhanced endpoints
router.get('/enhanced/public', enhancedRouter.get('/public'));
router.post('/enhanced/validate', enhancedRouter.post('/validate'));
router.post('/enhanced/apply', enhancedRouter.post('/apply'));

// Health check for promo system
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Promo system is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
