import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.client;
    
    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('Too many retries on Redis. Giving up.');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return null;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async mget(keys) {
    try {
      if (!this.isConnected) await this.connect();
      const values = await this.client.mGet(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      return [];
    }
  }

  async keys(pattern) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async flush() {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async increment(key) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async addToSet(key, value) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.sAdd(key, value);
      return true;
    } catch (error) {
      console.error('Redis addToSet error:', error);
      return false;
    }
  }

  async getSet(key) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.sMembers(key);
    } catch (error) {
      console.error('Redis getSet error:', error);
      return [];
    }
  }
}

export default new RedisClient();
