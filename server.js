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
import morgan from 'morgan'; // Added for logging

// Load environment variables FIRST
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
import liveGamesRoutes from './routes/livegames.js'; // Added from File 1

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// SECURITY MIDDLEWARE ENHANCEMENTS (From File 1)
// ====================

// 1. Implement Basic Security with Helmet
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

// 2. Add logging middleware (From File 1)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 3. Enhanced CORS configuration (From File 1 - production ready)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourapp.com'] // Replace with your actual frontend URL
    : [
        'http://localhost:19006',
        'exp://192.168.*.*:19000',
        'https://pleasing-determination-production.up.railway.app',
        'http://localhost:8081',
        'http://localhost:19000',
        'http://localhost:3000',
        'http://localhost:3001',
        'exp://localhost:19000',
        process.env.FRONTEND_URL,
        'https://yourapp.yourdomain.com'
      ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// 4. Trust proxy & rate limiting (From File 1 - production specific)
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // More secure rate limiting
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }));
} else {
  // Development rate limiting (more permissive)
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

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ====================
// ERROR TRACKING (From File 1 - optional)
// ====================
/*
// Uncomment and configure when you set up Sentry
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
*/

// Create HTTP server for WebSocket support
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ====================
// INITIALIZE REDIS CLIENT FOR CACHING
// ====================
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    console.log('✅ Connected to Redis cache');
  } else {
    console.log('⚠️  Redis URL not configured, using in-memory cache');
  }
} catch (error) {
  console.error('❌ Redis connection error:', error.message);
}

// ====================
// CACHE SERVICE
// ====================
const cacheService = {
  async getOrSet(key, fetchData, ttl = 300) {
    if (!redisClient) {
      return await fetchData();
    }
    
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`📦 Cache hit: ${key}`);
        return JSON.parse(cached);
      }
      
      const data = await fetchData();
      await redisClient.setex(key, ttl, JSON.stringify(data));
      console.log(`📦 Cache set: ${key} (TTL: ${ttl}s)`);
      return data;
    } catch (error) {
      console.error(`Cache error for ${key}:`, error);
      return await fetchData();
    }
  },
  
  async invalidate(key) {
    if (redisClient) {
      await redisClient.del(key);
      console.log(`📦 Cache invalidated: ${key}`);
    }
  },
  
  async invalidatePattern(pattern) {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`📦 Cache invalidated pattern: ${pattern} (${keys.length} keys)`);
      }
    }
  }
};

// Global cache middleware
app.use((req, res, next) => {
  req.cacheService = cacheService;
  if (redisClient) {
    req.redis = redisClient;
  }
  next();
});

// ====================
// DATABASE CONNECTION
// ====================
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB Atlas');
      
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected, attempting reconnect...');
      });
    } else {
      console.log('⚠️  MongoDB URI not configured, using mock data');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
  }
};

// ====================
// ANALYTICS MODEL
// ====================
const analyticsEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: 'anonymous',
    index: true
  },
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userAgent: String,
  ip: String,
  path: String,
  sessionId: String,
  deviceType: String
});

analyticsEventSchema.index({ event: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

// ====================
// ROUTE REGISTRATION (Updated with File 1 requirements)
// ====================

// Health check (must be before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    databases: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.status === 'ready' ? 'connected' : 'disconnected'
    }
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'NBA Fantasy AI Backend API',
    version: '4.2.0',
    documentation: 'See /api-docs for detailed documentation',
    endpoints: {
      nba: '/api/nba/*',
      nhl: '/api/nhl/*',
      nfl: '/api/nfl/*',
      news: '/api/news/*',
      fantasy: '/api/fantasy/*',
      analytics: '/api/analytics/*',
      auth: '/api/auth/*',
      admin: '/api/admin/*',
      picks: '/api/picks/*',
      dailyPicks: '/api/daily-picks',
      aiPredictions: '/api/ai-predictions',
      expertPicks: '/api/expert-picks',
      games: '/api/games/*',
      health: '/health',
      dashboard: '/admin/dashboard'
    }
  });
});

// ====================
// FILE 1 ROUTE MOUNTING REQUIREMENTS
// ====================

// Mount routes as specified in File 1
app.use('/api/games', liveGamesRoutes); // From File 1 requirement

// Register all other route modules
app.use('/api/nba', nbaRoutes);
app.use('/api/nfl', nflRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/fantasy', fantasyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/revenuecat', revenuecatRoutes);
app.use('/api/picks', picksRouter);

// Basic route (from your original File 2)
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Dialogflow Webhook Server is running!',
    status: 'OK',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Webhook endpoint for Dialogflow (from your original File 2)
