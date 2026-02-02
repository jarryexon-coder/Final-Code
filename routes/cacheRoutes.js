import express from 'express';
import { invalidateCache } from '../middleware/cache.js';
import redisClient from '../redisClient.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "cache API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieve Redis cache statistics including key count, memory usage, and hit/miss rates
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   $ref: '#/components/schemas/CacheStats'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error or Redis unavailable
 */
router.get('/stats', async (req, res) => {
  try {
    const info = await redisClient.client.info();
    const keys = await redisClient.keys('*');
    
    const stats = {
      totalKeys: keys.length,
      connectedClients: info.split('\n').find(line => line.startsWith('connected_clients')),
      usedMemory: info.split('\n').find(line => line.startsWith('used_memory_human')),
      hits: await redisClient.get('cache:stats:hits') || 0,
      misses: await redisClient.get('cache:stats:misses') || 0
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/cache/invalidate:
 *   post:
 *     summary: Invalidate cache by patterns
 *     description: Invalidate specific cache entries using key patterns (Admin only)
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patterns
 *             properties:
 *               patterns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nba:*", "games:*", "user:*"]
 *                 description: Array of Redis key patterns to invalidate
 *     responses:
 *       200:
 *         description: Cache invalidated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patternsCount:
 *                   type: integer
 *       400:
 *         description: Invalid request - patterns array required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/invalidate', async (req, res) => {
  try {
    const { patterns } = req.body;
    
    if (!patterns || !Array.isArray(patterns)) {
      return res.status(400).json({
        success: false,
        error: 'Patterns array is required'
      });
    }
    
    const result = await invalidateCache(patterns);
    
    res.json({
      success: result,
      message: `Invalidated cache for ${patterns.length} pattern(s)`,
      patternsCount: patterns.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear application cache
 *     description: Clear Redis and memory cache (Admin only)
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *         description: Cache key pattern to clear (if not provided, clears all)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/clear', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      // Clear specific pattern only
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
        clearedKeys: keys.length
      });
    } else {
      // Clear all cache
      await redisClient.flush();
      
      res.json({
        success: true,
        message: 'All cache cleared successfully'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/cache/keys:
 *   get:
 *     summary: Get cache keys by pattern
 *     description: Retrieve list of cache keys matching a pattern (Admin only)
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *           default: "*"
 *         description: Redis key pattern to search (supports * wildcard)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Maximum number of keys to return
 *     responses:
 *       200:
 *         description: Cache keys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: string
 *                 pattern:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/keys', async (req, res) => {
  try {
    const { pattern = '*', limit = 100 } = req.query;
    const keys = await redisClient.keys(pattern);
    const limitedKeys = keys.slice(0, Math.min(parseInt(limit), 1000));
    
    res.json({
      success: true,
      count: limitedKeys.length,
      totalCount: keys.length,
      keys: limitedKeys,
      pattern
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/cache/ttl/{key}:
 *   get:
 *     summary: Get cache key TTL (Time To Live)
 *     description: Retrieve remaining time to live for a specific cache key
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to check
 *     responses:
 *       200:
 *         description: TTL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 key:
 *                   type: string
 *                 ttl:
 *                   type: integer
 *                   description: Time to live in seconds (-1 for no expiry, -2 for key not found)
 *                 exists:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/ttl/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const ttl = await redisClient.ttl(key);
    
    res.json({
      success: true,
      key,
      ttl,
      exists: ttl >= -1
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/cache/info:
 *   get:
 *     summary: Get detailed Redis server information
 *     description: Retrieve comprehensive Redis server information and configuration
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Redis info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 info:
 *                   $ref: '#/components/schemas/RedisInfo'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/info', async (req, res) => {
  try {
    const info = await redisClient.client.info();
    
    // Parse the INFO response into structured format
    const infoSections = {};
    let currentSection = 'server';
    
    info.split('\n').forEach(line => {
      if (line.startsWith('#')) {
        currentSection = line.substring(2).toLowerCase();
        infoSections[currentSection] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (infoSections[currentSection]) {
          infoSections[currentSection][key.trim()] = value.trim();
        }
      }
    });
    
    res.json({
      success: true,
      info: infoSections
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CacheStats:
 *       type: object
 *       properties:
 *         totalKeys:
 *           type: integer
 *           description: Total number of keys in cache
 *         connectedClients:
 *           type: string
 *           description: Number of connected Redis clients
 *         usedMemory:
 *           type: string
 *           description: Human-readable memory usage
 *         hits:
 *           type: integer
 *           description: Cache hit count
 *         misses:
 *           type: integer
 *           description: Cache miss count
 *         hitRate:
 *           type: number
 *           description: Cache hit rate percentage
 *           readOnly: true
 *     
 *     RedisInfo:
 *       type: object
 *       properties:
 *         server:
 *           type: object
 *           description: Redis server information
 *         clients:
 *           type: object
 *           description: Client connections information
 *         memory:
 *           type: object
 *           description: Memory usage information
 *         stats:
 *           type: object
 *           description: General statistics
 *         replication:
 *           type: object
 *           description: Replication information
 *         cpu:
 *           type: object
 *           description: CPU usage information
 *         keyspace:
 *           type: object
 *           description: Database keyspace information
 *     
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;
