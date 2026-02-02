// middleware/cacheMiddleware.js
import { cache } from '../services/cache.js';

export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Don't cache if bypass header is present
    if (req.headers['x-cache-bypass'] === 'true') {
      return next();
    }
    
    const key = `api:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      // Try to get from cache
      const cachedData = await cache.get(key);
      
      if (cachedData) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', key);
        res.setHeader('Cache-Control', `public, max-age=${duration}`);
        
        return res.json({
          ...cachedData,
          _cached: true,
          _cachedAt: new Date().toISOString()
        });
      }
      
      // If not cached, override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, data, duration).catch(err => {
            console.error('Cache set error:', err.message);
          });
        }
        
        // Add cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', key);
        res.setHeader('Cache-Control', `public, max-age=${duration}`);
        
        // Call original method
        return originalJson.call(this, {
          ...data,
          _cached: false,
          _generatedAt: new Date().toISOString()
        });
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

// ADD THIS LINE: Export as default for compatibility with ES6 modules
export default cacheMiddleware;
