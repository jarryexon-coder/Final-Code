// server.js - COMPLETE FIXED VERSION with Fantasy Optimization Integration
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import axios from 'axios';

// Import authentication middleware
import { authenticateToken } from './middleware/auth.js';

// Import Database utility
import Database from './utils/database.js';

// ====================
// NEW IMPORTS FROM FILE 1
// ====================
import { requestLogger, authLogger } from './middleware/logger.js';
import { cacheMiddleware } from './middleware/cache.js';
import DataSyncService from './services/dataSyncService.js';
// Remove or comment out the RealDataService import if it doesn't exist:
// import RealDataService from './services/realDataService.js';

// Import route modules
import nbaRoutes from './routes/nbaRoutes.js';
import nhlRoutes from './routes/nhlRoutes.js';
import nflRoutes from './routes/nflRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import fantasyRoutes from './routes/fantasyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import predictionsRoutes from './routes/predictionsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import revenuecatRoutes from './routes/revenuecatRoutes.js';
import picksRouter from './routes/picks.js';
import liveGamesRoutes from './routes/livegames.js';
import kalshiRoutes from './routes/kalshiRoutes.js';
import draftRoutes from './routes/draftRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import sportsAnalyticsRoutes from './routes/sportsAnalyticsRoutes.js';
import situationalRoutes from './routes/situationalRoutes.js';
import premiumRoutes from './routes/premiumRoutes.js';
import stubRoutes from './routes/stubRoutes.js';

// Import new routes
import playersRoutes from './routes/playersRoutes.js';
import teamsRoutes from './routes/teamsRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import leaguesRoutes from './routes/leaguesRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import cacheRoutes from './routes/cacheRoutes.js';

// Import PrizePicks routes
import prizepicksLimitsRoutes from './routes/prizepicksLimitsRoutes.js';
import prizepicksGenerationRoutes from './routes/prizepicksGenerationRoutes.js';
import prizepicksSelectionsRoutes from './routes/prizepicksSelectionsRoutes.js';
import prizepicksAnalyticsRoutes from './routes/prizepicksAnalyticsRoutes.js';
import sportsbooksRoutes from './routes/sportsbooksRoutes.js';
import combinationsRoutes from './routes/combinationsRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import simulateRoutes from './routes/simulationsRoutes.js';
import sportsDataRoutes from './routes/sportsDataRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import searchPrizePicksRoutes from './routes/searchPrizePicksRoutes.js';
import socialRoutes from './routes/socialRoutes.js';

// Import additional routes
import fantasyTeamsRoutes from './routes/fantasyTeamsRoutes.js';
import picksRoutes from './routes/picksRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import linesRoutes from './routes/linesRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import secretPhraseRoutes from './routes/secretPhraseRoutes.js';
import selectionsRoutes from './routes/selectionsRoutes.js';
import influencerRoutes from './routes/influencerRoutes.js';
import influencerComplexRoutes from './routes/influencerComplexRoutes.js';
import bumpRiskRoutes from './routes/bumpRiskRoutes.js';

// Import Fantasy Optimization routes (from File 1)
import fantasyDraftRoutes from './routes/fantasyDraftRoutes.js';
import fantasyLineupRoutes from './routes/fantasyLineupRoutes.js';
import fantasyOptimizationRoutes from './routes/fantasyOptimizationRoutes.js';

// ====================
// LOAD ENVIRONMENT VARIABLES
// ====================
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
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('REDIS_URL exists:', !!process.env.REDIS_URL);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log('========================================');

// ====================
// MIDDLEWARE CONFIGURATION
// ====================
const allowedOrigins = [
  'https://nba-frontend.up.railway.app',
  'https://ai-frontend-repo-production-26fb.up.railway.app',
  'http://localhost:19006'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

console.log('✅ CORS configured');

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
// RATE LIMITING FROM FILE 1
// ====================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  }
});

app.use('/api/auth/login', authLimiter);

// ====================
// LOGGER MIDDLEWARE FROM FILE 1
// ====================
app.use(requestLogger);
app.use('/api/auth', authLogger);

