// server-clean.js - Simple working server
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env file');
} else {
  dotenv.config();
  console.log('⚠️ Using system environment variables');
}

// Set default NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

console.log('=== Starting Clean Server ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 3002);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({
    name: 'NBA Fantasy AI Backend',
    version: '5.0.0',
    status: 'running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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

// Dynamically load auth routes
async function loadAuthRoutes() {
  try {
    console.log('Loading auth routes...');
    const authModule = await import('./routes/authRoutes.js');
    app.use('/api/auth', authModule.default);
    console.log('✅ Auth routes loaded');
  } catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
  }
}

// Connect to MongoDB
async function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return false;
  }

  try {
    console.log('Connecting to MongoDB...');
    console.log('URI (first 50 chars):', process.env.MONGODB_URI.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Try without SRV if that fails
    if (error.message.includes('querySrv')) {
      console.log('Trying direct connection (without SRV)...');
      try {
        const directUri = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
        await mongoose.connect(directUri, {
          serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected via direct method');
        return true;
      } catch (directError) {
        console.error('❌ Direct connection failed:', directError.message);
      }
    }
    
    return false;
  }
}

// Start server
async function startServer() {
  console.log('\n🚀 Initializing server...');
  
  // Connect to MongoDB
  const mongoConnected = await connectMongoDB();
  
  if (!mongoConnected) {
    console.log('⚠️ Starting server without MongoDB connection');
    console.log('⚠️ Authentication will not work');
  }
  
  // Load routes
  await loadAuthRoutes();
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log(`\n🎉 Server is running!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /           - Server info`);
    console.log(`   GET  /health     - Health check`);
    console.log(`   POST /api/auth/register - Register user`);
    console.log(`   POST /api/auth/login    - Login user`);
    console.log(`   GET  /api/auth/me       - Get current user (requires auth)`);
  });
  
  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
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
