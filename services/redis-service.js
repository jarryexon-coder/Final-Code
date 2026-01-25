// services/redis-service.js
import Redis from 'ioredis';

class RedisService {
  constructor() {
    this.redisUrl = process.env.REDIS_URL;
    this.client = null;
    this.init();
  }

  init() {
    try {
      if (!this.redisUrl) {
        console.warn('⚠️ REDIS_URL not found. Redis caching disabled.');
        this.client = null;
        return;
      }

      this.client = new Redis(this.redisUrl, {
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
      });

      this.client.on('ready', () => {
        console.log('✅ Redis is ready');
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.client) return null;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.client) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.client) return 0;
    
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
      return 0;
    }
  }

  async exists(key) {
    if (!this.client) return 0;
    
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('Redis exists error:', error);
      return 0;
    }
  }

  async expire(key, ttl) {
    if (!this.client) return false;
    
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.client) return false;
    
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async getKeys(pattern = '*') {
    if (!this.client) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  // PrizePicks specific caching
  async cachePrizePicks(selections) {
    const key = 'prizepicks:daily:selections';
    return await this.set(key, selections, 86400); // 24 hours
  }

  async getCachedPrizePicks() {
    const key = 'prizepicks:daily:selections';
    return await this.get(key);
  }

  async cacheUserDailyLimit(userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `user:${userId}:dailylimit:${today}`;
    return await this.set(key, { generated: true }, 86400);
  }

  async getUserDailyLimit(userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `user:${userId}:dailylimit:${today}`;
    return await this.get(key);
  }
}

// Export singleton instance
export default new RedisService();
