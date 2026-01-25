// server-final.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('=== NBA Fantasy AI Backend ===');
console.log('Starting server from:', __dirname);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'NBA Fantasy AI Backend',
    version: '5.0.0',
    status: 'running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      auth: '/api/auth',
      health: '/health',
      nba: '/api/nba',
      predictions: '/api/predictions'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB with multiple fallbacks
async function connectMongoDB() {
  const connectionOptions = [
    // Option 1: Current SRV connection
    process.env.MONGODB_URI,
    
    // Option 2: Direct connection (non-SRV)
    process.env.MONGODB_URI?.replace('mongodb+srv://', 'mongodb://'),
    
    // Option 3: Local MongoDB for testing
    'mongodb://localhost:27017/sports-app',
  ].filter(Boolean);

  console.log('Attempting MongoDB connection...');

  for (let i = 0; i < connectionOptions.length; i++) {
    const uri = connectionOptions[i];
    try {
      console.log(`Trying connection ${i + 1}/${connectionOptions.length}: ${uri.substring(0, 50)}...`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      
      console.log(`✅ MongoDB connected with option ${i + 1}`);
      console.log(`Database: ${mongoose.connection.name}`);
      
      return true;
    } catch (error) {
      console.log(`❌ Option ${i + 1} failed: ${error.message}`);
      
      // If last option, return false
      if (i === connectionOptions.length - 1) {
        console.log('⚠️ All MongoDB connection attempts failed');
        return false;
      }
      
      // Close any existing connection before trying next
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      
      // Wait a bit before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

// Load auth routes with MongoDB fallback
async function loadAuthRoutes() {
  try {
    const authRoutesModule = await import('./routes/authRoutes.js');
    
    // Create a wrapper that handles MongoDB errors
    const originalRouter = authRoutesModule.default;
    
    // Wrap the registration endpoint to handle MongoDB errors
    const router = express.Router();
    
    // Copy all routes
    router.stack = originalRouter.stack;
    
    // Override the registration endpoint to handle MongoDB errors
    const registrationRoute = router.stack.find(layer => 
      layer.route && layer.route.path === '/register' && layer.route.methods.post
    );
    
    if (registrationRoute) {
      const originalHandler = registrationRoute.route.stack[0].handle;
      
      registrationRoute.route.stack[0].handle = async (req, res, next) => {
        try {
          await originalHandler(req, res, next);
        } catch (error) {
          console.error('Registration error:', error);
          
          // If MongoDB error, provide helpful message
          if (error.name === 'MongoServerError' || error.message.includes('Mongo')) {
            return res.status(503).json({
              success: false,
              error: 'Database temporarily unavailable. Please try again later.',
              retry: true
            });
          }
          
          // For other errors
          res.status(500).json({
            success: false,
            error: 'Registration failed. Please check your details and try again.'
          });
        }
      };
    }
    
    app.use('/api/auth', router);
    console.log('✅ Auth routes loaded with MongoDB error handling');
    
  } catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
    
    // Create basic auth routes as fallback
    const router = express.Router();
    
    router.post('/register', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Authentication system temporarily unavailable. MongoDB connection failed.',
        mongo: false,
        retry: true
      });
    });
    
    router.post('/login', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Authentication system temporarily unavailable. MongoDB connection failed.',
        mongo: false,
        retry: true
      });
    });
    
    app.use('/api/auth', router);
    console.log('✅ Created fallback auth routes');
  }
}

// Load other routes
async function loadRoutes() {
  const routes = [
    { path: '/api/nba', file: './routes/nbaRoutes.js', name: 'NBA Data' },
    { path: '/api/predictions', file: './routes/predictionsRoutes.js', name: 'Predictions' },
    { path: '/api/fantasy', file: './routes/fantasyRoutes.js', name: 'Fantasy' },
  ];
  
  for (const route of routes) {
    try {
      const module = await import(route.file);
      app.use(route.path, module.default);
      console.log(`✅ ${route.name} routes loaded`);
    } catch (error) {
      console.log(`⚠️ ${route.name} routes not available: ${error.message}`);
    }
  }
}

// Start server
async function startServer() {
  console.log('\n🚀 Starting server...');
  
  // Try to connect to MongoDB
  const mongoConnected = await connectMongoDB();
  
  if (!mongoConnected) {
    console.log('⚠️ Running without MongoDB connection');
    console.log('⚠️ Authentication will not work until MongoDB is connected');
  }
  
  // Load auth routes (with fallback)
  await loadAuthRoutes();
  
  // Load other routes
  await loadRoutes();
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log('\n🎉 Server is running!');
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`📦 MongoDB: ${mongoConnected ? 'Connected' : 'Not Connected'}`);
  });
  
  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  
  console.log('👋 Server stopped');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
