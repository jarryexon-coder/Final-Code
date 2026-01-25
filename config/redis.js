// config/redis.js - FIXED VERSION
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Internal variable (not exported)
let _redisClient = null;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
};

// Create Redis client
export const createRedisClient = () => {
  if (_redisClient) return _redisClient;

  try {
    if (process.env.REDIS_URL) {
      _redisClient = new Redis(process.env.REDIS_URL, redisConfig);
    } else {
      _redisClient = new Redis(redisConfig);
    }

    // Event listeners
    _redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    _redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    _redisClient.on('error', (error) => {
      console.error('❌ Redis error:', error.message);
    });

    _redisClient.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    _redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    return _redisClient;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error.message);
    return null;
  }
};

// Get Redis client
export const getRedisClient = () => {
  if (!_redisClient) {
    return createRedisClient();
  }
  return _redisClient;
};

// Check Redis connection
export const checkRedisConnection = async () => {
  try {
    const client = getRedisClient();
    if (!client) return { connected: false, error: 'Client not initialized' };
    
    const pong = await client.ping();
    return { 
      connected: true, 
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db
    };
  } catch (error) {
    return { 
      connected: false, 
      error: error.message,
      host: redisConfig.host,
      port: redisConfig.port
    };
  }
};

// Cache operations
export const cacheOperations = {
  // Set cache with TTL
  set: async (key, value, ttlSeconds = 3600) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.set(key, stringValue, 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return null;
      
      const value = await client.get(key);
      if (!value) return null;
      
      // Try to parse JSON, if fails return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  // Get multiple keys
  mget: async (keys) => {
    try {
      const client = getRedisClient();
      if (!client) return [];
      
      const values = await client.mget(keys);
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error.message);
      return [];
    }
  },

  // Set multiple keys
  mset: async (keyValuePairs, ttlSeconds = 3600) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const pipeline = client.pipeline();
      
      keyValuePairs.forEach(([key, value]) => {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
        pipeline.set(key, stringValue, 'EX', ttlSeconds);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error.message);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return false;
    }
  },

  // Increment key
  incr: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return 0;
      
      return await client.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error.message);
      return 0;
    }
  },

  // Set with TTL if not exists
  setnx: async (key, value, ttlSeconds = 3600) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      const result = await client.set(key, stringValue, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Cache setnx error:', error.message);
      return false;
    }
  },

  // Get keys by pattern
  keys: async (pattern) => {
    try {
      const client = getRedisClient();
      if (!client) return [];
      
      return await client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error.message);
      return [];
    }
  },

  // Flush all cache (use with caution!)
  flushAll: async () => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  },

  // Get TTL
  ttl: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return -2;
      
      return await client.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error.message);
      return -2;
    }
  },

  // Set hash field
  hset: async (key, field, value) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.hset(key, field, stringValue);
      return true;
    } catch (error) {
      console.error('Cache hset error:', error.message);
      return false;
    }
  },

  // Get hash field
  hget: async (key, field) => {
    try {
      const client = getRedisClient();
      if (!client) return null;
      
      const value = await client.hget(key, field);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Cache hget error:', error.message);
      return null;
    }
  },

  // Get all hash fields
  hgetall: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return {};
      
      const hash = await client.hgetall(key);
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error.message);
      return {};
    }
  },

  // Delete hash field
  hdel: async (key, field) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.hdel(key, field);
      return true;
    } catch (error) {
      console.error('Cache hdel error:', error.message);
      return false;
    }
  }
};

// Rate limiting
export const rateLimit = {
  // Check rate limit
  check: async (key, limit, windowSeconds = 60) => {
    try {
      const client = getRedisClient();
      if (!client) return { allowed: true, remaining: limit, reset: 0 };
      
      const current = await client.get(key);
      const currentCount = current ? parseInt(current) : 0;
      
      if (currentCount >= limit) {
        const ttl = await client.ttl(key);
        return { 
          allowed: false, 
          remaining: 0, 
          reset: ttl > 0 ? ttl : windowSeconds 
        };
      }
      
      // Increment or set with TTL
      if (!current) {
        await client.setex(key, windowSeconds, 1);
      } else {
        await client.incr(key);
      }
      
      const newCount = currentCount + 1;
      const ttl = await client.ttl(key);
      
      return { 
        allowed: true, 
        remaining: limit - newCount, 
        reset: ttl > 0 ? ttl : windowSeconds 
      };
    } catch (error) {
      console.error('Rate limit check error:', error.message);
      return { allowed: true, remaining: limit, reset: 0 };
    }
  },

  // Get rate limit info
  getInfo: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return { current: 0, ttl: 0 };
      
      const current = await client.get(key);
      const ttl = await client.ttl(key);
      
      return { 
        current: current ? parseInt(current) : 0,
        ttl: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      console.error('Rate limit info error:', error.message);
      return { current: 0, ttl: 0 };
    }
  },

  // Reset rate limit
  reset: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Rate limit reset error:', error.message);
      return false;
    }
  }
};

// Session management
export const sessionStore = {
  // Store session
  setSession: async (sessionId, data, ttlSeconds = 86400) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Session set error:', error.message);
      return false;
    }
  },

  // Get session
  getSession: async (sessionId) => {
    try {
      const client = getRedisClient();
      if (!client) return null;
      
      const data = await client.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Session get error:', error.message);
      return null;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      await client.del(`session:${sessionId}`);
      return true;
    } catch (error) {
      console.error('Session delete error:', error.message);
      return false;
    }
  }
};

// Health check
export const healthCheck = async () => {
  const redisHealth = await checkRedisConnection();
  
  return {
    service: 'redis',
    status: redisHealth.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    details: redisHealth,
    dependencies: {
      redis: redisHealth.connected ? 'connected' : 'disconnected'
    }
  };
};

// Initialize Redis client on import
const redisClient = createRedisClient();

// Export for direct use
export { redisClient };

export default {
  createRedisClient,
  getRedisClient,
  checkRedisConnection,
  cacheOperations,
  rateLimit,
  sessionStore,
  healthCheck,
  redisClient
};
