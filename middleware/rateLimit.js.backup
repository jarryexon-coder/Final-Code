const rateLimit = require('express-rate-limit');

// Rate limiter for promo endpoints
const promoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many promo code attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for influencer endpoints
const influencerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per hour
  message: {
    success: false,
    message: 'Too many influencer requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { promoLimiter, influencerLimiter };
