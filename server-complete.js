// server-complete.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('=== NBA Fantasy AI Backend ===');
console.log('Starting server from:', __dirname);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({
    name: 'NBA Fantasy AI Backend',
    version: '5.0.0',
    status: 'running',
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

// Dynamically load routes
async function loadRoutes() {
  console.log('\n📦 Loading routes...');
  
  const routes = [
    { path: '/api/auth', file: './routes/authRoutes.js', name: 'Authentication' },
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

// Connect to MongoDB with retry logic
async function connectMongoDB() {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🔗 MongoDB connection attempt ${attempt}/${maxRetries}...`);
      
      // Remove problematic options
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB connected successfully!');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}`);
      
      // Setup event listeners
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.log('⚠️ Maximum retries reached. Starting without MongoDB...');
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Start server
async function startServer() {
  console.log('\n🚀 Starting server...');
  
  // Load routes
  await loadRoutes();
  
  // Try to connect to MongoDB (non-blocking)
  connectMongoDB().catch(console.error);
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log('\n🎉 Server is running!');
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`\n📋 Endpoints available:`);
    console.log(`   GET  /           - Server info`);
    console.log(`   GET  /health     - Health check`);
    console.log(`   POST /api/auth/register - Register user`);
    console.log(`   POST /api/auth/login    - Login user`);
    console.log(`   GET  /api/auth/me       - Get current user (requires auth)`);
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });
}

// Handle graceful shutdown
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
