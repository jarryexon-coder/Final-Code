import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// MIDDLEWARE
// ====================
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for debugging
    callback(null, true);
  },
  credentials: true
}));

app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false 
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================
// BASIC HEALTH ENDPOINTS
// ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'TEST SERVER',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ 
    status: 'healthy',
    mongodb: mongoState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI TEST SERVER',
    status: 'Minimal test version',
    endpoints: [
      '/health',
      '/api/health',
      '/api/debug',
      '/api/auth',
      '/api/nba'
    ]
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString()
  });
});

// ====================
// START SERVER FUNCTION
// ====================
async function startServer() {
  console.log('🔍 TEST SERVER - Minimal Configuration');
  console.log('PORT:', PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('========================================');

  try {
    // 1. Connect to MongoDB ONLY
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');

    // 2. Load ONLY 3 CRITICAL routes
    console.log('\n🔗 Loading MINIMAL routes (3 routes only)...');
    
    const routesToLoad = [
      // ONLY these 3 routes - comment out everything else
      { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
      { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA Routes' },
      // Optional third route if you want
      // { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routesToLoad) {
      try {
        console.log(`\n🔧 Attempting to load: ${route.name}`);
        console.log(`   File: ./routes/${route.file}`);
        
        const module = await import(`./routes/${route.file}`);
        
        if (module.default && typeof module.default === 'function') {
          app.use(route.path, module.default);
          console.log(`✅ ${route.name} SUCCESSFULLY loaded at ${route.path}`);
          loadedCount++;
          
          // Test the route immediately
          console.log(`   Testing: GET ${route.path}`);
        } else {
          console.log(`❌ ${route.name} has no default export`);
          failedCount++;
        }
      } catch (error) {
        console.log(`\n❌❌❌ CRITICAL ERROR loading ${route.name}:`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
        failedCount++;
        
        // Don't crash - continue trying other routes
      }
    }

    console.log(`\n📊 Route loading summary:`);
    console.log(`   ✅ Successful: ${loadedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);

    // ====================
    // CATCH-ALL ERROR HANDLER
    // ====================
    app.use((err, req, res, next) => {
      console.error('\n🚨 UNCAUGHT ERROR:', err.message);
      console.error('Stack:', err.stack);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });

    // ====================
    // 404 HANDLER
    // ====================
    app.use('*', (req, res) => {
      console.log(`📭 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
          '/health',
          '/api/health',
          '/api/debug',
          '/api/auth',
          '/api/nba'
        ]
      });
    });

    // ====================
    // FINAL SERVER START
    // ====================
    console.log('\n⏳ Waiting 2 seconds to ensure everything is initialized...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🎉🎉🎉 TEST SERVER RUNNING ON http://${HOST}:${PORT}`);
      console.log('================================================');
      console.log('✅ Server is listening for requests');
      console.log('✅ MongoDB connected');
      console.log('✅ Minimal routes loaded');
      console.log('\n🔍 TEST THESE ENDPOINTS IMMEDIATELY:');
      console.log(`   curl http://${HOST}:${PORT}/health`);
      console.log(`   curl http://${HOST}:${PORT}/api/health`);
      console.log(`   curl http://${HOST}:${PORT}/api/debug`);
      console.log(`   curl http://${HOST}:${PORT}/api/auth`);
      console.log(`   curl http://${HOST}:${PORT}/api/nba`);
      console.log('\n💡 If these work, the problem is in OTHER routes');
      console.log('================================================');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Test server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('\n❌❌❌ FAILED TO START TEST SERVER:');
    console.error('Error:', error.message);
    console.error('Full error:', error.stack);
    process.exit(1);
  }
}

// ====================
// START THE TEST SERVER
// ====================
startServer();

export { app };
