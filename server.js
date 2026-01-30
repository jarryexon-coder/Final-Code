// server.js - FIXED CORS ORDER
// ====================
// IMPORTANT: CORS MUST BE BEFORE HEALTH ENDPOINTS
// ====================

console.log('🚫 DISABLING all external API calls during startup');
console.log('🔍 Monitoring scheduler activity...');

// Simple monitoring - just log, don't block
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, delay, ...args) {
  const stack = new Error().stack;
  if (stack.includes('nbaRoutes.js') && delay < 10000) {
    console.log(`⚠️  Warning: nbaRoutes.js creating ${delay}ms timeout`);
  }
  return originalSetTimeout(callback, delay, ...args);
};

// ====================
// IMPORTS - MUST BE AT TOP
// ====================
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
// CORS CONFIGURATION - MUST BE BEFORE HEALTH ENDPOINTS!
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
// APPLY CORS MIDDLEWARE - THIS MUST HAPPEN FIRST!
// ====================
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
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
// HEALTH ENDPOINTS - NOW THEY WILL HAVE CORS HEADERS!
// ====================

// 1. SIMPLE HEALTH CHECK (Available immediately)
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NBA Fantasy AI Backend',
    cors: 'enabled',
    origin: req.get('origin') || 'no-origin'
  });
});

// 2. RAILWAY HEALTH CHECK (Available immediately)
app.get('/railway-health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    cors: 'enabled',
    origin: req.get('origin') || 'no-origin'
  });
});

// 3. Internal networking test endpoint
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
    },
    cors: 'enabled'
  });
});

// ====================
// OTHER MIDDLEWARE
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
// OTHER ROUTES
// ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend Server',
    status: 'OK',
    cors: 'enabled',
    origin: req.get('origin') || 'no-origin',
    endpoints: [
      '/health',
      '/railway-health',
      '/api/internal-test',
      '/api/cors-debug',
      '/api/cors-test-headers',
      '/api/debug',
      '/api/cors-test',
      '/api/auth',
      '/api/nba'
    ]
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Direct debug route works',
    timestamp: new Date().toISOString(),
    server: 'NBA Fantasy AI Backend',
    cors: 'enabled',
    origin: req.get('origin') || 'no-origin'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.get('origin') || 'no-origin';
  
  res.json({
    success: true,
    message: 'CORS test endpoint',
    origin: origin,
    allowed: true,
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins
  });
});

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
      method: req.method
    },
    cors: {
      allowedOrigins: allowedOrigins,
      isAllowed: allowedOrigins.includes(origin) || origin.endsWith('.railway.app')
    },
    timestamp: new Date().toISOString()
  });
});

// CORS headers test
app.get('/api/cors-test-headers', (req, res) => {
  const origin = req.get('origin');
  res.json({
    success: true,
    message: 'CORS headers test',
    headers: {
      'Access-Control-Allow-Origin': origin || 'not-set',
      'Access-Control-Allow-Credentials': 'true'
    },
    origin: origin,
    timestamp: new Date().toISOString()
  });
});

// ====================
// API Health endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStatus = mongoState === 1 ? 'connected' : 
                       mongoState === 2 ? 'connecting' : 'disconnected';
    
    res.json({
      status: 'healthy',
      databases: { mongodb: mongoStatus },
      timestamp: new Date().toISOString(),
      cors: 'enabled',
      origin: req.get('origin') || 'no-origin'
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ====================
// STARTUP LOGIC (keep your existing code below)
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

// 3. Create startup tracker
let startupComplete = false;
let startupBarrierResolve;
const startupBarrier = new Promise((resolve) => {
  startupBarrierResolve = resolve;
});

// Start the async startup process
setTimeout(() => {
  startupComplete = true;
  console.log('✅ Startup complete - API calls now allowed');
  if (originalFetch) global.fetch = originalFetch;
  process.env.DISABLE_SCHEDULER = 'false';
  process.env.DISABLE_API_CALLS = 'false';
  
  if (!schedulerJob) {
    schedulerJob = initializeSafeScheduler();
  }
  
  startupBarrierResolve();
}, 180000);

// ====================
// SCHEDULER FUNCTIONS (keep your existing)
// ====================
let lastNBACall = 0;
const NBA_CALL_INTERVAL = 300000;

async function safeFetchNBAData() {
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
    const nbaModule = await import('./routes/nbaRoutes.js');
    
    if (nbaModule.default && nbaModule.default.startScheduler) {
      console.log('🚨 BLOCKING aggressive scheduler from nbaRoutes.js');
      console.log('⚠️  Using safe throttled fetch instead');
      
      if (nbaModule.default.fetchGames) {
        await nbaModule.default.fetchGames();
      }
    } else if (nbaModule.fetchNBAData || nbaModule.default?.fetchNBAData) {
      const fetchFunc = nbaModule.fetchNBAData || nbaModule.default.fetchNBAData;
      await fetchFunc();
    } else {
      console.log('⚠️  No fetch function found, using minimal API call');
    }
    
    console.log('✅ SAFE NBA data fetch completed');
  } catch (err) {
    console.error('❌ NBA fetch error (non-fatal):', err.message);
  }
}

function initializeSafeScheduler() {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    console.log('⏸️ Scheduler disabled during startup');
    return null;
  }
  
  console.log('⏰ Initializing SAFE throttled scheduler (every 5 minutes)');
  
  const job = schedule.scheduleJob('*/5 * * * *', async () => {
    console.log('⏰ SAFE scheduled NBA data fetch (5-minute interval)');
    await safeFetchNBAData();
  });
  
  setTimeout(() => {
    console.log('🚀 Running initial SAFE NBA data fetch');
    safeFetchNBAData();
  }, 10000);
  
  return job;
}

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
    const router = express.Router();
    router.get('/', (req, res) => res.json({ message: 'NBA API' }));
    return router;
  }
}

// ====================
// Memory monitoring
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`🧠 Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
}, 30000);

// ====================
// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error.message);
  console.error('Stack:', error.stack);
});

// ====================
// Start server function
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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // 2. Mark server as ready
    serverReady = true;
    console.log('✅ Server marked as ready for HTTP connections');
    
    // 3. Load essential routes
    console.log('\n🔗 Loading essential routes in background...');
    
    setTimeout(async () => {
      try {
        const nbaRouter = await loadSafeNBARoutes();
        app.use('/api/nba', nbaRouter);
        console.log('✅ NBA routes loaded at /api/nba');
      } catch (error) {
        console.error('❌ Failed to load NBA routes:', error.message);
      }
    }, 1000);
    
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
      }, 2000 + (index * 1000));
    });
    
    // 4. Initialize scheduler
    console.log('⏰ Setting up SAFE throttled scheduler in background...');
    setTimeout(() => {
      schedulerJob = initializeSafeScheduler();
    }, 5000);
    
    // 5. Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉 HTTP SERVER LISTENING ON http://${HOST}:${PORT}`);
      console.log('✅ Health endpoints available immediately WITH CORS');
      console.log('✅ Railway health check will PASS');
      console.log(`========================================`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🏥 Railway Health: http://${HOST}:${PORT}/railway-health`);
      console.log(`🔧 CORS Debug: http://${HOST}:${PORT}/api/cors-debug`);
      console.log(`\nPress Ctrl+C to stop gracefully`);
    });
    
    // Cleanup tasks
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
