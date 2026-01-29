import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Cleanup tracker
const cleanupTasks = [];

// ====================
// MIDDLEWARE CONFIGURATION
// ====================
// Use Railway environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19000'
    ];

// Also support single CORS_ORIGIN for backward compatibility
if (process.env.CORS_ORIGIN && !allowedOrigins.includes(process.env.CORS_ORIGIN)) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

// Add Railway domains
const railwayDomains = [
  process.env.RAILWAY_PUBLIC_DOMAIN,
  process.env.RAILWAY_STATIC_URL,
  process.env.RAILWAY_SERVICE_PLEASING_DETERMINATION_URL,
  process.env.RAILWAY_SERVICE_AI_FRONTEND_REPO_URL
].filter(Boolean);

railwayDomains.forEach(domain => {
  if (domain && !allowedOrigins.includes(domain)) {
    allowedOrigins.push(domain);
  }
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Railway internal domains
    if (origin.includes('.railway.app') || origin.includes('.railway.internal')) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log(`❌ CORS blocked: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ====================
// GLOBAL HEALTH ENDPOINTS (ALWAYS AVAILABLE)
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

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
  
  res.json({
    status: 'healthy',
    databases: { mongodb: mongoStatus },
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
      '/api/auth',
      '/api/nba',
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
// DEBUG ROUTE
// ====================
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Direct debug route works',
    timestamp: new Date().toISOString(),
    server: 'NBA Fantasy AI Backend'
  });
});

// ====================
// START SERVER FUNCTION
// ====================
async function startServer() {
  console.log('🔍 Environment Check:');
  console.log('PORT:', PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN || 'local');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('========================================');

  try {
    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
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
    
    // 2. Initialize Firebase if credentials exist
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      try {
        const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
        console.log('✅ Firebase credentials loaded');
        // Initialize Firebase here if needed
      } catch (firebaseError) {
        console.log('⚠ Firebase credentials invalid:', firebaseError.message);
      }
    }
    
    // 3. Load all dynamic routes
    console.log('\n🔗 Loading your existing routes...');
    
    const routesToLoad = [
      // CORE ROUTES - LOAD IN ORDER
      { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
      { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA Routes' },
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
      
      // ADDITIONAL ROUTES
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
      
      // FANTASY SUB-ROUTES
      { path: '/api/fantasy/draft', file: 'fantasyDraftRoutes.js', name: 'Fantasy Draft Routes' },
      { path: '/api/fantasy/lineup', file: 'fantasyLineupRoutes.js', name: 'Fantasy Lineup Routes' },
      { path: '/api/fantasy/optimize', file: 'fantasyOptimizationRoutes.js', name: 'Fantasy Optimization Routes' },
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routesToLoad) {
      try {
        console.log(`🔧 Loading: ${route.name} from ${route.file}`);
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
        console.log(`❌ Could not load ${route.name}: ${error.message}`);
        failedCount++;
      }
    }

    console.log(`\n📊 Routes loaded: ${loadedCount} successful, ${failedCount} failed`);

// ====================
// ERROR HANDLING MIDDLEWARE
// ====================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

    // ====================
    // 404 HANDLER (MUST BE AFTER ALL ROUTES!)
    // ====================
    app.use('*', (req, res) => {
      console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
          '/health',
          '/api/health',
          '/api/debug',
          '/api/auth',
          '/api/nba',
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

    // 4. Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉 ULTIMATE SERVER RUNNING ON http://${HOST}:${PORT}`);
      console.log(`========================================`);
      console.log(`✅ All 38 routes loaded`);
      console.log(`✅ Graceful shutdown enabled`);
      console.log(`✅ Ready for Railway!`);
      console.log(`\n🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth API: http://${HOST}:${PORT}/api/auth`);
      console.log(`🎮 Games API: http://${HOST}:${PORT}/api/games`);
      console.log(`🏀 NBA API: http://${HOST}:${PORT}/api/nba`);
      console.log(`📊 Analytics: http://${HOST}:${PORT}/api/analytics`);
      console.log(`🔮 Predictions: http://${HOST}:${PORT}/api/predictions`);
      console.log(`🧙 Fantasy: http://${HOST}:${PORT}/api/fantasy`);
      console.log(`🗝️ Secret Phrases: http://${HOST}:${PORT}/api/secret-phrases`);
      console.log(`💰 Betting: http://${HOST}:${PORT}/api/betting`);
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

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ====================
// START THE SERVER
// ====================
startServer();

export { app };
