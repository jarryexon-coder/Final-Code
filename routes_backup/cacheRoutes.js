import express from 'express';
import { invalidateCache } from '../middleware/cache.js';
import redisClient from '../redisClient.js';

const router = express.Router();

// Get cache stats
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

// Invalidate specific cache
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
      message: `Invalidated cache for ${patterns.length} pattern(s)`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all cache
router.post('/clear', async (req, res) => {
  try {
    await redisClient.flush();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cache keys by pattern
router.get('/keys', async (req, res) => {
  try {
    const { pattern = '*' } = req.query;
    const keys = await redisClient.keys(pattern);
    
    res.json({
      success: true,
      count: keys.length,
      keys: keys.slice(0, 100)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