// ====================
// SAFE FIREBASE INITIALIZATION - FIXED VERSION
// ====================
const initializeFirebase = async () => {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('ℹ️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Running without Firebase.');
      return null;
    }

    console.log('🔧 Initializing Firebase Admin SDK...');
    
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    
    // Check if it's a JSON string
    if (!key.startsWith('{')) {
      console.log('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON');
      console.warn('⚠️ Running without Firebase Admin SDK');
      return null;
    }

    try {
      const serviceAccount = JSON.parse(key);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key) {
        console.warn('⚠️ Firebase service account missing required fields');
        console.warn('⚠️ Running without Firebase Admin SDK');
        return null;
      }
      
      const admin = await import('firebase-admin');
      
      // SAFER CHECK: First check if admin exists, then apps, then if it's an array
      if (!admin || typeof admin !== 'object') {
        console.log('⚠️ Firebase Admin SDK module not properly loaded');
        return null;
      }
      
      // Check if apps exists and is an array - WITH BETTER ERROR HANDLING
      const apps = admin.apps;
      const isAlreadyInitialized = apps && typeof apps === 'object' && 'length' in apps;
      
      if (!isAlreadyInitialized) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
          });
          console.log('✅ Firebase Admin SDK initialized successfully');
        } catch (initError) {
          console.error('❌ Failed to initialize Firebase app:', initError.message);
          console.warn('⚠️ Running without Firebase Admin SDK');
          return null;
        }
      } else {
        console.log('✅ Firebase Admin SDK already initialized');
      }
      
      return admin;
    } catch (parseError) {
      console.error('❌ Failed to parse Firebase service account:', parseError.message);
      console.warn('⚠️ Running without Firebase Admin SDK');
      return null;
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️ Running without Firebase Admin SDK');
    return null;
  }
};

// ====================
// REDIS CLIENT WITH FALLBACK
// ====================
let redisClient;
const initializeRedis = () => {
  try {
    if (process.env.REDIS_URL) {
      console.log('🔗 Connecting to Redis...');
      
      redisClient = new Redis(process.env.REDIS_URL, {
        retryStrategy: function(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 1,
        connectTimeout: 5000
      });
      
      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });
      
      redisClient.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
      });
      
      return redisClient;
    } else {
      console.log('⚠️ REDIS_URL not configured');
      return createMemoryCache();
    }
  } catch (error) {
    console.error('❌ Redis initialization error:', error.message);
    return createMemoryCache();
  }
};

// Simple in-memory cache fallback
const createMemoryCache = () => {
  const cache = new Map();
  return {
    get: async (key) => {
      const item = cache.get(key);
      if (item && item.expiry > Date.now()) {
        return item.value;
      }
      return null;
    },
    set: async (key, value, expiry = 'EX', ttl = 3600) => {
      cache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
      return 'OK';
    },
    del: async (key) => {
      cache.delete(key);
      return 1;
    },
    quit: () => {
      cache.clear();
    }
  };
};

// ====================
// UPDATED MONGODB CONNECTION - SIMPLIFIED
// ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not configured');
      throw new Error('MONGODB_URI not configured');
    }
    
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Remove or comment out the DataSyncService initialization for now:
    /*
    const dataSyncService = new DataSyncService();
    app.locals.dataSyncService = dataSyncService;
    
    // Start data sync (but wait a bit for server to be ready)
    setTimeout(() => {
      dataSyncService.start().catch(err => {
        console.error('Failed to start data sync service:', err);
      });
    }, 10000); // Wait 10 seconds
    */
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// ====================
// CREATE USER PREFERENCES ROUTE
// ====================
const createUserPreferencesRouter = () => {
  const router = express.Router();
  
  // Get user preferences
  router.get('/', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Get user preferences',
        data: {
          userId: req.user?.id || 'anonymous',
          preferences: {},
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user preferences',
        error: error.message
      });
    }
  });

  // Update user preferences
  router.put('/', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Update user preferences',
        data: {
          userId: req.user?.id || 'anonymous',
          preferences: req.body,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences',
        error: error.message
      });
    }
  });

  // Get notification settings
  router.get('/notifications', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Get notification settings',
        data: {
          emailNotifications: true,
          pushNotifications: true,
          frequency: 'daily'
        }
      });
    } catch (error) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings',
        error: error.message
      });
    }
  });

  // Update notification settings
  router.put('/notifications', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Update notification settings',
        data: {
          ...req.body,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings',
        error: error.message
      });
    }
  });

  return router;
};

// Create userPreferencesRoutes inline
const userPreferencesRoutes = createUserPreferencesRouter();

