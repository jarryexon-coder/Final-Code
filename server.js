// server.js - Complete NBA Fantasy AI Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import morgan from 'morgan';

// Import authentication middleware
import { authenticateToken } from './middleware/auth.js';

// Import Database utility from File 1
import Database from './utils/database.js';

// ====================
// LOAD ENVIRONMENT VARIABLES
// ====================
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import route modules
import nbaRoutes from './routes/nbaRoutes.js';
import nhlRoutes from './routes/nhlRoutes.js';
import nflRoutes from './routes/nflRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import fantasyRoutes from './routes/fantasyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
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

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// CRITICAL: BODY PARSERS MUST BE FIRST!
// ====================
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

console.log('✅ Body parsers initialized');

// ====================
// CORS MIDDLEWARE (Updated per File 1)
// ====================
const allowedOrigins = [
  'https://nba-frontend.up.railway.app', // Your OLD live frontend
  'https://ai-frontend-repo-production-26fb.up.railway.app', // Your NEW frontend - ADD THIS LINE
  'http://localhost:19006' // Keep local dev if needed
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

console.log('✅ CORS middleware configured with allowed origins:', allowedOrigins);

// ====================
// MONGO DB CONNECTION
// ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not configured');
      throw new Error('MONGODB_URI not configured');
    }
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('📝 Using URI (masked):', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    global.isMongoConnected = true;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Initialize database connection from File 1
try {
  await Database.connect();
  console.log('✅ Database service initialized');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  // Continue without database - services will use mock data
}

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
  global.isMongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  global.isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  global.isMongoConnected = false;
});