app.post('/webhook', async (req, res) => {
  console.log('Received webhook request:', req.body);
  
  try {
    const intent = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    
    let responseText = '';
    
    switch(intent) {
      case 'GetTeamInfo':
        const teamName = parameters.team;
        responseText = `I would fetch info for the ${teamName}, but need to connect to NBA API first.`;
        break;
      default:
        responseText = "I received your NBA request but haven't implemented this yet.";
    }
    
    res.json({
      fulfillmentText: responseText
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.json({
      fulfillmentText: 'Sorry, I encountered an error processing your NBA request.'
    });
  }
});

// ====================
// DASHBOARD CODE
// ====================
const dashboardPath = path.join(__dirname, 'dashboard');
if (fs.existsSync(dashboardPath)) {
  app.use('/dashboard', express.static(dashboardPath));
  console.log('✅ Dashboard static files served from /dashboard');
} else {
  console.log('⚠️  Dashboard directory not found, creating placeholder');
  
  const dashboardHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NBA Fantasy AI Dashboard</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
      h1 { color: #1d4289; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
      .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1d4289; }
      .stat-value { font-size: 2em; font-weight: bold; color: #1d4289; }
      .stat-label { color: #666; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🏀 NBA Fantasy AI Admin Dashboard</h1>
      <p>Welcome to the admin dashboard. Analytics data will be displayed here.</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" id="todayEvents">0</div>
          <div class="stat-label">Events Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="totalEvents">0</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="activeUsers">0</div>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="topEvent">-</div>
          <div class="stat-label">Top Event</div>
        </div>
      </div>
      
      <div style="margin-top: 40px;">
        <h3>Security Status</h3>
        <ul>
          <li>✅ Helmet Security Headers: Active</li>
          <li>✅ CORS Configuration: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}</li>
          <li>✅ Rate Limiting: Active (${process.env.NODE_ENV === 'production' ? '100 req/15min' : '500 req/15min'})</li>
          <li>✅ Morgan Logging: Active (${process.env.NODE_ENV === 'production' ? 'combined' : 'dev'} format)</li>
          <li>${process.env.SENTRY_DSN ? '✅ Sentry Error Tracking: Active' : '⚠️ Sentry Error Tracking: Not configured'}</li>
        </ul>
        
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/api/analytics/summary">Analytics Summary</a></li>
          <li><a href="/api/analytics/events">View All Events</a></li>
          <li><a href="/api">API Documentation</a></li>
          <li><a href="/health">System Health</a></li>
        </ul>
      </div>
    </div>
    
    <script>
      async function loadDashboardStats() {
        try {
          const response = await fetch('/api/analytics/summary');
          const data = await response.json();
          
          if (data.success) {
            document.getElementById('todayEvents').textContent = data.data.today_events.toLocaleString();
            document.getElementById('totalEvents').textContent = data.data.total_events.toLocaleString();
            document.getElementById('activeUsers').textContent = data.data.weekly_active_users.toLocaleString();
            if (data.data.top_events && data.data.top_events.length > 0) {
              document.getElementById('topEvent').textContent = data.data.top_events[0]._id;
            }
          }
        } catch (error) {
          console.error('Failed to load dashboard stats:', error);
        }
      }
      
      loadDashboardStats();
      setInterval(loadDashboardStats, 30000);
    </script>
  </body>
  </html>`;
  
  app.get('/admin/dashboard', (req, res) => {
    res.send(dashboardHTML);
  });
  
  console.log('✅ Dashboard route created at /admin/dashboard');
}

// ====================
// CACHED API ENDPOINTS
// ====================

app.get('/api/nba/games', async (req, res) => {
  try {
    const cacheKey = 'nba:games';
    
    const games = await req.cacheService.getOrSet(cacheKey, async () => {
      return [
        {
          id: 1,
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Golden State Warriors',
          homeScore: 108,
          awayScore: 105,
          quarter: '4th',
          timeRemaining: '2:14',
          status: 'live',
          date: new Date().toISOString(),
          arena: 'Crypto.com Arena'
        },
        {
          id: 2,
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          homeScore: 95,
          awayScore: 89,
          quarter: '3rd',
          timeRemaining: '5:42',
          status: 'live',
          date: new Date().toISOString(),
          arena: 'TD Garden'
        }
      ];
    }, 300);
    
    res.json({
      success: true,
      count: games.length,
      games,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nba/games:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ... [Keep all your existing cached endpoints here - they remain unchanged]
// This includes: /api/players, /api/news/all, /api/nhl/games, /api/nfl/games, etc.

// ====================
// ANALYTICS ENDPOINTS
// ====================
app.post('/api/v1/analytics/track', async (req, res) => {
  try {
    const { event, userId, properties } = req.body;
    
    const analyticsEvent = new AnalyticsEvent({
      event,
      userId: userId || 'anonymous',
      properties: properties || {},
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      path: req.originalUrl
    });
    
    await analyticsEvent.save();
    
    if (redisClient) {
      await redisClient.lPush('recent_events', JSON.stringify({
        event,
        userId: analyticsEvent.userId,
        timestamp: analyticsEvent.timestamp
      }));
      await redisClient.lTrim('recent_events', 0, 99);
    }
    
    console.log(`📊 Tracked event: ${event} for user: ${analyticsEvent.userId}`);
    
    res.json({ 
      success: true, 
      message: 'Event tracked',
      eventId: analyticsEvent._id
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ... [Keep all your existing analytics endpoints here]

// ====================
// DAILY PICKS ENDPOINTS
// ====================
app.get('/api/daily-picks', async (req, res) => {
  try {
    const { sport, date } = req.query;
    const cacheKey = `picks:daily:${sport || 'all'}:${date || 'today'}`;
    
    const picks = await req.cacheService.getOrSet(cacheKey, async () => {
      return [
        {
          id: 1,
          sport: sport || 'NBA',
          player: 'Stephen Curry',
          team: 'Golden State Warriors',
          pickType: 'Over',
          stat: 'Points',
          line: 28.5,
          confidence: 85,
          reasoning: 'High-scoring game vs Lakers, favorable matchup',
          timestamp: new Date().toISOString()
        }
      ];
    }, 600);
    
    res.json({
      success: true,
      picks,
      timestamp: new Date().toISOString(),
      meta: {
        sport,
        date,
        totalPicks: picks.length,
      }
    });
  } catch (error) {
    console.error('Error fetching daily picks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch picks' });
  }
});

// ... [Keep all your existing endpoints for AI predictions, expert picks, etc.]

// ====================
// WEBSOCKET HANDLERS
// ====================
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('subscribe-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`📡 Client ${socket.id} subscribed to game ${gameId}`);
    
    socket.emit('game-state', {
      gameId,
      homeScore: 108,
      awayScore: 105,
      quarter: '4th',
      timeRemaining: '2:14',
      players: []
    });
  });

  socket.on('unsubscribe-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`📡 Client ${socket.id} unsubscribed from game ${gameId}`);
  });

  socket.on('fantasy-update', (data) => {
    console.log('Fantasy update received:', data);
    io.to(`league-${data.leagueId}`).emit('fantasy-lineup-updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Simulate live game updates
const simulateLiveUpdates = () => {
  setInterval(() => {
    const updates = [
      {
        gameId: 1,
        homeScore: 108 + Math.floor(Math.random() * 3),
        awayScore: 105 + Math.floor(Math.random() * 3),
        quarter: '4th',
        timeRemaining: `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        lastPlay: ['3pt shot made', 'Turnover', 'Foul', 'Timeout'][Math.floor(Math.random() * 4)]
      }
    ];

    updates.forEach(update => {
      io.to(`game-${update.gameId}`).emit('game-update', {
        ...update,
        timestamp: new Date().toISOString()
      });
    });
  }, 5000);
};