// ====================
// ADDITIONAL RATE LIMITING
// ====================
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }));
} else {
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
      success: false,
      error: 'Too many requests from this IP'
    },
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1'
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
// WEBHOOK ROUTES FIRST (before body parsing)
// ====================
const webhookRouter = express.Router();
webhookRouter.use('/api/revenuecat', revenuecatRoutes);
app.use(webhookRouter);

// ====================
// MISSING GET HANDLERS - ADD TO server.js
// ====================

// 1. NBA API Root Handler
app.get('/api/nba', (req, res) => {
  res.json({
    success: true,
    message: 'NBA API is working',
    endpoints: [
      '/api/nba/games/today',
      '/api/nba/games',
      '/api/nba/players',
      '/api/nba/teams',
      '/api/nba/stats'
    ],
    timestamp: new Date().toISOString()
  });
});

// 2. User Preferences Root Handler
app.get('/api/user', (req, res) => {
  res.json({
    success: true,
    message: 'User Preferences API',
    endpoints: [
      '/api/user/notifications',
      '/api/user/preferences',
      '/api/user/profile'
    ],
    timestamp: new Date().toISOString()
  });
});

// 3. Analytics API Root Handler
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API',
    endpoints: [
      '/api/analytics/overview',
      '/api/analytics/performance',
      '/api/analytics/trends'
    ],
    timestamp: new Date().toISOString()
  });
});

// 4. News API Root Handler
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    message: 'News API',
    data: {
      sources: ['ESPN', 'Bleacher Report', 'Sports Illustrated'],
      categories: ['NBA', 'NFL', 'NHL', 'General'],
      latest: []
    },
    timestamp: new Date().toISOString()
  });
});

// 5. Predictions API Root Handler
app.get('/api/predictions', (req, res) => {
  res.json({
    success: true,
    message: 'Predictions API',
    endpoints: [
      '/api/predictions/nba',
      '/api/predictions/nfl',
      '/api/predictions/nhl'
    ],
    timestamp: new Date().toISOString()
  });
});

// 6. NHL API Root Handler
app.get('/api/nhl', (req, res) => {
  res.json({
    success: true,
    message: 'NHL API',
    data: {
      currentSeason: '2023-2024',
      upcomingGames: [],
      standings: []
    },
    timestamp: new Date().toISOString()
  });
});

// 7. NFL API Root Handler
app.get('/api/nfl', (req, res) => {
  res.json({
    success: true,
    message: 'NFL API',
    data: {
      currentSeason: '2023-2024',
      upcomingGames: [],
      standings: []
    },
    timestamp: new Date().toISOString()
  });
});

// 8. Fantasy API Root Handler
app.get('/api/fantasy', (req, res) => {
  res.json({
    success: true,
    message: 'Fantasy API',
    endpoints: [
      '/api/fantasy/teams',
      '/api/fantasy/players',
      '/api/fantasy/matchups',
      '/api/fantasy/leagues'
    ],
    timestamp: new Date().toISOString()
  });
});

// 9. Admin API Root Handler (with authentication)
app.get('/api/admin', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Admin API - Access granted',
    user: req.user,
    endpoints: [
      '/api/admin/users',
      '/api/admin/stats',
      '/api/admin/logs'
    ],
    timestamp: new Date().toISOString()
  });
});

// 10. Picks API Root Handler
app.get('/api/picks', (req, res) => {
  res.json({
    success: true,
    message: 'Picks API',
    endpoints: [
      '/api/picks/daily',
      '/api/picks/trending',
      '/api/picks/history'
    ],
    timestamp: new Date().toISOString()
  });
});

// 11. Kalshi API Root Handler
app.get('/api/kalshi', (req, res) => {
  res.json({
    success: true,
    message: 'Kalshi Predictions API',
    endpoints: [
      '/api/kalshi/markets',
      '/api/kalshi/trends',
      '/api/kalshi/predictions'
    ],
    timestamp: new Date().toISOString()
  });
});

// 12. Sports Analytics API Root Handler
app.get('/api/sports-analytics', (req, res) => {
  res.json({
    success: true,
    message: 'Sports Analytics API',
    endpoints: [
      '/api/sports-analytics/advanced',
      '/api/sports-analytics/trends',
      '/api/sports-analytics/predictions'
    ],
    timestamp: new Date().toISOString()
  });
});

