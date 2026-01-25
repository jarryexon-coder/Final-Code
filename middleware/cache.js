import redisClient from '../redisClient.js';

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        // Add cache hit header
        res.set('X-Cache', 'HIT');
        
        // Update cache hit counter
        await redisClient.increment(`stats:hits:${cacheKey}`);
        
        return res.json(cachedData);
      }
      
      // Add cache miss header
      res.set('X-Cache', 'MISS');
      
      // Store original send function
      const originalSend = res.send.bind(res);
      
      // Override send to cache response
      res.send = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            redisClient.set(cacheKey, parsedData, ttl);
            
            // Track cache miss
            redisClient.increment(`stats:misses:${cacheKey}`);
            
            // Add to recently cached list
            redisClient.addToSet('recently_cached', cacheKey);
          } catch (error) {
            console.error('Cache parse error:', error);
          }
        }
        
        originalSend(data);
      };
      
      next();
      
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Invalidate cache for specific patterns
const invalidateCache = async (patterns) => {
  try {
    const deletePromises = patterns.map(async (pattern) => {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
        console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
      }
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

// Cache stats middleware
const cacheStatsMiddleware = async (req, res, next) => {
  if (req.path === '/api/cache/stats') {
    try {
      const [hits, misses, recent] = await Promise.all([
        redisClient.keys('stats:hits:*'),
        redisClient.keys('stats:misses:*'),
        redisClient.getSet('recently_cached')
      ]);
      
      const stats = {
        totalHits: hits.length,
        totalMisses: misses.length,
        hitRate: hits.length / (hits.length + misses.length) || 0,
        recentCached: recent.length,
        memoryInfo: null
      };
      
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    next();
  }
};

export {
  cacheMiddleware,
  invalidateCache,
  cacheStatsMiddleware
};
