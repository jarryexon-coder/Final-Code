// server.js - FINAL VERSION WITH ALL ENHANCEMENTS
// ====================
// IMPORTS & INITIALIZATION
// ====================

console.log('🚀 NBA Fantasy AI Backend - Production Ready');

// 1. Environment & Monitoring Setup
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import schedule from 'node-schedule';

// Monitoring & Logging
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import winston from 'winston';
import expressStatusMonitor from 'express-status-monitor';

// Caching
import Redis from 'ioredis';

// Documentation
import swaggerUi from 'swagger-ui-express';
import { setupSwagger, swaggerSpec } from './config/swagger.js';

// Custom modules
import { cache } from './services/cache.js';
import { logger, morganMiddleware } from './utils/logger.js';

// ====================
// SENTRY CONFIGURATION
// ====================
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log('✅ Sentry monitoring enabled');
}

// ====================
// EXPRESS APP SETUP
// ====================
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// CORS CONFIGURATION
// ====================
const allowedOrigins = [
  'https://februaryfantasy-production.up.railway.app',
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.RAILWAY_PUBLIC_DOMAIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.railway.app')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}));

app.options('*', cors());

// ====================
// REQUEST MONITORING
// ====================
app.use(expressStatusMonitor({
  title: 'NBA Fantasy API Status',
  path: '/status',
  spans: [
    { interval: 1, retention: 60 },
    { interval: 5, retention: 60 },
    { interval: 15, retention: 60 }
  ],
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health',
      port: PORT
    },
    {
      protocol: 'http',
      host: 'localhost',
      path: '/railway-health',
      port: PORT
    }
  ]
}));

// ====================
// SECURITY & MIDDLEWARE
// ====================
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ====================
// HEALTH ENDPOINTS (IMMEDIATE)
// ====================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Application health check
 *     description: Returns the health status of the application
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
 *                 version:
 *                   type: string
 *                   example: "5.0.0"
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * /railway-health:
 *   get:
 *     summary: Railway-specific health check
 *     description: Simplified health check for Railway's monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 */
app.get('/railway-health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'NBA Fantasy API'
  });
});

