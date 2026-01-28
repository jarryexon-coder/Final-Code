// server-final-production.js
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

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
// HEALTH CHECK ENDPOINTS
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
// MANUAL HEALTH ENDPOINTS FOR ALL ROUTERS
// ====================
console.log('\n🔧 Setting up router health endpoints...');

const routerHealthEndpoints = [
  '/api/fantasy',
  '/api/picks',
  '/api/news',
  '/api/analytics',
  '/api/predictions',
  '/api/betting',
  '/api/nba',
  '/api/auth',
  '/api/admin',
  '/api/players',
  '/api/teams',
  '/api/games',
  '/api/secret-phrases',
  '/api/nhl',
  '/api/nfl',
  '/api/kalshi',
  '/api/draft',
  '/api/contest',
  '/api/sports-analytics',
  '/api/situational',
  '/api/stub',
  '/api/stats',
  '/api/leagues',
  '/api/search',
  '/api/cache',
  '/api/prizepicks',
  '/api/combinations',
  '/api/notifications',
  '/api/simulate',
  '/api/social',
  '/api/fantasy-teams',
  '/api/lines',
  '/api/monitoring',
  '/api/selections',
  '/api/influencer',
  '/api/bump-risk',
  '/api/fantasy/draft',
  '/api/fantasy/lineup',
  '/api/fantasy/optimize'
];

routerHealthEndpoints.forEach(endpoint => {
  // Health endpoint WITHOUT trailing slash
  app.get(endpoint, (req, res) => {
    res.json({
      success: true,
      message: `${endpoint} API is loaded and working`,
      status: 'active',
      timestamp: new Date().toISOString(),
      note: 'This router supports sub-routes'
    });
  });
  
  // Health endpoint WITH trailing slash
  app.get(endpoint + '/', (req, res) => {
    res.json({
      success: true,
      message: `${endpoint} API is loaded and working`,
      status: 'active',
      timestamp: new Date().toISOString(),
      note: 'This is the router root endpoint'
    });
  });
});

console.log(`✅ ${routerHealthEndpoints.length} router health endpoints configured`);

// ====================
// DYNAMIC ROUTE LOADING (WITH ERROR HANDLING)
// ====================
console.log('\n🔗 Loading dynamic routes...');

async function loadAllRoutes() {
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
  return { loadedCount, failedCount };
}

// ====================
// BASIC API ENDPOINTS (for testing)
// ====================

// Games live endpoint (example of a non-router endpoint)
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
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

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

// ====================
// ====================
// 404 HANDLER - IMPROVED
// ====================
app.use('*', (req, res) => {
  const requestedPath = req.originalUrl;
  
  // Check if this might be a router path
  // Common router paths that have sub-routes
  const routerPaths = [
    '/api/fantasy',
    '/api/picks',
    '/api/news',
    '/api/nba',
    '/api/auth',
    '/api/admin',
    '/api/analytics',
    '/api/predictions',
    '/api/secret-phrases',
    '/api/betting'
  ];
  
  const isRouterPath = routerPaths.some(routerPath =>
    requestedPath.startsWith(routerPath) && requestedPath !== routerPath
  );
  
  if (isRouterPath) {
    // It's a router sub-route that wasn't found
    res.status(404).json({
      success: false,
      error: `Router sub-route not found: ${requestedPath}`
    });
  } else {
    // Standard 404
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: requestedPath,
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
      ],
      note: 'Router endpoints support sub-routes (e.g., /api/fantasy/players)'
    });
  }
});

// ====================
// 404 HANDLER - IMPROVED
// ====================
app.use('*', (req, res) => {
  const requestedPath = req.originalUrl;
  
  // Check if this might be a router path
  // Common router paths that have sub-routes
  const routerPaths = [
    '/api/fantasy',
    '/api/picks',
    '/api/news',
    '/api/nba',
    '/api/auth',
    '/api/admin',
    '/api/analytics',
    '/api/predictions',
    '/api/secret-phrases',
    '/api/betting'
  ];
  
  const isRouterPath = routerPaths.some(routerPath =>
    requestedPath.startsWith(routerPath) && requestedPath !== routerPath
  );
  
  if (isRouterPath) {
    // It's a router sub-route that wasn't found
    res.status(404).json({
      success: false,
      error: `Router sub-route not found: ${requestedPath}`
    });
  } else {
    // Standard 404
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: requestedPath,
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
      ],
      note: 'Router endpoints support sub-routes (e.g., /api/fantasy/players)'
    });
  }
});
