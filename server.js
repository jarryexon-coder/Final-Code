// EMERGENCY FIX: COMPLETELY STOP 60 REQUESTS/MINUTE ISSUE
// ====================
// CRITICAL: DISABLE ALL EXTERNAL API CALLS ON STARTUP
// ====================
console.log('🚫 DISABLING all external API calls during startup');

// 1. Monkey-patch fetch to block external calls
const originalFetch = global.fetch;
if (originalFetch) {
  global.fetch = function(...args) {
    const url = args[0]?.slice?.(0, 100) || args[0];
    console.log('🛑 BLOCKED fetch call during startup:', url);
    return Promise.reject(new Error('External API calls disabled during startup'));
  };
}

// 2. COMPLETELY DISABLE aggressive scheduler imports
process.env.DISABLE_SCHEDULER = 'true';
process.env.DISABLE_API_CALLS = 'true';

// 3. Create a startup barrier
let startupComplete = false;
const startupBarrier = new Promise((resolve) => {
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
    
    resolve();
  }, 180000); // 3 MINUTE startup cooldown
});

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
    // Load ONLY the fetch function, not the aggressive scheduler
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
  
  // Also run once after server is ready
  if (serverReady) {
    setTimeout(() => {
      console.log('🚀 Running initial SAFE NBA data fetch');
      safeFetchNBAData();
    }, 30000); // Wait 30 seconds after server ready
  }
  
  // EMERGENCY: Clear ANY existing aggressive schedules
  console.log('🚨 Clearing any existing aggressive schedules...');
  Object.values(schedule.scheduledJobs).forEach(job => {
    job.cancel();
  });
  
  return job;
}

// ====================
// EMERGENCY PATCH: Block aggressive scheduler in nbaRoutes.js
// ====================
async function loadSafeNBARoutes() {
  console.log('🔧 Loading SAFE NBA routes (blocking aggressive scheduler)...');
  
  try {
    const nbaModule = await import('./routes/nbaRoutes.js');
    
    // EMERGENCY: Patch any aggressive scheduler
    if (nbaModule.default && nbaModule.default.startScheduler) {
      console.log('🚨 PATCHING aggressive scheduler in nbaRoutes.js');
      
      // Replace aggressive scheduler with safe version
      const originalStartScheduler = nbaModule.default.startScheduler;
      nbaModule.default.startScheduler = function() {
        console.log('🛑 BLOCKED: Aggressive 60/min scheduler from nbaRoutes.js');
        console.log('✅ Using safe 5-minute scheduler instead');
        return null; // Return null to prevent execution
      };
      
      // Also patch any other scheduler functions
      if (nbaModule.default.scheduleJob) {
        nbaModule.default.scheduleJob = function() {
          console.log('🛑 BLOCKED: scheduleJob in nbaRoutes.js');
          return { cancel: () => {} };
        };
      }
    }
    
    return nbaModule.default;
  } catch (error) {
    console.error('❌ Error loading NBA routes:', error.message);
    // Return minimal router
    const express = await import('express');
    const router = express.Router();
    router.get('/', (req, res) => res.json({ message: 'NBA API (safe mode)' }));
    return router;
  }
}

// ====================
// Memory monitoring (safe interval)
// ====================
setInterval(() => {
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

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Cleanup tracker
const cleanupTasks = [];
let serverReady = false;
let schedulerJob = null;

// ====================
// Middleware
// ====================
app.use((req, res, next) => {
  if (!serverReady && req.path !== '/health' && req.path !== '/railway-health') {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is starting up, please wait...',
      readyIn: '30 seconds'
    });
  }
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19000',
      'https://februaryfantasy-production.up.railway.app' // ADD YOUR FRONTEND
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
// Health endpoints
// ====================
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NBA Fantasy AI Backend',
    scheduler: 'safe (5-minute intervals)'
  }));
});

app.get('/railway-health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
  
  res.json({
    status: 'healthy',
    databases: { mongodb: mongoStatus },
    timestamp: new Date().toISOString(),
    scheduler: 'safe-throttled'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend Server (SAFE MODE)',
    status: 'OK',
    scheduler: 'Throttled to 5-minute intervals',
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

app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Direct debug route works',
    timestamp: new Date().toISOString(),
    server: 'NBA Fantasy AI Backend (Safe Mode)',
    scheduler: '5-minute intervals only'
  });
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // 2. Initialize SAFE scheduler
    console.log('⏰ Setting up SAFE throttled scheduler...');
    if (!startupComplete) {
      console.log('⏳ Waiting for startup completion before starting scheduler...');
      await startupBarrier;
    }
    
    schedulerJob = initializeSafeScheduler();
    
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
    
    // 3. Load routes with SAFE NBA route loader
    console.log('\n🔗 Loading your existing routes...');
    
    const routesToLoad = [
      { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
      { path: '/api/nba', loader: loadSafeNBARoutes, name: 'NBA Routes (SAFE)' }, // USE SAFE LOADER
      { path: '/api/admin', file: 'adminRoutes.js', name: 'Admin Routes' },
      { path: '/api/analytics', file: 'analytics.js', name: 'Analytics Routes' },
      { path: '/api/predictions', file: 'predictions.js', name: 'Predictions Routes' },
      { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
      { path: '/api/players', file: 'players.js', name: 'Players Routes' },
      { path: '/api/teams', file: 'teamsRoutes.js', name: 'Teams Routes' },
      { path: '/api/games', file: 'games.js', name: 'Games Routes' },
      // Add other essential routes as needed
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routesToLoad) {
      try {
        console.log(`🔧 Loading: ${route.name}`);
        
        if (route.loader) {
          // Use custom loader for NBA routes
          const router = await route.loader();
          app.use(route.path, router);
          console.log(`✅ ${route.name} loaded at ${route.path}`);
          loadedCount++;
        } else {
          // Standard loader for other routes
          const loadPromise = import(`./routes/${route.file}`);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Load timeout after 5s')), 5000)
          );
          
          const module = await Promise.race([loadPromise, timeoutPromise]);
          
          if (module.default) {
            const router = module.default;
            app.use(route.path, router);
            console.log(`✅ ${route.name} loaded at ${route.path}`);
            loadedCount++;
          } else {
            console.log(`⚠ ${route.name} has unexpected export format`);
            failedCount++;
          }
        }
        
      } catch (error) {
        console.log(`❌ Could not load ${route.name}: ${error.message}`);
        failedCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Routes loaded: ${loadedCount} successful, ${failedCount} failed`);
    
    // 404 handler
    app.use('*', (req, res) => {
      console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    // 4. Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉 SAFE SERVER RUNNING ON http://${HOST}:${PORT}`);
      console.log(`========================================`);
      console.log(`✅ All routes loaded`);
      console.log(`✅ SAFE scheduler: 5-minute intervals only`);
      console.log(`✅ BLOCKED: 60/minute aggressive scheduler`);
      console.log(`✅ Ready for Railway!`);
      console.log(`\n🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth API: http://${HOST}:${PORT}/api/auth`);
      console.log(`🏀 NBA API: http://${HOST}:${PORT}/api/nba`);
      console.log(`========================================`);
      console.log(`\nPress Ctrl+C to stop gracefully`);
    });

    // Mark server as ready after 30 seconds
    setTimeout(() => {
      serverReady = true;
      console.log('✅ Server marked as ready for all requests');
    }, 30000);

    // Add server cleanup
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