// ====================
// API DOCUMENTATION
// ====================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ====================
// API ROUTES LOADER
// ====================
const loadRoutes = async () => {
  const routes = [
    // Core NBA Routes
    { path: '/api/nba', file: './routes/nbaRoutes.js', priority: 1 },
    { path: '/api/games', file: './routes/games.js', priority: 1 },
    { path: '/api/players', file: './routes/players.js', priority: 1 },
    { path: '/api/teams', file: './routes/teamsRoutes.js', priority: 1 },
    
    // Fantasy Routes
    { path: '/api/fantasy', file: './routes/fantasyRoutes.js', priority: 1 },
    { path: '/api/fantasy/draft', file: './routes/fantasyDraftRoutes.js', priority: 2 },
    { path: '/api/fantasy/lineup', file: './routes/fantasyLineupRoutes.js', priority: 2 },
    
    // Predictions & Betting
    { path: '/api/predictions', file: './routes/predictions.js', priority: 1 },
    { path: '/api/betting', file: './routes/betting.js', priority: 1 },
    
    // Authentication
    { path: '/api/auth', file: './routes/authRoutes.js', priority: 1 },
    
    // Other Sports
    { path: '/api/nfl', file: './routes/nflRoutes.js', priority: 3 },
    { path: '/api/nhl', file: './routes/nhlRoutes.js', priority: 3 },
    
    // News & Content
    { path: '/api/news', file: './routes/news.js', priority: 2 },
    
    // PrizePicks
    { path: '/api/prizepicks', file: './routes/prizepicksRoutes.js', priority: 2 },
    
    // Utility Routes
    { path: '/api/analytics', file: './routes/analytics.js', priority: 3 },
    { path: '/api/cache', file: './routes/cacheRoutes.js', priority: 3 },
    { path: '/api/search', file: './routes/searchRoutes.js', priority: 3 },
    { path: '/api/monitoring', file: './routes/monitoringRoutes.js', priority: 3 },
  ];

  // Load routes by priority
  for (const priority of [1, 2, 3]) {
    const priorityRoutes = routes.filter(route => route.priority === priority);
    
    for (const route of priorityRoutes) {
      try {
        const module = await import(route.file);
        if (module.default) {
          app.use(route.path, module.default);
          logger.info(`✅ Loaded ${route.path} from ${route.file}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to load ${route.path}: ${error.message}`);
      }
      
      // Small delay between loads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

// ====================
// SAFE SCHEDULER
// ====================
let schedulerJob = null;
let lastNBACall = 0;
const NBA_CALL_INTERVAL = 300000; // 5 minutes

async function safeFetchNBAData() {
  const now = Date.now();
  if (now - lastNBACall < NBA_CALL_INTERVAL) {
    const remaining = Math.round((NBA_CALL_INTERVAL - (now - lastNBACall)) / 1000);
    logger.info(`NBA fetch throttled: ${remaining}s remaining`);
    return;
  }
  
  lastNBACall = now;
  logger.info('🔄 SAFE NBA data fetch started');
  
  try {
    // Try to import and call the fetch function
    const nbaModule = await import('./routes/nbaRoutes.js');
    
    if (nbaModule.fetchNBAData && typeof nbaModule.fetchNBAData === 'function') {
      const result = await nbaModule.fetchNBAData();
      logger.info(`✅ NBA data fetched: ${result.totalGames || 0} games`);
      
      // Cache the results
      if (result.games) {
        await cache.set('nba:latest_games', result.games, 300);
      }
    } else {
      logger.warn('No fetchNBAData function found in nbaRoutes.js');
    }
  } catch (error) {
    logger.error(`❌ NBA fetch error: ${error.message}`);
    Sentry.captureException(error);
  }
}

function initializeSafeScheduler() {
  logger.info('⏰ Initializing safe scheduler (every 5 minutes)');
  
  // Schedule every 5 minutes
  schedulerJob = schedule.scheduleJob('*/5 * * * *', async () => {
    logger.info('⏰ Scheduled NBA data fetch triggered');
    await safeFetchNBAData();
  });
  
  // Initial fetch after 30 seconds
  setTimeout(() => {
    logger.info('🚀 Running initial NBA data fetch');
    safeFetchNBAData();
  }, 30000);
  
  return schedulerJob;
}

// ====================
// START SERVER FUNCTION
// ====================
async function startServer() {
  logger.info('🔍 Starting NBA Fantasy AI Backend...');
  logger.info(`PORT: ${PORT}, NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // 1. Connect to MongoDB
    logger.info('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    logger.info('✅ MongoDB connected successfully');
    
    // 2. Load API routes
    logger.info('📦 Loading API routes...');
    await loadRoutes();
    
    // 3. Initialize scheduler (delayed start)
    logger.info('⏰ Scheduling background tasks...');
    setTimeout(() => {
      initializeSafeScheduler();
    }, 60000); // Wait 1 minute before starting scheduler
    
    // 4. Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🎉 Server listening on ${HOST}:${PORT}`);
      logger.info(`📚 API Docs: http://${HOST}:${PORT}/api-docs`);
      logger.info(`📊 Status: http://${HOST}:${PORT}/status`);
      logger.info(`🏥 Health: http://${HOST}:${PORT}/health`);
      logger.info('✅ NBA Fantasy AI Backend is ready!');
    });
    
    // 5. Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      // Cancel scheduler
      if (schedulerJob) {
        schedulerJob.cancel();
        logger.info('✅ Scheduler cancelled');
      }
      
      // Close MongoDB
      try {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed');
      } catch (error) {
        logger.error(`❌ MongoDB close error: ${error.message}`);
      }
      
      // Close server
      server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('⚠️ Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Error handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
      Sentry.captureException(reason);
    });
    
    process.on('uncaughtException', (error) => {
      logger.error(`❌ Uncaught Exception: ${error.message}`);
      logger.error(error.stack);
      Sentry.captureException(error);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    logger.error(error.stack);
    Sentry.captureException(error);
    process.exit(1);
  }
}

// ====================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ====================
app.use(Sentry.Handlers.errorHandler());

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error(`Global error: ${error.message}`);
  logger.error(error.stack);
  
  Sentry.captureException(error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// ====================
// START THE SERVER
// ====================
startServer();

export { app };
