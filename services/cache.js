// services/cache.js
import Redis from 'ioredis';
import NodeCache from 'node-cache';

class CacheService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new NodeCache({ 
      stdTTL: 300, 
      checkperiod: 60,
      useClones: false 
    });
    
    this.initRedis();
  }
  
  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            console.log(`Redis reconnecting in ${delay}ms`);
            return delay;
          },
          maxRetriesPerRequest: 3
        });
        
        this.redisClient.on('connect', () => {
          console.log('✅ Redis connected');
        });
        
        this.redisClient.on('error', (err) => {
          console.error('❌ Redis error:', err.message);
        });
      }
    } catch (error) {
      console.log('⚠️ Redis initialization failed, using memory cache only:', error.message);
    }
  }
  
  async get(key) {
    // Try memory cache first
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== undefined) {
      return memoryValue;
    }
    
    // Try Redis if available
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue !== null) {
          const parsedValue = JSON.parse(redisValue);
          // Store in memory cache for faster access
          this.memoryCache.set(key, parsedValue);
          return parsedValue;
        }
      } catch (error) {
        console.error('Redis get error:', error.message);
      }
    }
    
    return null;
  }
  
  async set(key, value, ttl = 300) {
    // Store in memory cache
    this.memoryCache.set(key, value, ttl);
    
    // Store in Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          key, 
          ttl, 
          JSON.stringify(value)
        );
      } catch (error) {
        console.error('Redis set error:', error.message);
      }
    }
  }
  
  async delete(key) {
    // Delete from memory cache
    this.memoryCache.del(key);
    
    // Delete from Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error('Redis delete error:', error.message);
      }
    }
  }
  
  async invalidate(pattern) {
    // Clear from memory cache
    const keys = this.memoryCache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.memoryCache.del(key);
      }
    });
    
    // Clear from Redis
    if (this.redisClient) {
      try {
        const redisKeys = await this.redisClient.keys(`*${pattern}*`);
        if (redisKeys.length > 0) {
          await this.redisClient.del(...redisKeys);
        }
      } catch (error) {
        console.error('Redis invalidate error:', error.message);
      }
    }
  }
  
  async getStats() {
    const stats = {
      memory: {
        keys: this.memoryCache.keys().length,
        hits: this.memoryCache.getStats().hits,
        misses: this.memoryCache.getStats().misses
      },
      redis: { connected: false }
    };
    
    if (this.redisClient) {
      try {
        const redisInfo = await this.redisClient.info();
        stats.redis.connected = true;
        stats.redis.info = redisInfo.split('\r\n').slice(0, 10);
      } catch (error) {
        stats.redis.error = error.message;
      }
    }
    
    return stats;
  }
}

export const cache = new CacheService();