// 13. PrizePicks Analytics API Root Handler
app.get('/api/prizepicks/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'PrizePicks Analytics API',
    endpoints: [
      '/api/prizepicks/analytics/performance',
      '/api/prizepicks/analytics/trends',
      '/api/prizepicks/analytics/recommendations'
    ],
    timestamp: new Date().toISOString()
  });
});

// 14. Sportsbooks API Root Handler
app.get('/api/sportsbooks', (req, res) => {
  res.json({
    success: true,
    message: 'Sportsbooks API',
    data: {
      sportsbooks: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'],
      features: ['odds', 'lines', 'promotions', 'comparisons']
    },
    timestamp: new Date().toISOString()
  });
});

// 15. NBA Games Today - Specific Endpoint
app.get('/api/nba/games/today', async (req, res) => {
  try {
    // Mock data - replace with actual database query
    const today = new Date().toISOString().split('T')[0];
    const mockGames = [
      {
        id: 1,
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        time: '7:30 PM ET',
        venue: 'Crypto.com Arena',
        broadcast: 'ESPN',
        odds: { home: -150, away: +130 }
      },
      {
        id: 2,
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        time: '8:00 PM ET',
        venue: 'TD Garden',
        broadcast: 'TNT',
        odds: { home: -200, away: +170 }
      }
    ];
    
    res.json({
      success: true,
      date: today,
      games: mockGames,
      count: mockGames.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching games',
      error: error.message
    });
  }
});

// 16. NBA Games Endpoint
app.get('/api/nba/games', async (req, res) => {
  try {
    const mockGames = [
      {
        id: 1,
        date: '2024-01-25',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        status: 'upcoming'
      },
      {
        id: 2,
        date: '2024-01-25',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        status: 'upcoming'
      },
      {
        id: 3,
        date: '2024-01-24',
        homeTeam: 'Phoenix Suns',
        awayTeam: 'Dallas Mavericks',
        status: 'completed',
        score: { home: 112, away: 108 }
      }
    ];
    
    res.json({
      success: true,
      games: mockGames,
      count: mockGames.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching games',
      error: error.message
    });
  }
});