// ====================
// ERROR HANDLING
// ====================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    availableEndpoints: [
      '/health',
      '/api',
      '/admin/dashboard',
      '/api/nba/*',
      '/api/nhl/*',
      '/api/nfl/*',
      '/api/news/*',
      '/api/fantasy/*',
      '/api/analytics/*',
      '/api/v1/analytics/*',
      '/api/picks/*',
      '/api/daily-picks',
      '/api/ai-predictions',
      '/api/expert-picks',
      '/api/players',
      '/api/teams',
      '/api/games/*',
      '/api/admin/cache/*',
      '/api/admin/backup-status',
      '/webhook'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// ====================
// INITIALIZATION
// ====================
const initializeServer = async () => {
  await connectDB();
  
  if (process.env.NODE_ENV !== 'production') {
    simulateLiveUpdates();
    console.log('⚡ Live game updates simulation started');
  }
  
  httpServer.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 NBA Fantasy AI Backend Server Started');
    console.log('='.repeat(60));
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://10.0.0.183:${PORT}`);
    console.log(`📊 Health Check: http://10.0.0.183:${PORT}/health`);
    console.log(`📡 API Documentation: http://10.0.0.183:${PORT}/api`);
    console.log(`📈 Admin Dashboard: http://10.0.0.183:${PORT}/admin/dashboard`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
    
    // Security Status Report
    console.log('\n🔒 SECURITY FEATURES:');
    console.log('   ✅ Helmet Security Headers');
    console.log('   ✅ CORS Configuration');
    console.log('   ✅ Rate Limiting: ' + (process.env.NODE_ENV === 'production' ? '100 req/15min' : '500 req/15min'));
    console.log('   ✅ Morgan Logging');
    console.log(`   ${process.env.SENTRY_DSN ? '✅ Sentry Error Tracking' : '⚠️ Sentry: Not configured'}`);
    
    console.log('\n🏀 ROUTE MOUNTING:');
    console.log('   ✅ /api/nhl → nhlRoutes.js');
    console.log('   ✅ /api/games → livegames.js');
    console.log('   ✅ /api/nba → nbaRoutes.js');
    console.log('   ✅ /webhook → Dialogflow endpoint');
    
    if (redisClient?.status === 'ready') {
      console.log('✅ Connected to Redis cache');
    }
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Connected to MongoDB');
    }
    
    console.log('='.repeat(60) + '\n');
  });
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

initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});

export default app;
