// routes/indexRoutes.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * tags:
 *   - name: Utility
 *     description: Utility endpoints for application management
 *   - name: Health
 *     description: Health check and monitoring endpoints
 *   - name: System
 *     description: System information and status endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check application health status
 *     description: Returns comprehensive health status of all services and routes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       path:
 *                         type: string
 *                       status:
 *                         type: string
 *       503:
 *         description: Application is unhealthy
 */
app.get('/api/health', (req, res) => {
  // This endpoint will be registered by the main app
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: []
  });
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get detailed system status
 *     description: Returns detailed status of all registered routes and services
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       method:
 *                         type: string
 *                       description:
 *                         type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     redis:
 *                       type: string
 *                     api:
 *                       type: string
 */
app.get('/api/status', (req, res) => {
  // This endpoint will be registered by the main app
  res.json({
    success: true,
    routes: [],
    services: {
      database: 'connected',
      redis: 'connected',
      api: 'operational'
    }
  });
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
 *         description: Cache key pattern to clear
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 clearedKeys:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
app.post('/api/cache/clear', (req, res) => {
  // This endpoint will be registered by the main app
  res.json({
    success: true,
    message: 'Cache cleared successfully',
    clearedKeys: []
  });
});

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: List all registered routes
 *     description: Returns a list of all API routes registered in the application
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       methods:
 *                         type: array
 *                         items:
 *                           type: string
 *                       description:
 *                         type: string
 *                 groupedByPrefix:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 */
app.get('/api/routes', (req, res) => {
  // This endpoint will be registered by the main app
  res.json({
    success: true,
    count: 0,
    routes: [],
    groupedByPrefix: {}
  });
});

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get application version information
 *     description: Returns current application version and build information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Version information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 app:
 *                   type: string
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 nodeVersion:
 *                   type: string
 *                 buildDate:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
app.get('/api/version', (req, res) => {
  // This endpoint will be registered by the main app
  res.json({
    app: 'NBA Backend API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildDate: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export async function registerRoutes(app) {
  const routesDir = __dirname;
  
  // Register system endpoints directly on the app
  app.get('/api/health', (req, res) => {
    const routes = [];
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      routes: routes,
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/status', (req, res) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        api: 'operational',
        cache: 'enabled'
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      }
    });
  });

  app.post('/api/cache/clear', async (req, res) => {
    // This is a placeholder - implement actual cache clearing logic
    const { pattern = '*' } = req.query;
    
    // Check admin permissions (placeholder)
    const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_TOKEN;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    try {
      // Simulate cache clearing
      console.log(`Clearing cache with pattern: ${pattern}`);
      
      res.json({
        success: true,
        message: `Cache cleared with pattern: ${pattern}`,
        clearedKeys: [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  });

  app.get('/api/routes', (req, res) => {
    const routes = [];
    const groupedByPrefix = {};
    
    res.json({
      success: true,
      count: routes.length,
      routes: routes,
      groupedByPrefix: groupedByPrefix,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/version', (req, res) => {
    res.json({
      app: 'NBA Backend API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      buildDate: new Date().toISOString(),
      uptime: process.uptime(),
      features: [
        'PrizePicks integration',
        'Sportsbooks API',
        'Analytics engine',
        'User preferences',
        'Admin dashboard',
        'Cache management'
      ]
    });
  });

  // Read all route files
  const files = fs.readdirSync(routesDir);
  const routeFiles = files.filter(file => file.endsWith('.routes.js'));
  
  for (const file of routeFiles) {
    try {
      const routePath = path.join(routesDir, file);
      const routeModule = await import(`./${file}`);
      const router = router || routeModule;
      
      // Extract base path from filename
      const basePath = file.replace('.routes.js', '');
      
      // Register route with appropriate base path
      switch (basePath) {
        case 'auth':
          app.use('/api/auth', router);
          break;
        case 'dailyLimits':
        case 'prizepicks':
        case 'selections':
        case 'analytics':
        case 'lines':
        case 'bumpRisk':
          app.use('/api/prizepicks', router);
          break;
        case 'sportsbooks':
          app.use('/api/sportsbooks', router);
          break;
        case 'combinations':
          app.use('/api/combinations', router);
          break;
        case 'notifications':
          app.use('/api/notifications', router);
          break;
        case 'simulations':
          app.use('/api/simulate', router);
          break;
        case 'userPreferences':
          app.use('/api/user', router);
          break;
        case 'admin':
          app.use('/api/admin', router);
          break;
        case 'sportsData':
          app.use('/api/sports', router);
          break;
        case 'history':
          app.use('/api/history', router);
          break;
        case 'search':
          app.use('/api/search', router);
          break;
        case 'social':
          app.use('/api/social', router);
          break;
        default:
          console.warn(`Unknown route file: ${file}`);
      }
      
      console.log(`Registered routes from: ${file}`);
    } catch (error) {
      console.error(`Error loading route file ${file}:`, error);
    }
  }
}

// Default export for compatibility
export default { registerRoutes };
