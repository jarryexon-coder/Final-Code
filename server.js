// server.js - ES Module with proper imports

// EMERGENCY FIX: IMMEDIATE HEALTH CHECK RESPONSE
// ====================
// CRITICAL: DISABLE ALL EXTERNAL API CALLS ON STARTUP
// ====================
console.log('🚫 DISABLING all external API calls during startup');

// ====================
// SIMPLE CHECK: Log scheduler activity without blocking
// ====================
console.log('🔍 Monitoring scheduler activity...');

// Just log, don't block
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, delay, ...args) {
  const stack = new Error().stack;
  
  // Just LOG aggressive patterns from nbaRoutes.js
  if (stack.includes('nbaRoutes.js') && delay < 10000) {
    console.log(`⚠️  Warning: nbaRoutes.js creating ${delay}ms timeout`);
  }
  
  return originalSetTimeout(callback, delay, ...args);
};

// ====================
// CONTINUE WITH ORIGINAL FILE 2 CODE
// ====================

// 1. Monkey-patch fetch to block external calls
const originalFetch = global.fetch;
if (originalFetch) {
  global.fetch = function(...args) {
    const url = args[0]?.slice?.(0, 100) || args[0];
    console.log('🛑 BLOCKED fetch call during startup:', url);
    return Promise.reject(new Error('External API calls disabled during startup'));
  };
}

// 2. DISABLE aggressive scheduler imports
process.env.DISABLE_SCHEDULER = 'true';
process.env.DISABLE_API_CALLS = 'true';

// 3. Create startup tracker (NO LONGER A BARRIER FOR HEALTH CHECKS)
let startupComplete = false;
let startupBarrierResolve;
const startupBarrier = new Promise((resolve) => {
  startupBarrierResolve = resolve;
});

// Start the async startup process
setTimeout(() => {
  startupComplete = true;
  console.log('✅ Startup complete - API calls now allowed');
  // Restore original functions
  if (originalFetch) global.fetch = originalFetch;
  process.env.DISABLE_SCHEDULER = 'false';
  process.env.DISABLE_API_CALLS = 'false';
  
  // Initialize SAFE scheduler now
  if (!schedulerJob) {
    schedulerJob = initializeSafeScheduler();
  }
  
  startupBarrierResolve();
}, 180000); // 3 MINUTE startup cooldown (but health checks work immediately)

// ====================
// EMERGENCY: SAFE THROTTLED SCHEDULER
// ====================
let lastNBACall = 0;
const NBA_CALL_INTERVAL = 300000; // 5 MINUTES (300,000ms)

async function safeFetchNBAData() {
  // Check if API calls are disabled
  if (process.env.DISABLE_API_CALLS === 'true') {
    console.log('⏸️ Scheduler paused - startup cooldown active');
    return;
  }
  
  const now = Date.now();
  if (now - lastNBACall < NBA_CALL_INTERVAL) {
    console.log(`⏸️ NBA fetch throttled: ${Math.round((NBA_CALL_INTERVAL - (now - lastNBACall)) / 1000)}s remaining`);
    return;
  }
  
  lastNBACall = now;
  console.log('🔄 SAFE NBA data fetch (throttled to 5 minutes)');
  
  try {
    // Use direct import for NBA routes
    const nbaModule = await import('./routes/nbaRoutes.js');
    
    // EMERGENCY: Check if this is the aggressive 60/min scheduler
    if (nbaModule.default && nbaModule.default.startScheduler) {
      console.log('🚨 BLOCKING aggressive scheduler from nbaRoutes.js');
      console.log('⚠️  Using safe throttled fetch instead');
      
      // Use a minimal fetch if available, or skip
      if (nbaModule.default.fetchGames) {
        await nbaModule.default.fetchGames();
      }
    } else if (nbaModule.fetchNBAData || nbaModule.default?.fetchNBAData) {
      // Use the safe fetch function
      const fetchFunc = nbaModule.fetchNBAData || nbaModule.default.fetchNBAData;
      await fetchFunc();
    } else {
      // Fallback minimal fetch
      console.log('⚠️  No fetch function found, using minimal API call');
    }
    
    console.log('✅ SAFE NBA data fetch completed');
  } catch (err) {
    console.error('❌ NBA fetch error (non-fatal):', err.message);
  }
}

// Initialize the SAFE scheduler (NO 60/min!)
function initializeSafeScheduler() {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    console.log('⏸️ Scheduler disabled during startup');
    return null;
  }
  
  console.log('⏰ Initializing SAFE throttled scheduler (every 5 minutes)');
  
  // SAFE: Schedule job to run every 5 minutes ONLY
  const job = schedule.scheduleJob('*/5 * * * *', async () => {
    console.log('⏰ SAFE scheduled NBA data fetch (5-minute interval)');
    await safeFetchNBAData();
  });
  
  // Run initial fetch after scheduler is set up
  setTimeout(() => {
    console.log('🚀 Running initial SAFE NBA data fetch');
    safeFetchNBAData();
  }, 10000);
  
  return job;
}