// 17. Live Games API Root Handler (Added from File 1)
app.get('/api/games', (req, res) => {
  res.json({
    success: true,
    message: 'Live Games API',
    endpoints: [
      '/api/games/live',
      '/api/games/upcoming',
      '/api/games/completed',
      '/api/games/scores'
    ],
    data: {
      sports: ['NBA', 'NFL', 'NHL', 'MLB'],
      status: 'operational',
      lastUpdate: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// 18. Live Games Mock Endpoint (Added from File 1)
app.get('/api/games/live', async (req, res) => {
  try {
    const mockLiveGames = [
      {
        id: 1,
        sport: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        status: 'live',
        quarter: '4th',
        time: '2:15',
        score: { home: 98, away: 95 },
        venue: 'Crypto.com Arena'
      },
      {
        id: 2,
        sport: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        status: 'live',
        quarter: '3rd',
        time: '5:42',
        score: { home: 21, away: 17 },
        venue: 'Arrowhead Stadium'
      }
    ];
    
    res.json({
      success: true,
      games: mockLiveGames,
      count: mockLiveGames.length,
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
// DATA SYNC ENDPOINTS FROM FILE 1
// ====================
app.get('/api/sync/status', (req, res) => {
  try {
    const status = req.app.locals.dataSyncService?.getStatus() || {
      isSyncing: false,
      lastSync: null,
      message: 'Data sync service not initialized'
    };
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add sync trigger endpoint (admin only)
app.post('/api/sync/trigger', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { type } = req.body;
    const syncService = req.app.locals.dataSyncService;
    
    if (!syncService) {
      return res.status(503).json({
        success: false,
        error: 'Data sync service not available'
      });
    }
    
    let result;
    switch(type) {
      case 'games':
        result = await syncService.syncGames();
        break;
      case 'standings':
        result = await syncService.syncStandings();
        break;
      case 'players':
        result = await syncService.syncPlayers();
        break;
      case 'projections':
        result = await syncService.syncProjections();
        break;
      case 'all':
        result = await syncService.syncAll();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid sync type'
        });
    }
    
    res.json({
      success: true,
      message: `Sync triggered for ${type}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================
// ROUTE MOUNTING
// ====================
console.log('🔗 Mounting routes...');

// Mount routes safely with error handling
const mountRoute = (path, route, name) => {
  try {
    if (route && typeof route === 'function') {
      app.use(path, route);
      console.log(`✅ ${name} mounted at ${path}`);
    } else {
      console.error(`❌ ${name} is not a valid router`);
    }
  } catch (error) {
    console.error(`❌ Error mounting ${name}:`, error.message);
  }
};

// Mount all routes
mountRoute('/api/nba', nbaRoutes, 'nbaRoutes');
mountRoute('/api/games', liveGamesRoutes, 'liveGamesRoutes');
mountRoute('/api/news', newsRoutes, 'newsRoutes');
mountRoute('/api/predictions', predictionsRoutes, 'predictionsRoutes');
mountRoute('/api/analytics', analyticsRoutes, 'analyticsRoutes');
mountRoute('/api/nhl', nhlRoutes, 'nhlRoutes');
mountRoute('/api/nfl', nflRoutes, 'nflRoutes');
mountRoute('/api/fantasy', fantasyRoutes, 'fantasyRoutes');
mountRoute('/api/auth', authRoutes, 'authRoutes');
mountRoute('/api/admin', adminRoutes, 'adminRoutes');
mountRoute('/api/picks', picksRouter, 'picksRouter');
mountRoute('/api/kalshi', kalshiRoutes, 'kalshiRoutes');
mountRoute('/api/draft', draftRoutes, 'draftRoutes');
mountRoute('/api/contest', contestRoutes, 'contestRoutes');
mountRoute('/api/sports-analytics', sportsAnalyticsRoutes, 'sportsAnalyticsRoutes');
mountRoute('/api/situational', situationalRoutes, 'situationalRoutes');
mountRoute('/api/stub', stubRoutes, 'stubRoutes');
mountRoute('/api/players', playersRoutes, 'playersRoutes');
mountRoute('/api/teams', teamsRoutes, 'teamsRoutes');
mountRoute('/api/stats', statsRoutes, 'statsRoutes');
mountRoute('/api/leagues', leaguesRoutes, 'leaguesRoutes');
mountRoute('/api/search', searchRoutes, 'searchRoutes');
mountRoute('/api/cache', cacheRoutes, 'cacheRoutes');
mountRoute('/api/prizepicks', prizepicksLimitsRoutes, 'prizepicksLimitsRoutes');
mountRoute('/api/prizepicks/generate', prizepicksGenerationRoutes, 'prizepicksGenerationRoutes');
mountRoute('/api/prizepicks/selections', prizepicksSelectionsRoutes, 'prizepicksSelectionsRoutes');
mountRoute('/api/prizepicks/analytics', prizepicksAnalyticsRoutes, 'prizepicksAnalyticsRoutes');
mountRoute('/api/sportsbooks', sportsbooksRoutes, 'sportsbooksRoutes');
mountRoute('/api/combinations', combinationsRoutes, 'combinationsRoutes');
mountRoute('/api/notifications', notificationsRoutes, 'notificationsRoutes');
mountRoute('/api/simulate', simulateRoutes, 'simulateRoutes');
mountRoute('/api/user', userPreferencesRoutes, 'userPreferencesRoutes');
mountRoute('/api/sports', sportsDataRoutes, 'sportsDataRoutes');
mountRoute('/api/history', historyRoutes, 'historyRoutes');
mountRoute('/api/search/prizepicks', searchPrizePicksRoutes, 'searchPrizePicksRoutes');
mountRoute('/api/social', socialRoutes, 'socialRoutes');
mountRoute('/api/fantasy-teams', fantasyTeamsRoutes, 'fantasyTeamsRoutes');
// Note: indexRoutes is commented out since it's not a valid router
// mountRoute('/api/index', indexRoutes, 'indexRoutes');
mountRoute('/api/lines', linesRoutes, 'linesRoutes');
mountRoute('/api/monitoring', monitoringRoutes, 'monitoringRoutes');
mountRoute('/api/secret-phrases', secretPhraseRoutes, 'secretPhraseRoutes');
mountRoute('/api/selections', selectionsRoutes, 'selectionsRoutes');
mountRoute('/api/influencer', influencerRoutes, 'influencerRoutes');
mountRoute('/api/influencer-complex', influencerComplexRoutes, 'influencerComplexRoutes');
mountRoute('/api/bump-risk', bumpRiskRoutes, 'bumpRiskRoutes');

// Mount Fantasy Optimization routes (Added from File 1)
mountRoute('/api/fantasy/draft', fantasyDraftRoutes, 'fantasyDraftRoutes');
mountRoute('/api/fantasy/lineup', fantasyLineupRoutes, 'fantasyLineupRoutes');
mountRoute('/api/fantasy/optimize', fantasyOptimizationRoutes, 'fantasyOptimizationRoutes');

// Premium routes with authentication
app.use('/api/premium', authenticateToken, premiumRoutes);

// ====================
// HEALTH CHECK ENDPOINTS
// ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    databases: {
      mongodb: mongoStatus,
      redis: redisClient?.status || 'unknown'
    },
    services: {
      firebase: !!app.locals.firebaseAdmin,
      websocket: !!app.locals.wsServer,
      dataSync: !!app.locals.dataSyncService
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
    version: '4.2.0',
    endpoints: [
      '/health',
      '/api/health',
      '/api/nba',
      '/api/auth',
      '/api/user',
      '/api/prizepicks',
      '/api/games',
      '/api/fantasy/draft',
      '/api/fantasy/lineup',
      '/api/fantasy/optimize',
      '/api/sync/status'
    ]
  });
});

// ====================
// ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
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
      '/api/games',
      '/api/fantasy/draft',
      '/api/fantasy/lineup',
      '/api/fantasy/optimize',
      '/api/sync/status'
    ]
  });
});

// ====================
// GRACEFUL SHUTDOWN HANDLERS FROM FILE 1
// ====================
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Close HTTP server
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }
  
  // 2. Close database connections
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
    });
  }
  
  // 3. Clear all intervals/timeouts
  const intervalIds = Object.values(global).filter(
    value => typeof value === 'number' && value > 0
  );
  intervalIds.forEach(clearInterval);
  
  // 4. Force exit after timeout
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown...');
    process.exit(0);
  }, 5000);
};

// Listen for shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Prevent unhandled rejections from keeping the process alive
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log
});

// Prevent uncaught exceptions from keeping the process alive
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// ====================
// SERVER INITIALIZATION - UPDATED
// ====================
let server;
const initializeServer = async () => {
  console.log('🚀 Initializing NBA Fantasy AI Backend...');

  try {
    // 1. Initialize Firebase
    const firebaseAdmin = await initializeFirebase();
    if (firebaseAdmin) {
      app.locals.firebaseAdmin = firebaseAdmin;
    }

    // 2. Initialize Redis
    redisClient = initializeRedis();
    app.locals.redisClient = redisClient;

    // 3. Connect to MongoDB (ONCE - remove Database.connect() call below)
    await connectDB();

    // 4. Initialize Database service WITHOUT creating new connection
    try {
      // Just verify the connection instead of creating a new one
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Database service verified connection');
        // Attach the mongoose connection to app.locals if needed
        app.locals.db = mongoose.connection;
      } else {
        console.warn('⚠️ Database connection not ready for Database service');
      }
    } catch (error) {
      console.error('❌ Database service verification failed:', error.message);
    }

    // 5. Start HTTP server
    server = createServer(app);

    // 6. Initialize WebSocket server
    const wsServer = new Server(server, {
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

    // 7. Start server
    server.listen(PORT, HOST, () => {
      console.log(`========================================`);
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth API: http://${HOST}:${PORT}/api/auth`);
      console.log(`🎯 User API: http://${HOST}:${PORT}/api/user`);
      console.log(`📊 Analytics: http://${HOST}:${PORT}/api/analytics`);
      console.log(`🎮 Games API: http://${HOST}:${PORT}/api/games`);
      console.log(`🧙 Fantasy Draft: http://${HOST}:${PORT}/api/fantasy/draft`);
      console.log(`📈 Fantasy Lineup: http://${HOST}:${PORT}/api/fantasy/lineup`);
      console.log(`⚡ Fantasy Optimize: http://${HOST}:${PORT}/api/fantasy/optimize`);
      console.log(`🔄 Data Sync Status: http://${HOST}:${PORT}/api/sync/status`);
      console.log(`========================================`);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Start the server
initializeServer();

export { app };
