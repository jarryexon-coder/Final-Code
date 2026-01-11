// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

// Different tiers for different user types
export const freeUserLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Rate limit exceeded. Upgrade to premium for higher limits.' },
  standardHeaders: true,
  skip: (req) => req.user?.tier === 'premium'
});

export const premiumUserLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per window
  message: { error: 'Premium rate limit exceeded.' },
  standardHeaders: true
});

export const apiKeyLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // 5000 requests per hour per API key
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  message: { error: 'API key rate limit exceeded.' },
  standardHeaders: true
});