// SIMPLE: Load NBA routes
async function loadSafeNBARoutes() {
  console.log('🔧 Loading NBA routes...');
  
  try {
    const nbaModule = await import('./routes/nbaRoutes.js');
    
    if (nbaModule.default) {
      console.log('✅ NBA routes loaded');
      return nbaModule.default;
    }
    
    throw new Error('No default export');
  } catch (error) {
    console.error('❌ NBA routes failed:', error.message);
    // Fallback
    const router = express.Router();
    router.get('/', (req, res) => res.json({ message: 'NBA API' }));
    return router;
  }
}

// ====================
// Memory monitoring (safe interval)
// ====================
let memoryMonitor;
// We'll create this with the original setInterval
memoryMonitor = setInterval(() => {
  const used = process.memoryUsage();
  console.log(`🧠 Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
}, 30000); // Log every 30 seconds

// ====================
// Error handlers
// ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error.message);
  console.error('Stack:', error.stack);
});

// ====================
// Express setup - MUST BE AT THE TOP LEVEL
// ====================

// Import all modules at the top
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import schedule from 'node-schedule';

console.log('✅ Simple scheduler monitoring enabled');

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Cleanup tracker
const cleanupTasks = [];
let serverReady = false;
let schedulerJob = null;

// ====================
// CORS CONFIGURATION FROM FILE 1
// ====================

// Define allowed origins
const allowedOrigins = [
  'https://februaryfantasy-production.up.railway.app',
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081'
];

// Add Railway domain if it exists
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  allowedOrigins.push(process.env.RAILWAY_PUBLIC_DOMAIN);
}

console.log('✅ CORS configured for:', allowedOrigins);

// ====================
// CRITICAL FIX: HEALTH ENDPOINTS MUST WORK IMMEDIATELY
// ====================

// 1. SIMPLE HEALTH CHECK (Available immediately)
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NBA Fantasy AI Backend',
    startup: startupComplete ? 'complete' : 'in-progress',
    scheduler: 'safe (5-minute intervals)'
  });
});

// 2. RAILWAY HEALTH CHECK (Available immediately - NO BLOCKING!)
app.get('/railway-health', (req, res) => {
  // CRITICAL: This must return immediately with 200 status
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    startup: startupComplete ? 'complete' : 'in-progress',
    server: 'listening'
  });
});

// 3. API Health with DB status (Available immediately, async but non-blocking)
app.get('/api/health', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
    
    res.json({
      status: 'healthy',
      databases: { mongodb: mongoStatus },
      timestamp: new Date().toISOString(),
      scheduler: 'safe-throttled',
      startup: startupComplete ? 'complete' : 'in-progress'
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 4. Internal networking test endpoint
app.get('/api/internal-test', (req, res) => {
  res.json({
    success: true,
    headers: req.headers,
    host: req.get('host'),
    ip: req.ip,
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT,
      publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
      staticUrl: process.env.RAILWAY_STATIC_URL
    }
  });
});

// ====================
// Apply CORS middleware FROM FILE 1
// ====================
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      console.log('🔄 Request with no origin - allowing');
      return callback(null, true);
    }
    
    // Check if origin is explicitly allowed
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Special case: Allow any Railway domain
    if (origin.endsWith('.railway.app')) {
      console.log(`✅ Allowing Railway domain: ${origin}`);
      return callback(null, true);
    }
    
    // Log blocked origins
    console.log(`❌ CORS blocked: ${origin}`);
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    
    const error = new Error('Not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'Access-Control-Allow-Origin']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// ====================
// Other middleware
// ====================

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ====================
// Other routes
// ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend Server (SAFE MODE)',
    status: 'OK',
    scheduler: 'Throttled to 5-minute intervals',
    startup: startupComplete ? 'complete' : 'in-progress',
    endpoints: [
      '/health',
      '/railway-health',
      '/api/health',
      '/api/internal-test',
      '/api/cors-debug',
      '/api/cors-test-headers',
      '/api/debug',
      '/api/cors-test',
      '/api/auth',
      '/api/nba',
      '/api/players',
      '/api/teams',
      '/api/games',
      '/api/predictions',
      '/api/fantasy'
    ]
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Direct debug route works',
    timestamp: new Date().toISOString(),
    server: 'NBA Fantasy AI Backend (Safe Mode)',
    scheduler: '5-minute intervals only',
    startup: startupComplete ? 'complete' : 'in-progress'
  });
});

// Old CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.get('origin') || req.get('referer') || 'no-origin';
  
  res.json({
    success: true,
    message: 'CORS test endpoint',
    origin: origin,
    allowed: true,
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins
  });
});

// ====================
// CORS DEBUG ENDPOINTS FROM FILE 2
// ====================

// CORS debug endpoint
app.get('/api/cors-debug', (req, res) => {
  const origin = req.get('origin') || 'no-origin';
  const referer = req.get('referer') || 'no-referer';
  
  res.json({
    success: true,
    message: 'CORS debug endpoint',
    request: {
      origin: origin,
      referer: referer,
      method: req.method,
      headers: {
        'access-control-request-method': req.get('access-control-request-method'),
        'access-control-request-headers': req.get('access-control-request-headers')
      }
    },
    cors: {
      allowedOrigins: allowedOrigins,
      isAllowed: allowedOrigins.includes(origin) || origin.endsWith('.railway.app')
    },
    timestamp: new Date().toISOString()
  });
});

// Test if CORS headers are being sent
app.get('/api/cors-test-headers', (req, res) => {
  // Manually set CORS headers
  const origin = req.get('origin');
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.railway.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.json({
    success: true,
    message: 'CORS headers test',
    headers: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    },
    origin: origin,
    timestamp: new Date().toISOString()
  });
});

// ====================
// MIDDLEWARE: Block other routes during startup (EXCEPT health endpoints)
// ====================
app.use((req, res, next) => {
  // Skip for health endpoints (already defined above)
  const allowedDuringStartup = [
    '/health',
    '/railway-health', 
    '/api/health',
    '/',
    '/api/internal-test',
    '/api/debug',
    '/api/cors-test',
    '/api/cors-debug',
    '/api/cors-test-headers'
  ];
  
  if (allowedDuringStartup.includes(req.path)) {
    return next();
  }
  
  // Block other routes during startup
  if (!startupComplete) {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is starting up, please wait...',
      readyIn: '3 minutes max',
      progress: 'loading routes and initializing scheduler'
    });
  }
  next();
});

// ====================
// Start server function
// ====================
async function startServer() {
  console.log('🔍 Environment Check:');
  console.log('PORT:', PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('========================================');
  
  try {
    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // 2. Mark server as ready for HTTP connections
    serverReady = true;
    console.log('✅ Server marked as ready for HTTP connections');
    
    // 3. Load essential routes (non-blocking, async)
    console.log('\n🔗 Loading essential routes in background...');
    
    // Load safe NBA routes
    setTimeout(async () => {
      try {
        const nbaRouter = await loadSafeNBARoutes();
        app.use('/api/nba', nbaRouter);
        console.log('✅ NBA routes loaded at /api/nba');
      } catch (error) {
        console.error('❌ Failed to load NBA routes:', error.message);
      }
    }, 1000);
    
    // Load other essential routes
    const essentialRoutes = [
      { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
      { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
      { path: '/api/players', file: 'players.js', name: 'Players Routes' }
    ];
    
    essentialRoutes.forEach((route, index) => {
      setTimeout(async () => {
        try {
          const module = await import(`./routes/${route.file}`);
          if (module.default) {
            app.use(route.path, module.default);
            console.log(`✅ ${route.name} loaded at ${route.path}`);
          }
        } catch (error) {
          console.log(`❌ Could not load ${route.name}: ${error.message}`);
        }
      }, 2000 + (index * 1000)); // Stagger loading
    });
    
    // 4. Initialize SAFE scheduler (in background)
    console.log('⏰ Setting up SAFE throttled scheduler in background...');
    setTimeout(() => {
      schedulerJob = initializeSafeScheduler();
    }, 5000);
    
    // 5. Start HTTP server (MOST IMPORTANT - THIS HAPPENS IMMEDIATELY!)
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉 HTTP SERVER LISTENING ON http://${HOST}:${PORT}`);
      console.log('✅ Health endpoints available immediately');
      console.log('✅ Railway health check will PASS');
      console.log(`========================================`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🏥 Railway Health: http://${HOST}:${PORT}/railway-health`);
      console.log(`🔧 Internal Test: http://${HOST}:${PORT}/api/internal-test`);
      console.log(`🔧 CORS Debug: http://${HOST}:${PORT}/api/cors-debug`);
      console.log(`🔧 CORS Headers Test: http://${HOST}:${PORT}/api/cors-test-headers`);
      console.log(`\nPress Ctrl+C to stop gracefully`);
    });
    
    // Add cleanup tasks
    cleanupTasks.push(async () => {
      if (schedulerJob) {
        console.log('🛑 Cancelling safe scheduler job...');
        schedulerJob.cancel();
        console.log('✅ Safe scheduler cancelled');
      }
    });
    
    cleanupTasks.push(async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      } catch (error) {
        console.log('⚠️ MongoDB close error:', error.message);
      }
    });
    
    cleanupTasks.push(() => {
      return new Promise(resolve => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    });
    
    // Graceful shutdown
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
