import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting PRODUCTION NBA Fantasy Backend');
console.log('🔍 Environment Check:');
console.log('PORT:', process.env.PORT || 3002);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// MIDDLEWARE (SIMPLIFIED)
// ====================
const allowedOrigins = [
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19000'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (simplified)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' }
});
app.use('/api/auth/login', authLimiter);

// ====================
// HEALTH ENDPOINTS
// ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '5.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
  
  res.json({
    status: 'healthy',
    databases: { mongodb: mongoStatus },
    timestamp: new Date().toISOString()
  });
});

// ====================
// BASIC API ENDPOINTS
// ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend Server is running!',
    version: '5.0.0',
    endpoints: ['/health', '/api/health', '/api/auth', '/api/nba', '/api/players', '/api/teams', '/api/games']
  });
});

// Simple endpoints for testing
app.get('/api/nba', (req, res) => {
  res.json({ success: true, message: 'NBA API', endpoints: ['/api/nba/games', '/api/nba/players'] });
});

app.get('/api/players', (req, res) => {
  res.json({ success: true, message: 'Players API', endpoints: ['/api/players', '/api/players/search'] });
});

app.get('/api/teams', (req, res) => {
  res.json({ success: true, message: 'Teams API', endpoints: ['/api/teams', '/api/teams/standings'] });
});

app.get('/api/games', (req, res) => {
  res.json({ success: true, message: 'Games API', endpoints: ['/api/games/live', '/api/games/upcoming'] });
});

// ====================
// LOAD AND MOUNT ALL ROUTES
// ====================
async function loadAllRoutes() {
  console.log('\n🔗 Loading routes...');
  
  const routesToLoad = [
    { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
    { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA Routes' },
    { path: '/api/players', file: 'players.js', name: 'Players Routes' },
    { path: '/api/teams', file: 'teams.js', name: 'Teams Routes' },
    { path: '/api/games', file: 'games.js', name: 'Games Routes' },
    { path: '/api/secret-phrases', file: 'secret-phrases.js', name: 'Secret Phrases Routes' },
    { path: '/api/betting', file: 'betting.js', name: 'Betting Routes' },
    { path: '/api/analytics', file: 'analytics.js', name: 'Analytics Routes' },
    { path: '/api/predictions', file: 'predictions.js', name: 'Predictions Routes' },
    { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
  ];
  
  let loaded = 0;
  let failed = 0;
  
  for (const route of routesToLoad) {
    try {
      const modulePath = path.join(__dirname, 'routes', route.file);
      const module = await import(modulePath);
      
      if (module.default && typeof module.default === 'function') {
        app.use(route.path, module.default);
        console.log(`✅ ${route.name} loaded at ${route.path}`);
        loaded++;
      } else {
        console.log(`⚠ ${route.name} has no default export`);
        failed++;
      }
    } catch (error) {
      console.log(`⚠ Could not load ${route.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`📊 Routes loaded: ${loaded} successful, ${failed} failed`);
}

// ====================
// DATABASE CONNECTION
// ====================
async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
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
}

// ====================
// ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
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
      '/api/auth',
      '/api/nba', 
      '/api/players',
      '/api/teams',
      '/api/games'
    ]
  });
});

// ====================
// START SERVER
// ====================
async function startServer() {
  try {
    // 1. Connect to database
    await connectDB();
    
    // 2. Load all routes
    await loadAllRoutes();
    
    // 3. Start server
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉 PRODUCTION SERVER RUNNING ON http://${HOST}:${PORT}`);
      console.log(`========================================`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth API: http://${HOST}:${PORT}/api/auth`);
      console.log(`🎮 Games API: http://${HOST}:${PORT}/api/games`);
      console.log(`🏀 NBA API: http://${HOST}:${PORT}/api/nba`);
      console.log(`💰 Betting: http://${HOST}:${PORT}/api/betting`);
      console.log(`🔮 Predictions: http://${HOST}:${PORT}/api/predictions`);
      console.log(`========================================`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
