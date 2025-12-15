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

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server for WebSocket support
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize Redis client
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
// MIDDLEWARE
// ====================
// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Update CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL,
          'https://yourapp.yourdomain.com',
          // Add your production domains here
        ]
      : [
          'http://localhost:8081',
          'http://localhost:19000',
          'http://localhost:3000',
          'http://localhost:3001',
          'exp://localhost:19000',
        ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('🚫 Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
};

app.use(cors(corsOptions));

// Enhanced rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and specific paths
    return req.path === '/health' || req.path === '/';
  }
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Global cache middleware
app.use((req, res, next) => {
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
      // Remove the deprecated options - Mongoose v6+ handles these automatically
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB Atlas');
      
      // Optional: Add connection event listeners
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
    // Log more details for debugging
    console.error('Full error:', error);
  }
};

// ====================
// ROUTE REGISTRATION
// ====================
// Health check (must be before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '4.1.0',
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
    version: '4.1.0',
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
      health: '/health'
    }
  });
});

// Register all route modules
app.use('/api/nba', nbaRoutes);
app.use('/api/nhl', nhlRoutes);
app.use('/api/nfl', nflRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/fantasy', fantasyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/revenuecat', revenuecatRoutes);
app.use('/api/picks', picksRouter);

// ====================
// NEW ENDPOINTS FOR FRONTEND COMPATIBILITY
// Add these endpoints that your React Native app is calling
// ====================