// ====================
// WEBSOCKET SERVER
// ====================
class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });
    this.clients = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ WebSocket client connected: ${socket.id}`);
      
      socket.on('register', (userId) => {
        this.clients.set(userId, socket.id);
        console.log(`📝 Client registered: ${userId} -> ${socket.id}`);
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.clients.entries()) {
          if (socketId === socket.id) {
            this.clients.delete(userId);
            console.log(`❌ Client disconnected: ${userId}`);
            break;
          }
        }
      });
    });
  }

  broadcastSecretPhraseEvent(event) {
    console.log(`📢 Broadcasting secret phrase event: ${event.event || 'unknown'}`);
    this.io.emit('secret-phrase-event', event);
  }

  sendToUser(userId, event, data) {
    const socketId = this.clients.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`📨 Sent ${event} to user: ${userId}`);
    }
  }

  getConnectionCount() {
    return this.io.engine.clientsCount || 0;
  }
}

// ====================
// SECURITY MIDDLEWARE
// ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://assets.nhle.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ====================
// EXPRESS STATUS MONITOR (Added per File 1)
// ====================
import expressStatusMonitor from 'express-status-monitor';

app.use(expressStatusMonitor({
  title: 'NBA Backend Status',
  path: '/status',
  spans: [
    { interval: 1, retention: 60 },    // 1 minute samples for 1 hour
    { interval: 5, retention: 60 },    // 5 minute samples for 5 hours
    { interval: 15, retention: 60 }    // 15 minute samples for 1 day
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    heap: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  }
}));

// ====================
// SWAGGER DOCUMENTATION (Added per File 1)
// ====================
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './docs/swagger.js';

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Create HTTP server
const httpServer = createServer(app);

// ====================
// REDIS CLIENT WITH AUTHENTICATION (FIXED)
// ====================
let redisClient;
try {
  if (process.env.REDIS_URL) {
    // Use the Railway Redis URL with authentication
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy: function(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    console.log('✅ Connected to Redis cache with REDIS_URL');
  } else if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
    // Use separate credentials
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: function(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    console.log('✅ Connected to Redis with host and password');
  } else {
    console.log('⚠️  Redis URL not configured, using in-memory cache');
  }
} catch (error) {
  console.error('❌ Redis connection error:', error.message);
}

// ====================
// MOUNT ROUTES (Updated per File 1)
// ====================

// Mount routes as specified in File 1
app.use('/api/nba', nbaRoutes);       // This should handle /api/nba/teams
app.use('/api/games', liveGamesRoutes); // This should handle /api/games
app.use('/api/news', newsRoutes);

// Apply auth middleware to ALL premium routes as specified in File 1
app.use('/api/premium', authenticateToken, premiumRoutes);

// Mount other routes
app.use('/api/nhl', nhlRoutes);
app.use('/api/nfl', nflRoutes);
app.use('/api/fantasy', fantasyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/revenuecat', revenuecatRoutes);
app.use('/api/picks', picksRouter);
app.use('/api/kalshi', kalshiRoutes);
app.use('/api/draft', draftRoutes);
app.use('/api/contest', contestRoutes);
app.use('/api/sports-analytics', sportsAnalyticsRoutes);
app.use('/api/situational', situationalRoutes);
app.use('/api/stub', stubRoutes);

// ====================
// HEALTH CHECK ENDPOINTS
// ====================
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : 'disconnected';
  
  let mongoTest = 'error';
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      mongoTest = 'ok';
    }
  } catch (error) {
    mongoTest = 'ping_failed: ' + error.message;
  }
  
  const redisStatus = redisClient?.status === 'ready' ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    databases: {
      mongodb: mongoStatus,
      mongodb_state: mongoState,
      mongoTest: mongoTest,
      redis: redisStatus
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      node: process.version
    }
  });
});

// Add: /api/health route (per File 1)
app.get('/api/health', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend API',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ====================
// DATABASE HEALTH ENDPOINT (FIXED SYNTAX)
// ====================
app.get('/api/database/health', async (req, res) => {
  const status = Database.getStatus();
  res.json({
    success: true,
    status: status,
    timestamp: new Date().toISOString()
  });
});

// ====================
// APP CONFIG ENDPOINT
// ====================
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    features: { liveGames: true, userProfiles: true },
    apiUrl: process.env.RAILWAY_PUBLIC_FRONTEND_URL || process.env.API_BASE_URL || 'https://pleasing-determination-production.up.railway.app',
    uiVersion: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ====================
// NBA GAMES ENDPOINTS (ADDED FOR FRONTEND)
// ====================
app.get('/api/nba/games/today', async (req, res) => {
  try {
    console.log('🏀 Fetching NBA games for today...');
    
    // Mock response for now - replace with actual data fetching
    const mockGames = {
      success: true,
      games: [
        {
          id: 'game_001',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Golden State Warriors',
          date: new Date().toISOString().split('T')[0],
          time: '7:30 PM ET',
          venue: 'Crypto.com Arena',
          status: 'scheduled'
        },
        {
          id: 'game_002',
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          date: new Date().toISOString().split('T')[0],
          time: '8:00 PM ET',
          venue: 'TD Garden',
          status: 'scheduled'
        }
      ],
      timestamp: new Date().toISOString(),
      count: 2
    };
    
    res.json(mockGames);
  } catch (error) {
    console.error('❌ Error fetching NBA games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NBA games'
    });
  }
});

app.get('/api/nba/games', async (req, res) => {
  try {
    console.log('🏀 Fetching NBA games...');
    
    // Mock response for now - replace with actual data fetching
    const mockGames = {
      success: true,
      games: [
        {
          id: 'game_001',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Golden State Warriors',
          date: '2024-01-15',
          time: '7:30 PM ET',
          venue: 'Crypto.com Arena',
          status: 'scheduled'
        },
        {
          id: 'game_002',
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          date: '2024-01-15',
          time: '8:00 PM ET',
          venue: 'TD Garden',
          status: 'scheduled'
        },
        {
          id: 'game_003',
          homeTeam: 'Phoenix Suns',
          awayTeam: 'Dallas Mavericks',
          date: '2024-01-16',
          time: '9:00 PM ET',
          venue: 'Footprint Center',
          status: 'scheduled'
        }
      ],
      timestamp: new Date().toISOString(),
      count: 3
    };
    
    res.json(mockGames);
  } catch (error) {
    console.error('❌ Error fetching NBA games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NBA games'
    });
  }
});

// ====================
// PRIVACY POLICY ROUTE (Added per File 1)
// ====================
app.get('/privacy', (req, res) => {
  const privacyHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Privacy Policy - NBA Fantasy Pro</title></head>
    <body>
      <h1>Privacy Policy</h1>
      <p>Privacy policy content will be added here.</p>
    </body>
    </html>
  `;
  res.send(privacyHtml);
});

