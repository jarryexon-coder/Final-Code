// fixed-server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Starting Fixed Server ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Directory:', __dirname);

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'NBA Fantasy AI Backend',
    status: 'running',
    version: '5.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    firebase: 'checking',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Import and use auth routes
try {
  const authRoutes = await import('./routes/authRoutes.js');
  app.use('/api/auth', authRoutes.default);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

// Import and use other routes conditionally
const routeConfigs = [
  { path: '/api/nba', file: './routes/nbaRoutes.js', name: 'NBA routes' },
  { path: '/api/predictions', file: './routes/predictionsRoutes.js', name: 'Predictions routes' },
  { path: '/api/fantasy', file: './routes/fantasyRoutes.js', name: 'Fantasy routes' },
];

for (const config of routeConfigs) {
  try {
    const routeModule = await import(config.file);
    app.use(config.path, routeModule.default);
    console.log(`✅ ${config.name} loaded`);
  } catch (error) {
    console.warn(`⚠️ ${config.name} not loaded:`, error.message);
  }
}

// MongoDB Connection
async function connectMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📁 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Initialize Firebase (optional)
async function initializeFirebase() {
  try {
    const firebaseModule = await import('./config/firebase-admin.js');
    console.log('✅ Firebase initialized');
    return firebaseModule.firebaseApp;
  } catch (error) {
    console.warn('⚠️ Firebase not initialized:', error.message);
    return null;
  }
}

// Start server
async function startServer() {
  const mongoConnected = await connectMongoDB();
  
  if (!mongoConnected) {
    console.log('⚠️ Starting server without MongoDB...');
  }
  
  // Initialize Firebase (non-blocking)
  initializeFirebase().catch(console.error);
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log(`\n🎉 Server is running!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`\n⚡ Ready to accept requests!`);
  });
  
  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
