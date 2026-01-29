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
  origin: ['http://localhost:19006', 'http://localhost:3000'],
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================
// GLOBAL HEALTH ENDPOINTS
// ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'NBA Fantasy AI',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend',
    endpoints: ['/health', '/api/health', '/api/auth', '/api/nba', '/api/fantasy']
  });
});

// ====================
// DEBUG ROUTE - Test if server is responding
// ====================
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Direct route works!',
    timestamp: new Date().toISOString()
  });
});

// ====================
// START SERVER FUNCTION
// ====================
async function startServer() {
  console.log('🚀 Starting server...');
  console.log('Port:', PORT);
  console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
  
  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.log('⚠ MongoDB connection failed:', error.message);
    }
  }
  
  // ====================
  // LOAD ROUTES
  // ====================
  console.log('\n🔗 Loading routes...');
  
  const routes = [
    { path: '/api/auth', file: 'authRoutes.js', name: 'Auth Routes' },
    { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA Routes' },
    { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
  ];
  
  let loadedCount = 0;
  
  for (const route of routes) {
    try {
      console.log(`Loading ${route.name}...`);
      const module = await import(`./routes/${route.file}`);
      
      if (module.default) {
        app.use(route.path, module.default);
        console.log(`✅ ${route.name} mounted at ${route.path}`);
        loadedCount++;
        
        // Debug: Log what routes are available for auth
        if (route.name === 'Auth Routes') {
          console.log('   Available auth endpoints:');
          console.log('   - GET  /api/auth/');
          console.log('   - GET  /api/auth/register');
          console.log('   - POST /api/auth/register');
          console.log('   - GET  /api/auth/health');
        }
      } else {
        console.log(`❌ ${route.name} has no default export`);
      }
    } catch (error) {
      console.log(`❌ Failed to load ${route.name}:`, error.message);
      console.log('   Error details:', error.stack.split('\n')[0]);
    }
  }
  
  console.log(`\n📊 ${loadedCount} routes loaded successfully`);
  
  // ====================
  // 404 HANDLER - MUST BE AFTER ALL ROUTES!
  // ====================
  app.use('*', (req, res) => {
    console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.originalUrl,
      availableEndpoints: [
        '/health',
        '/api/health',
        '/api/test',
        '/api/auth',
        '/api/nba',
        '/api/fantasy'
      ]
    });
  });
  
  // ====================
  // START SERVER
  // ====================
  app.listen(PORT, HOST, () => {
    console.log(`\n🎉 SERVER RUNNING ON http://${HOST}:${PORT}`);
    console.log('========================================');
    console.log('✅ Direct test: /api/test');
    console.log('✅ Health: /health');
    console.log('✅ Auth: /api/auth');
    console.log('✅ NBA: /api/nba');
    console.log('✅ Fantasy: /api/fantasy');
    console.log('\n🔍 TEST COMMANDS:');
    console.log('   curl http://localhost:3002/api/test');
    console.log('   curl http://localhost:3002/api/auth');
    console.log('   curl http://localhost:3002/api/auth/register');
    console.log('   curl http://localhost:3002/api/auth/health');
    console.log('========================================');
  });
}

// Start the server
startServer();

export { app };