// ====================
// SPORTS ANALYTICS ENDPOINTS (from File 1)
// ====================

// 1. Arbitrage endpoint (around line ~300)
app.get('/api/sports-analytics/arbitrage', async (req, res) => {
  try {
    const { sport } = req.query;
    // Mock response for now
    const opportunities = {
      opportunities: [
        {
          game: `${sport || 'NBA'} Mock Game`,
          market: 'Moneyline',
          book1: { name: 'Book A', odds: 1.85 },
          book2: { name: 'Book B', odds: 2.10 },
          arbitragePercentage: 5.2
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('❌ Arbitrage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Regression endpoint (around line ~300)
app.get('/api/sports-analytics/regression', async (req, res) => {
  try {
    const { sport, statType } = req.query;
    const candidates = {
      candidates: [
        {
          player: `${sport || 'NBA'} Player X`,
          stat: statType || '3-Point Percentage',
          currentValue: '45%',
          expectedRegression: '38%',
          confidence: 'Medium',
          gamesSampled: 25,
          trend: 'Overperforming recent hot streak',
          recommendation: 'Sell high in fantasy, bet unders'
        },
        {
          player: `${sport || 'NBA'} Player Y`,
          stat: statType || 'Free Throw Percentage',
          currentValue: '92%',
          expectedRegression: '85%',
          confidence: 'High',
          gamesSampled: 30,
          trend: 'Unsustainable hot streak',
          recommendation: 'Expect regression to mean'
        }
      ],
      totalCandidates: 2,
      sport: sport || 'NBA',
      statType: statType || '3-Point Percentage',
      note: 'Mock data - regression analysis active'
    };
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('❌ Regression endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// SITUATIONAL ENDPOINTS (from File 1)
// ====================

// 3. Spot-plays endpoint (around line ~330)
app.get('/api/situational/spot-plays', async (req, res) => {
  try {
    const { sport, date } = req.query;
    // Mock response for now
    const spotPlays = {
      spotPlays: [
        {
          game: `${sport || 'NBA'} Mock Game: Team X vs Team Y`,
          situation: 'Back-to-back with travel',
          edge: 'Fade the traveling team',
          confidence: 'High'
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: spotPlays });
  } catch (error) {
    console.error('❌ Spot plays endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Live betting endpoint (around line ~360)
app.get('/api/situational/live-betting', async (req, res) => {
  try {
    const { sport } = req.query;
    const opportunities = {
      opportunities: [
        {
          scenario: 'Team down by 14+ points at halftime',
          historicalComebackRate: '12%',
          currentLiveOdds: '+450',
          recommendedAction: 'Bet on trailing team if odds > +400',
          confidence: 'Medium',
          units: 1,
          sport: sport || 'NBA'
        },
        {
          scenario: 'Star player fouls out early',
          impact: 'Team offense drops by 8-10 points per 100 possessions',
          currentLiveOdds: '+220 for opponent',
          recommendedAction: 'Bet opponent moneyline',
          confidence: 'High',
          units: 2,
          sport: sport || 'NBA'
        }
      ],
      totalOpportunities: 2,
      sport: sport || 'NBA',
      note: 'Mock data - live betting analysis working'
    };
    res.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('❌ Live betting endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// CONTEST ENDPOINTS (from File 1)
// ====================

// 5. GPP leverage endpoint (around line ~497-509)
app.get('/api/contest/gpp/leverage', async (req, res) => {
  try {
    const { sport, contestSize } = req.query;
    // Mock response for now
    const leveragePlays = {
      leveragePlays: [
        {
          player: `${sport || 'NFL'} Mock Player`,
          position: 'QB',
          leverage: 'Low ownership, high ceiling',
          contestSize: contestSize || 'large'
        }
      ],
      note: 'Mock data - service being fixed'
    };
    res.json({ success: true, data: leveragePlays });
  } catch (error) {
    console.error('❌ GPP leverage endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// PREMIUM ENDPOINTS (from File 1)
// ====================

// 6. Validate subscription endpoint (around line ~420)
app.get('/api/premium/validate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const validation = {
      userId: userId || 'test_user_123',
      isValid: true,
      subscription: {
        tier: 'pro',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'credit_card',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      features: ['secret_phrases', 'advanced_analytics', 'priority_support'],
      limits: {
        dailySecretPhrases: 50,
        monthlyAnalytics: 1000,
        concurrentSessions: 3
      },
      note: 'Mock data - subscription validation working'
    };
    res.json({ success: true, data: validation });
  } catch (error) {
    console.error('❌ Validate subscription endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Usage limits endpoint (around line ~430)
app.get('/api/premium/limits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { featureKey } = req.query;
    const limits = {
      userId: userId || 'test_user_123',
      featureKey: featureKey || 'secret_phrases',
      limits: {
        daily: 50,
        monthly: 1500,
        concurrent: 3
      },
      usage: {
        dailyUsed: 15,
        monthlyUsed: 320,
        currentConcurrent: 1
      },
      remaining: {
        daily: 35,
        monthly: 1180,
        available: true
      },
      resetTimes: {
        dailyReset: new Date(Date.now() + 24 * 60 * 60 * 1000 - (Date.now() % (24 * 60 * 60 * 1000))).toISOString(),
        monthlyReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      note: 'Mock data - usage limits tracking active'
    };
    res.json({ success: true, data: limits });
  } catch (error) {
    console.error('❌ Usage limits endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// SECRET PHRASE ROUTES - FIXED VERSION
// ====================
const secretPhraseRouter = express.Router();

// Test middleware to debug request body
secretPhraseRouter.use((req, res, next) => {
  console.log(`🔵 [DEBUG] Secret phrase route accessed: ${req.method} ${req.path}`);
  console.log(`🔵 [DEBUG] Request body type: ${typeof req.body}`);
  console.log(`🔵 [DEBUG] Request body:`, JSON.stringify(req.body));
  console.log(`🔵 [DEBUG] Request headers:`, JSON.stringify(req.headers));
  next();
});

secretPhraseRouter.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Secret phrases endpoint is working',
    timestamp: new Date().toISOString()
  });
});

secretPhraseRouter.post('/log-event', async (req, res) => {
  console.log('🔵 [SECRET_PHRASE] POST /log-event received');
  console.log('🔵 [SECRET_PHRASE] Full req.body:', req.body);
  
  // Check if body is parsed
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('❌ ERROR: req.body is empty or undefined!');
    console.error('❌ Headers:', req.headers['content-type']);
    console.error('❌ Raw request details:', {
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    
    return res.status(400).json({ 
      success: false, 
      error: 'Request body is empty or not JSON',
      receivedBody: req.body,
      contentType: req.headers['content-type']
    });
  }
  
  try {
    // Extract data with defaults
    const { 
      userId = 'anonymous', 
      phraseKey = 'unknown', 
      phraseCategory = 'general', 
      eventType = 'discovery', 
      inputText = '', 
      sport = 'NBA' 
    } = req.body;
    
    console.log(`🔵 [SECRET_PHRASE] Processing for user: ${userId}`);
    
    // Create event object
    const event = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      phraseKey,
      phraseCategory,
      eventType,
      inputText,
      sport,
      timestamp: new Date(),
      receivedAt: new Date().toISOString(),
      debug: {
        bodyParsed: true,
        bodyKeys: Object.keys(req.body),
        source: 'fixed_server.js'
      }
    };
    
    console.log('💾 [SECRET_PHRASE] Event created:', event._id.toString());
    
    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const db = mongoose.connection.db;
        
        // Save to analyticsevents
        const analyticResult = await db.collection('analyticsevents').insertOne(event);
        console.log('✅ Saved to analyticsevents:', analyticResult.insertedId);
        
        // Also save to secretphraseanalytics
        const secretEvent = {
          ...event,
          collectionName: 'secretphraseanalytics',
          eventId: event._id.toString(),
          savedAt: new Date()
        };
        
        const secretResult = await db.collection('secretphraseanalytics').insertOne(secretEvent);
        console.log('✅ Saved to secretphraseanalytics:', secretResult.insertedId);
        
        // Verify the save
        const verifyDoc = await db.collection('analyticsevents').findOne({ _id: event._id });
        console.log(`📊 Verification: Document ${verifyDoc ? '✅ exists' : '❌ not found'} in database`);
        
      } catch (dbError) {
        console.error('❌ Database save error:', dbError.message);
        console.error('❌ Error stack:', dbError.stack);
      }
    } else {
      console.warn('⚠️  MongoDB not connected, skipping database save');
      console.warn('⚠️  MongoDB state:', mongoose.connection.readyState);
      console.warn('⚠️  MongoDB db object:', !!mongoose.connection.db);
    }
    
    res.status(201).json({ 
      success: true, 
      eventId: event._id.toString(),
      message: 'Secret phrase logged successfully',
      userId: userId,
      timestamp: event.timestamp
    });
    
  } catch (error) {
    console.error('❌ Secret phrase route error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET: Aggregate analytics for secret phrases
secretPhraseRouter.get('/aggregate', async (req, res) => {
  try {
    console.log('🔵 [SECRET_PHRASE] GET /aggregate called');
    
    const db = mongoose.connection.db;
    const collection = db.collection('secretphraseanalytics');
    
    const { startDate, endDate, userId, category } = req.query;
    console.log('🔵 [SECRET_PHRASE] Query params:', { startDate, endDate, userId, category });
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }
    if (userId) matchStage.userId = userId;
    if (category) matchStage.phraseCategory = category;
    
    console.log('🔵 [SECRET_PHRASE] Match stage:', matchStage);
    
    const aggregation = await collection.aggregate([
      { $match: matchStage },
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                uniquePhrases: { $addToSet: '$phraseKey' },
                totalDiscoveries: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'discovery'] }, 1, 0] }
                },
                totalUsages: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'usage'] }, 1, 0] }
                }
              }
            }
          ],
          byPhrase: [
            {
              $group: {
                _id: '$phraseKey',
                count: { $sum: 1 },
                category: { $first: '$phraseCategory' },
                rarity: { $first: '$rarity' }
              }
            },
            { $sort: { count: -1 } }
          ],
          byCategory: [
            {
              $group: {
                _id: '$phraseCategory',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]).toArray();
    
    const result = aggregation[0] || {};
    console.log('🔵 [SECRET_PHRASE] Aggregation result:', JSON.stringify(result, null, 2));
    
    res.json({
      success: true,
      data: {
        overallStats: result.overallStats?.[0] || {
          totalEvents: 0,
          uniqueUsers: [],
          uniquePhrases: [],
          totalDiscoveries: 0,
          totalUsages: 0
        },
        byPhrase: result.byPhrase || [],
        byCategory: result.byCategory || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error in /aggregate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount secret phrases route with authentication
app.use('/api/secret-phrases', authenticateToken, secretPhraseRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Dialogflow Webhook Server is running!',
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    bodyParserTest: 'Body parser should be working now'
  });
});

// ====================
// SERVER INITIALIZATION
// ====================
const initializeServer = async () => {
  console.log('🚀 Initializing NBA Fantasy AI Backend...');
  
  try {
    // 1. Connect to MongoDB
    await connectDB();
    
    // 2. Initialize WebSocket server
    const wsServer = new WebSocketServer(httpServer);
    app.locals.wsServer = wsServer;
    console.log('✅ WebSocket server initialized');
    
    // 3. Start the HTTP server with updated app.listen call from File 1
    // ========== START SERVER ==========
    const port = process.env.PORT || 3000;
    httpServer.listen(port, "0.0.0.0", function () {
      console.log(`✅ Server running on ${this.address().port}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  httpServer.close(() => {
    console.log('HTTP server closed');
    
    if (redisClient) {
      redisClient.quit();
      console.log('Redis connection closed');
    }
    
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

initializeServer();

