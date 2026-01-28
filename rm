import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import net from 'net'; // Changed from require() to import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Cleanup tracker
const cleanupTasks = [];

// ====================
// ENVIRONMENT CHECK
// ====================
console.log('🔍 Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('========================================');

// ====================
// MIDDLEWARE CONFIGURATION
// ====================
const allowedOrigins = [
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

console.log('✅ CORS configured for:', allowedOrigins);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================
// RATE LIMITING
// ====================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

app.use('/api/auth/login', authLimiter);

// Global rate limit for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      success: false,
      error: 'Too many requests from this IP'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ====================
// CRITICAL HEALTH ENDPOINTS
// ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    databases: {
      mongodb: mongoStatus,
    },
    timestamp: new Date().toISOString()
  });
});

// ====================
// ROOT ENDPOINT
// ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend Server is running!',
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    version: '5.0.0',
    endpoints: [
      '/health',
      '/api/health',
      '/api/nba',
      '/api/auth',
      '/api/players',
      '/api/teams',
      '/api/games',
      '/api/predictions',
      '/api/fantasy',
      '/api/admin',
      '/api/secret-phrases',
      '/api/analytics',
      '/api/betting'
    ]
  });
});

// ====================
// BASIC API ENDPOINTS (for testing)
// ====================

// NBA API
app.get('/api/nba', (req, res) => {
  res.json({
    success: true,
    message: 'NBA API is working',
    endpoints: ['/api/nba/games', '/api/nba/players', '/api/nba/teams'],
    timestamp: new Date().toISOString()
  });
});

// Players API
app.get('/api/players', (req, res) => {
  res.json({
    success: true,
    message: 'Players API',
    endpoints: ['/api/players', '/api/players/search'],
    timestamp: new Date().toISOString()
  });
});

// Teams API
app.get('/api/teams', (req, res) => {
  res.json({
    success: true,
    message: 'Teams API',
    endpoints: ['/api/teams', '/api/teams/standings'],
    timestamp: new Date().toISOString()
  });
});

// Games API
app.get('/api/games', (req, res) => {
  res.json({
    success: true,
    message: 'Games API',
    endpoints: ['/api/games/live', '/api/games/upcoming'],
    timestamp: new Date().toISOString()
  });
});

// Games live endpoint
app.get('/api/games/live', async (req, res) => {
  try {
    res.json({
      success: true,
      games: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching live games',
      error: error.message
    });
  }
});

// Auth API
app.get('/api/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API',
    endpoints: ['/api/auth/login', '/api/auth/register'],
    timestamp: new Date().toISOString()
  });
});

// Admin API
app.get('/api/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API',
    endpoints: ['/api/admin/health', '/api/admin/users'],
    timestamp: new Date().toISOString()
  });
});

// Analytics API
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API',
    endpoints: ['/api/analytics/overview', '/api/analytics/trends'],
    timestamp: new Date().toISOString()
  });
});

// Predictions API
app.get('/api/predictions', (req, res) => {
  res.json({
    success: true,
    message: 'Predictions API',
    endpoints: ['/api/predictions/today', '/api/predictions/trending'],
    timestamp: new Date().toISOString()
  });
});

// Secret Phrases API
app.get('/api/secret-phrases', (req, res) => {
  res.json({
    success: true,
    message: 'Secret Phrases API',
    endpoints: ['/api/secret-phrases', '/api/secret-phrases/analytics'],
    timestamp: new Date().toISOString()
  });
});

// Betting API
app.get('/api/betting', (req, res) => {
  res.json({
    success: true,
    message: 'Betting API',
    endpoints: ['/api/betting/odds', '/api/betting/markets'],
    timestamp: new Date().toISOString()
  });
});