// NBA endpoints that your frontend expects
app.get('/api/nba/games', async (req, res) => {
  try {
    const games = [
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
      },
      {
        id: 3,
        homeTeam: 'Denver Nuggets',
        awayTeam: 'Phoenix Suns',
        homeScore: 0,
        awayScore: 0,
        quarter: 'Pregame',
        timeRemaining: '',
        status: 'scheduled',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        arena: 'Ball Arena'
      }
    ];

    res.json({
      success: true,
      count: games.length,
      games,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nba/games:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// This endpoint might be handled by newsRoutes, but adding direct endpoint for compatibility
app.get('/api/news/all', async (req, res) => {
  try {
    const news = [
      {
        id: 1,
        title: 'LeBron James Nears 40,000 Career Points',
        summary: 'Lakers star approaches historic milestone',
        sport: 'NBA',
        source: 'ESPN',
        publishedAt: new Date().toISOString(),
        imageUrl: 'https://example.com/lebron.jpg'
      },
      {
        id: 2,
        title: 'Nikola Jokic Triple-Double Streak Continues',
        summary: 'Nuggets center records 5th straight triple-double',
        sport: 'NBA',
        source: 'NBA.com',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: 'https://example.com/jokic.jpg'
      },
      {
        id: 3,
        title: 'Connor McDavid Leads NHL Scoring Race',
        summary: 'Oilers captain extends point streak to 12 games',
        sport: 'NHL',
        source: 'NHL Network',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        imageUrl: 'https://example.com/mcdavid.jpg'
      },
      {
        id: 4,
        title: 'Patrick Mahomes Injury Update',
        summary: 'Chiefs QB expected to play Sunday',
        sport: 'NFL',
        source: 'NFL Network',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        imageUrl: 'https://example.com/mahomes.jpg'
      }
    ];

    res.json({
      success: true,
      count: news.length,
      news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/news/all:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// NHL endpoints that your frontend expects
app.get('/api/nhl/games', async (req, res) => {
  try {
    const games = [
      {
        id: 1,
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        homeScore: 3,
        awayScore: 2,
        period: '3rd',
        timeRemaining: '5:30',
        status: 'live',
        date: new Date().toISOString(),
        arena: 'Scotiabank Arena'
      },
      {
        id: 2,
        homeTeam: 'Boston Bruins',
        awayTeam: 'New York Rangers',
        homeScore: 1,
        awayScore: 1,
        period: '2nd',
        timeRemaining: '10:15',
        status: 'live',
        date: new Date().toISOString(),
        arena: 'TD Garden'
      }
    ];

    res.json({
      success: true,
      count: games.length,
      games,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/games:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/nhl/standings', async (req, res) => {
  try {
    const standings = [
      {
        rank: 1,
        team: 'Boston Bruins',
        gamesPlayed: 65,
        wins: 42,
        losses: 12,
        overtimeLosses: 11,
        points: 95,
        pointsPercentage: 0.731
      },
      {
        rank: 2,
        team: 'Carolina Hurricanes',
        gamesPlayed: 64,
        wins: 40,
        losses: 18,
        overtimeLosses: 6,
        points: 86,
        pointsPercentage: 0.672
      },
      {
        rank: 3,
        team: 'New Jersey Devils',
        gamesPlayed: 65,
        wins: 39,
        losses: 19,
        overtimeLosses: 7,
        points: 85,
        pointsPercentage: 0.654
      }
    ];

    res.json({
      success: true,
      standings,
      division: 'Atlantic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nhl/standings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// NFL endpoints that your frontend expects
app.get('/api/nfl/games', async (req, res) => {
  try {
    const games = [
      {
        id: 1,
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Philadelphia Eagles',
        homeScore: 24,
        awayScore: 21,
        quarter: '4th',
        timeRemaining: '2:00',
        status: 'live',
        date: new Date().toISOString(),
        stadium: 'Arrowhead Stadium'
      },
      {
        id: 2,
        homeTeam: 'San Francisco 49ers',
        awayTeam: 'Dallas Cowboys',
        homeScore: 17,
        awayScore: 14,
        quarter: '3rd',
        timeRemaining: '8:30',
        status: 'live',
        date: new Date().toISOString(),
        stadium: 'Levi\'s Stadium'
      }
    ];

    res.json({
      success: true,
      count: games.length,
      games,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/nfl/games:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Picks endpoints - your frontend calls /api/picks/daily but your server has /api/daily-picks
// Add redirect for compatibility
app.get('/api/picks/daily', async (req, res) => {
  // Redirect to the actual endpoint
  try {
    const { sport, date } = req.query;
    
    const picks = [
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
      },
      {
        id: 2,
        sport: sport || 'NBA',
        player: 'Nikola Jokic',
        team: 'Denver Nuggets',
        pickType: 'Double Double',
        stat: 'Points + Rebounds',
        line: 'Over 20+10',
        confidence: 90,
        reasoning: 'Consistent performer, dominant in paint',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      picks,
      timestamp: new Date().toISOString(),
      meta: {
        sport,
        date,
        totalPicks: picks.length,
        note: 'Endpoint also available at /api/daily-picks'
      }
    });
  } catch (error) {
    console.error('Error in /api/picks/daily:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch picks' });
  }
});

// AI Predictions endpoint - your frontend expects /api/predictions/ai
app.get('/api/predictions/ai', async (req, res) => {
  try {
    const predictions = [
      {
        id: 1,
        game: 'Lakers vs Warriors',
        prediction: 'Warriors ML',
        confidence: 72,
        aiModel: 'Deep Learning v3',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        game: 'Celtics vs Heat',
        prediction: 'Over 215.5',
        confidence: 68,
        aiModel: 'Neural Network v2',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      predictions,
      model: 'NBA Fantasy AI v2.1',
      updatedAt: new Date().toISOString(),
      note: 'Endpoint also available at /api/ai-predictions'
    });
  } catch (error) {
    console.error('Error in /api/predictions/ai:', error);
    res.status(500).json({ success: false, error: 'AI service unavailable' });
  }
});

// ====================
// EXISTING ENDPOINTS (keep these as they are)
// ====================

app.get('/api/players', async (req, res) => {
  try {
    // Check Redis cache first
    if (req.redis) {
      const cached = await req.redis.get('nba:players:all');
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const players = [
      { id: 1, name: 'LeBron James', team: 'LAL', position: 'SF', points: 25.3, assists: 7.9, rebounds: 7.9 },
      { id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 29.4, assists: 6.3, rebounds: 5.0 },
      { id: 3, name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 27.1, assists: 5.6, rebounds: 6.6 },
      { id: 4, name: 'Luka Dončić', team: 'DAL', position: 'PG', points: 33.9, assists: 9.8, rebounds: 9.2 },
      { id: 5, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4, assists: 6.5, rebounds: 11.5 },
    ];

    // Cache for 5 minutes
    if (req.redis) {
      await req.redis.setex('nba:players:all', 300, JSON.stringify({
        success: true,
        count: players.length,
        players,
        cached: true,
        timestamp: new Date().toISOString()
      }));
    }

    res.json({
      success: true,
      count: players.length,
      players,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/players:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const teams = [
      { id: 1, name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'West', wins: 42, losses: 30 },
      { id: 2, name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'West', wins: 40, losses: 34 },
      { id: 3, name: 'Boston Celtics', abbreviation: 'BOS', conference: 'East', wins: 57, losses: 15 },
      { id: 4, name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'East', wins: 47, losses: 27 },
      { id: 5, name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'West', wins: 52, losses: 23 },
    ];

    res.json({
      success: true,
      count: teams.length,
      teams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/games/live', async (req, res) => {
  try {
    const liveGames = [
      {
        id: 1,
        homeTeam: 'LAL',
        awayTeam: 'GSW',
        homeScore: 108,
        awayScore: 105,
        quarter: '4th',
        timeRemaining: '2:14',
        status: 'live',
        period: 4,
        lastPlay: 'LeBron James makes 2pt driving layup'
      },
      {
        id: 2,
        homeTeam: 'BOS',
        awayTeam: 'MIA',
        homeScore: 95,
        awayScore: 89,
        quarter: '3rd',
        timeRemaining: '5:42',
        status: 'live',
        period: 3,
        lastPlay: 'Jayson Tatum makes 3pt jump shot'
      }
    ];

    res.json({
      success: true,
      count: liveGames.length,
      games: liveGames,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ====================
// NEW DAILY PICKS ENDPOINTS
// ====================
app.get('/api/daily-picks', async (req, res) => {
  try {
    const { sport, date } = req.query;
    
    // In production, fetch from database or external API
    // For now, return mock data
    const picks = [
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
      },
      {
        id: 2,
        sport: sport || 'NBA',
        player: 'Nikola Jokic',
        team: 'Denver Nuggets',
        pickType: 'Double Double',
        stat: 'Points + Rebounds',
        line: 'Over 20+10',
        confidence: 90,
        reasoning: 'Consistent performer, dominant in paint',
        timestamp: new Date().toISOString()
      }
    ];
    
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

app.get('/api/ai-predictions', async (req, res) => {
  try {
    // Connect to your AI model or prediction service
    // For now, return mock data
    const predictions = [
      {
        id: 1,
        game: 'Lakers vs Warriors',
        prediction: 'Warriors ML',
        confidence: 72,
        aiModel: 'Deep Learning v3',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        game: 'Celtics vs Heat',
        prediction: 'Over 215.5',
        confidence: 68,
        aiModel: 'Neural Network v2',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      predictions,
      model: 'NBA Fantasy AI v2.1',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching AI predictions:', error);
    res.status(500).json({ success: false, error: 'AI service unavailable' });
  }
});

app.get('/api/expert-picks', async (req, res) => {
  try {
    // Aggregate picks from various expert sources
    // For now, return mock data
    const expertPicks = [
      {
        id: 1,
        expert: 'Mike Greenberg',
        expertRole: 'NBA Analyst',
        pick: 'Suns -4.5',
        reasoning: 'Booker and Durant healthy, home court advantage',
        record: '42-28-3',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        expert: 'Doris Burke',
        expertRole: 'Lead Commentator',
        pick: 'Giannis Over 32.5 Points',
        reasoning: 'No Embiid defending, Bucks need him to score',
        record: '38-24-2',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Helper function to calculate consensus
    const calculateConsensus = (picks) => {
      // In a real implementation, analyze all picks for consensus
      return {
        mostConfidentPick: 'Warriors -3.5',
        confidence: 78,
        expertCount: picks.length,
        averageRecord: '40-26-2'
      };
    };
    
    res.json({
      success: true,
      picks: expertPicks,
      sources: ['ESPN', 'CBS', 'The Athletic', 'Bleacher Report'],
      consensus: calculateConsensus(expertPicks),
    });
  } catch (error) {
    console.error('Error fetching expert picks:', error);
    res.status(500).json({ success: false, error: 'Expert data unavailable' });
  }
});

// Backup monitoring endpoint (requires authentication middleware)
// Note: You'll need to import/implement authenticateToken and requireRole
app.get('/api/admin/backup-status', async (req, res) => {
  try {
    // In production, you would use middleware:
    // app.get('/api/admin/backup-status', authenticateToken, requireRole(['admin']), async (req, res) => {
    
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    const backupInfo = {
      database: mongoose.connection.name,
      collections: stats.collections,
      size: stats.dataSize,
      lastBackup: new Date().toISOString(), // In production, get from Atlas API
      backupEnabled: true,
      retentionDays: 30
    };
    
    res.json({ success: true, backupInfo });
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get backup status' 
    });
  }
});

// ====================
// WEBSOCKET HANDLERS
// ====================
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join game room
  socket.on('subscribe-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`📡 Client ${socket.id} subscribed to game ${gameId}`);
    
    // Send initial game state
    socket.emit('game-state', {
      gameId,
      homeScore: 108,
      awayScore: 105,
      quarter: '4th',
      timeRemaining: '2:14',
      players: []
    });
  });

  // Leave game room
  socket.on('unsubscribe-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`📡 Client ${socket.id} unsubscribed from game ${gameId}`);
  });

  // Fantasy lineup updates
  socket.on('fantasy-update', (data) => {
    console.log('Fantasy update received:', data);
    // Broadcast to all clients in the user's league
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
  }, 5000); // Update every 5 seconds
};

// ====================
// ERROR HANDLING
// ====================
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    availableEndpoints: [
      '/health',
      '/api',
      '/api/nba/*',
      '/api/nhl/*',
      '/api/nfl/*',
      '/api/news/*',
      '/api/fantasy/*',
      '/api/analytics/*',
      '/api/picks/*',
      '/api/daily-picks',
      '/api/ai-predictions',
      '/api/expert-picks',
      '/api/players',
      '/api/teams',
      '/api/games/live',
      // New endpoints added for frontend compatibility
      '/api/nba/games',
      '/api/news/all',
      '/api/nhl/games',
      '/api/nhl/standings',
      '/api/nfl/games',
      '/api/picks/daily',
      '/api/predictions/ai'
    ]
  });
});

// Global error handler
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
  // Connect to databases
  await connectDB();
  
  // Start live updates simulation
  if (process.env.NODE_ENV !== 'production') {
    simulateLiveUpdates();
    console.log('⚡ Live game updates simulation started');
  }
  
  // Start server
  httpServer.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 NBA Fantasy AI Backend Server Started');
    console.log('='.repeat(50));
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://10.0.0.183:${PORT}`);
    console.log(`📊 Health Check: http://10.0.0.183:${PORT}/health`);
    console.log(`📡 API Documentation: http://10.0.0.183:${PORT}/api`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
    console.log('\n🏀 NBA Endpoints:');
    console.log('   GET /api/nba/games ✅ NEW');
    console.log('   GET /api/nba/news');
    console.log('   GET /api/nba/standings');
    console.log('   GET /api/nba/players');
    console.log('\n🏒 NHL Endpoints:');
    console.log('   GET /api/nhl/games ✅ NEW');
    console.log('   GET /api/nhl/standings ✅ NEW');
    console.log('   GET /api/nhl/stats');
    console.log('\n🏈 NFL Endpoints:');
    console.log('   GET /api/nfl/games ✅ NEW');
    console.log('   GET /api/nfl/stats');
    console.log('\n📰 Sports News Hub:');
    console.log('   GET /api/news/all ✅ NEW (combined NBA, NHL, NFL, injuries)');
    console.log('\n🎯 Daily Picks Endpoints:');
    console.log('   GET /api/daily-picks');
    console.log('   GET /api/ai-predictions');
    console.log('   GET /api/expert-picks');
    console.log('   GET /api/picks/daily ✅ NEW (compatibility endpoint)');
    console.log('   GET /api/predictions/ai ✅ NEW (compatibility endpoint)');
    console.log('   POST /api/picks/track-pick-result');
    console.log('   GET /api/picks/user-pick-analytics/:userId');
    console.log('\n⚡ Live updates via Socket.IO on ws://10.0.0.183:3000');
    
    if (redisClient?.status === 'ready') {
      console.log('✅ Connected to Redis cache');
    }
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Connected to MongoDB');
    }
    
    console.log('='.repeat(50) + '\n');
  });
};

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
    
    // Close Redis connection
    if (redisClient) {
      redisClient.quit();
      console.log('Redis connection closed');
    }
    
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});

export default app;
