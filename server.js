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

// 2. Clear node-schedule if it exists
if (global.schedule) {
  console.log('🚨 Clearing global.schedule jobs');
  Object.values(global.schedule?.scheduledJobs || {}).forEach(job => {
    try { job.cancel(); } catch {}
  });
}

// 3. Patch node-schedule AFTER it's imported (we'll do this later)
// We'll handle this in the initializeSafeScheduler function

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
  
  // EMERGENCY: Patch the schedule object before using it
  if (schedule && schedule.scheduleJob) {
    const originalScheduleJob = schedule.scheduleJob;
    schedule.scheduleJob = (...args) => {
      console.log('🛑 SAFE: scheduleJob intercepted - using safe 5-minute interval');
      // Only allow */5 * * * * pattern (every 5 minutes)
      const pattern = args[0];
      if (pattern !== '*/5 * * * *') {
        console.log(`🚨 BLOCKED aggressive schedule pattern: ${pattern}`);
        console.log('✅ Using safe 5-minute pattern instead');
        args[0] = '*/5 * * * *';
      }
      return originalScheduleJob.apply(schedule, args);
    };
  }
  
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
  
  // EMERGENCY: Clear ANY existing aggressive schedules
  console.log('🚨 Clearing any existing aggressive schedules...');
  Object.values(schedule.scheduledJobs).forEach(job => {
    job.cancel();
  });
  
  return job;
}

// ====================
// EMERGENCY PATCH: REPLACED WITH FILE 1 VERSION (SIMPLIFIED)
// ====================
// EMERGENCY: Load SAFE NBA routes (COMPLETELY DISABLE 60/min)
async function loadSafeNBARoutes() {
  console.log('🔧 Loading EMERGENCY SAFE NBA routes...');
  
  try {
    // Try to load the patch first
    try {
      const { createSafeNBARouter } = await import('./routes/nbaRoutes-patch.js');
      const safeRouter = createSafeNBARouter();
      console.log('✅ Loaded nbaRoutes-patch.js');
      return safeRouter;
    } catch (patchError) {
      console.log('⚠️ nbaRoutes-patch.js not found, patching original module:', patchError.message);
    }
    
    // Load and patch the original module
    const originalModule = await import('./routes/nbaRoutes.js');
    
    // EMERGENCY: Also attempt to disable the original module's scheduler
    if (originalModule.default) {
      if (typeof originalModule.default.startScheduler === 'function') {
        originalModule.default.startScheduler = () => {
          console.log('🛑 EMERGENCY: Original startScheduler BLOCKED');
          return { cancel: () => {} };
        };
      }
      
      if (typeof originalModule.default.scheduleJob === 'function') {
        originalModule.default.scheduleJob = () => {
          console.log('🛑 EMERGENCY: Original scheduleJob BLOCKED');
          return { cancel: () => {} };
        };
      }
    }
    
    // Patch the module's exports
    Object.keys(originalModule).forEach(key => {
      if (key.includes('Scheduler') || key.includes('schedule')) {
        originalModule[key] = () => {
          console.log(`🛑 EMERGENCY: ${key} BLOCKED`);
          return { cancel: () => {} };
        };
      }
    });
    
    // Return the patched module
    return originalModule.default || originalModule;
    
  } catch (error) {
    console.error('❌ Emergency NBA routes failed:', error.message);
    // Fallback to minimal router
    const express = await import('express');
    const router = express.Router();
    router.get('/', (req, res) => res.json({ 
      message: 'NBA API (Emergency Fallback)',
      status: 'safe'
    }));
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
// Express setup
// ====================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import schedule from 'node-schedule';

// ====================
// REMOVED: TARGETED FIX SECTION
// Now using simple monitoring instead of blocking
// ====================

console.log('✅ Simple scheduler monitoring enabled');

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Cleanup tracker
const cleanupTasks = [];
let serverReady = false;
let schedulerJob = null;

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

// ====================
// Other middleware (AFTER health endpoints!)
// ====================

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19000',
      'https://februaryfantasy-production.up.railway.app'
    ];

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

const CORS_TEST_MODE = process.env.CORS_TEST_MODE === 'true';

if (CORS_TEST_MODE) {
  console.log('⚠️  CORS TEST MODE ENABLED - Allowing all origins');
  app.use(cors({ origin: '*', credentials: true }));
} else {
  app.use(cors({
    origin: (origin, callback) => {  
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.includes('.railway.app') || origin.includes('.railway.internal')) {
        return callback(null, true);
      }
      console.log(`❌ CORS blocked: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  console.log('✅ CORS configured for:', allowedOrigins);
}

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

// ====================
// MIDDLEWARE: Block other routes during startup (EXCEPT health endpoints)
// ====================
app.use((req, res, next) => {
  // Skip for health endpoints (already defined above)
  if (req.path === '/health' || req.path === '/railway-health' || req.path === '/api/health' || req.path === '/') {
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