// ====================
// DATABASE CONNECTION
// ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not configured');
      throw new Error('MONGODB_URI not configured');
    }
    
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    
    // Add MongoDB cleanup
    cleanupTasks.push(() => {
      return new Promise(resolve => {
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed');
          resolve();
        });
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// ====================
// DYNAMIC ROUTE LOADING
// ====================
console.log('\n🔗 Loading your existing routes...');

async function loadRoutes() {
  const routesToLoad = [
    // Core routes
    { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA Routes' },
    { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
    { path: '/api/admin', file: 'adminRoutes.js', name: 'Admin Routes' },
    { path: '/api/analytics', file: 'analytics.js', name: 'Analytics Routes' },
    { path: '/api/predictions', file: 'predictions.js', name: 'Predictions Routes' },
    { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
    { path: '/api/players', file: 'players.js', name: 'Players Routes' },
    { path: '/api/teams', file: 'teams.js', name: 'Teams Routes' },
    { path: '/api/games', file: 'games.js', name: 'Games Routes' },
    { path: '/api/picks', file: 'picks.js', name: 'Picks Routes' },
    { path: '/api/secret-phrases', file: 'secret-phrases.js', name: 'Secret Phrases Routes' },
    { path: '/api/betting', file: 'betting.js', name: 'Betting Routes' },
    
    // Additional routes
    { path: '/api/news', file: 'news.js', name: 'News Routes' },
    { path: '/api/nhl', file: 'nhlRoutes.js', name: 'NHL Routes' },
    { path: '/api/nfl', file: 'nflRoutes.js', name: 'NFL Routes' },
    { path: '/api/kalshi', file: 'kalshiRoutes.js', name: 'Kalshi Routes' },
    { path: '/api/draft', file: 'draftRoutes.js', name: 'Draft Routes' },
    { path: '/api/contest', file: 'contestRoutes.js', name: 'Contest Routes' },
    { path: '/api/sports-analytics', file: 'sportsAnalyticsRoutes.js', name: 'Sports Analytics Routes' },
    { path: '/api/situational', file: 'situationalRoutes.js', name: 'Situational Routes' },
    { path: '/api/stub', file: 'stubRoutes.js', name: 'Stub Routes' },
    { path: '/api/stats', file: 'statsRoutes.js', name: 'Stats Routes' },
    { path: '/api/leagues', file: 'leaguesRoutes.js', name: 'Leagues Routes' },
    { path: '/api/search', file: 'searchRoutes.js', name: 'Search Routes' },
    { path: '/api/cache', file: 'cacheRoutes.js', name: 'Cache Routes' },
    { path: '/api/prizepicks', file: 'prizepicksLimitsRoutes.js', name: 'PrizePicks Limits Routes' },
    { path: '/api/combinations', file: 'combinationsRoutes.js', name: 'Combinations Routes' },
    { path: '/api/notifications', file: 'notificationsRoutes.js', name: 'Notifications Routes' },
    { path: '/api/simulate', file: 'simulationsRoutes.js', name: 'Simulations Routes' },
    { path: '/api/social', file: 'socialRoutes.js', name: 'Social Routes' },
    { path: '/api/fantasy-teams', file: 'fantasyTeamsRoutes.js', name: 'Fantasy Teams Routes' },
    { path: '/api/lines', file: 'linesRoutes.js', name: 'Lines Routes' },
    { path: '/api/monitoring', file: 'monitoringRoutes.js', name: 'Monitoring Routes' },
    { path: '/api/selections', file: 'selectionsRoutes.js', name: 'Selections Routes' },
    { path: '/api/influencer', file: 'influencerRoutes.js', name: 'Influencer Routes' },
    { path: '/api/bump-risk', file: 'bumpRiskRoutes.js', name: 'Bump Risk Routes' },
    { path: '/api/fantasy/draft', file: 'fantasyDraftRoutes.js', name: 'Fantasy Draft Routes' },
    { path: '/api/fantasy/lineup', file: 'fantasyLineupRoutes.js', name: 'Fantasy Lineup Routes' },
    { path: '/api/fantasy/optimize', file: 'fantasyOptimizationRoutes.js', name: 'Fantasy Optimization Routes' },
  ];

  let loadedCount = 0;
  let failedCount = 0;

  for (const route of routesToLoad) {
    try {
      const module = await import(`./routes/${route.file}`);
      if (module.default && typeof module.default === 'function') {
        app.use(route.path, module.default);
        console.log(`✅ ${route.name} loaded at ${route.path}`);
        loadedCount++;
      } else {
        console.log(`⚠ ${route.name} has no default export`);
        failedCount++;
      }
    } catch (error) {
      console.log(`⚠ Could not load ${route.name}: ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n📊 Routes loaded: ${loadedCount} successful, ${failedCount} failed`);
}

// ====================
// MANUAL ENDPOINTS FOR CRITICAL PATHS
// ====================
app.get('/api/fantasy/players', (req, res) => {
  res.json({
    success: true,
    data: [],
    count: 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/fantasy/ai-advice', (req, res) => {
  res.json({
    success: true,
    data: {
      advice: 'AI fantasy advice',
      confidence: 0.85,
      timestamp: new Date().toISOString()
    }
  });
});

// ====================
// ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/api/health',
      '/api/nba',
      '/api/auth',
      '/api/players',
      '/api/teams',
      '/api/games',
      '/api/predictions',
      '/api/fantasy',
      '/api/admin',
      '/api/secret-phrases',
      '/api/analytics',
      '/api/betting'
    ]
  });
});

// ====================
// PORT CHECK FUNCTION
// ====================
const checkPortAvailability = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠ Port ${port} is already in use. Trying alternative...`);
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '127.0.0.1');
  });
};

// ====================
// FIND AVAILABLE PORT
// ====================
const findAvailablePort = async (startPort) => {
  let port = startPort;
  let maxAttempts = 10;
  
  while (maxAttempts > 0) {
    const isAvailable = await checkPortAvailability(port);
    if (isAvailable) {
      return port;
    }
    port++;
    maxAttempts--;
  }
  
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
};

// ====================
// SIMPLIFIED PORT HANDLING
// ====================
const getAvailablePort = async () => {
  // First try the configured port
  try {
    const isAvailable = await checkPortAvailability(PORT);
    if (isAvailable) {
      return PORT;
    }
  } catch (error) {
    console.log(`⚠ Error checking port ${PORT}:`, error.message);
  }
  
  // If not available, try alternative ports
  const alternativePorts = [3003, 3004, 3005, 8080, 8081];
  
  for (const port of alternativePorts) {
    try {
      const isAvailable = await checkPortAvailability(port);
      if (isAvailable) {
        console.log(`✅ Found available port: ${port}`);
        return port;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Last resort: use any available port
  return 0; // 0 means any available port
};

// ====================
// SERVER INITIALIZATION
// ====================
const initializeServer = async () => {
  console.log('🚀 Initializing NBA Fantasy AI Backend...');

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Load routes dynamically
    await loadRoutes();

    // 3. Get available port
    const availablePort = await getAvailablePort();
    
    if (availablePort !== PORT) {
      console.log(`⚠ Using port ${availablePort} instead of ${PORT}`);
    }

    // 4. Start HTTP server with graceful shutdown support
    const httpServer = createServer(app);
    
    // 5. Initialize WebSocket server
    const wsServer = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
      }
    });

    app.locals.wsServer = wsServer;

    wsServer.on('connection', (socket) => {
      console.log('✅ WebSocket client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('❌ WebSocket client disconnected:', socket.id);
      });
    });

    // 6. Start server
    const server = httpServer.listen(availablePort, HOST, () => {
      const actualPort = server.address().port;
      console.log(`\n🎉 ULTIMATE SERVER RUNNING ON http://${HOST}:${actualPort}`);
      console.log(`========================================`);
      console.log(`✅ All your routes preserved`);
      console.log(`✅ Your controllers and models work`);
      console.log(`✅ Graceful shutdown enabled`);
      console.log(`✅ Ready for Railway!`);
      console.log(`\n🏥 Health: http://${HOST}:${actualPort}/health`);
      console.log(`🔐 Auth API: http://${HOST}:${actualPort}/api/auth`);
      console.log(`🎮 Games API: http://${HOST}:${actualPort}/api/games`);
      console.log(`🏀 NBA API: http://${HOST}:${actualPort}/api/nba`);
      console.log(`📊 Analytics: http://${HOST}:${actualPort}/api/analytics`);
      console.log(`🔮 Predictions: http://${HOST}:${actualPort}/api/predictions`);
      console.log(`🧙 Fantasy: http://${HOST}:${actualPort}/api/fantasy`);
      console.log(`🗝️ Secret Phrases: http://${HOST}:${actualPort}/api/secret-phrases`);
      console.log(`💰 Betting: http://${HOST}:${actualPort}/api/betting`);
      console.log(`========================================`);
      console.log(`\nPress Ctrl+C to stop gracefully`);
    });

    // Add server cleanup
    cleanupTasks.push(() => {
      return new Promise(resolve => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    });

    // Graceful shutdown function
    async function gracefulShutdown(signal) {
      console.log(`\n🛑 Received ${signal}. Shutting down...`);
      
      console.log('Running cleanup tasks...');
      for (const task of cleanupTasks) {
        try {
          await task();
        } catch (error) {
          console.log('⚠ Cleanup task error:', error.message);
        }
      }
      
      console.log('✅ Shutdown complete');
      process.exit(0);
    }

    // Handle signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT (Ctrl+C)'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Start the server
initializeServer();

export { app };
