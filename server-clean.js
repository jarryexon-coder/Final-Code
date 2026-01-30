// server-clean.js - NO SCHEDULER, NO COMPLEXITY
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;

// ====================
// CRITICAL: Health endpoints (IMMEDIATE)
// ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'NBA Fantasy Backend',
    uptime: process.uptime()
  });
});

app.get('/railway-health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ====================
// Middleware
// ====================
app.use(cors({
  origin: [
    'https://februaryfantasy-production.up.railway.app',
    'http://localhost:19006',
    process.env.RAILWAY_PUBLIC_DOMAIN
  ].filter(Boolean),
  credentials: true
}));

app.use(helmet());
app.use(compression());
app.use(morgan('tiny')); // Use 'tiny' instead of 'dev' for less logs
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true }));

// ====================
// Simple Routes
// ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'NBA Fantasy AI Backend',
    status: 'OK',
    endpoints: ['/health', '/api/nba', '/api/auth']
  });
});

app.get('/api/nba', (req, res) => {
  res.json({ 
    message: 'NBA API',
    status: 'safe',
    games: []
  });
});

app.get('/api/auth', (req, res) => {
  res.json({ 
    message: 'Auth API',
    status: 'ready'
  });
});

// ====================
// 404 Handler
// ====================
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});

// ====================
// Start Server (SIMPLE)
// ====================
async function startServer() {
  console.log('🔧 Starting NBA Fantasy Backend...');
  console.log('PORT:', PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
  try {
    // Connect to MongoDB with timeout
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connected');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
      console.log(`🏥 Railway Health: http://0.0.0.0:${PORT}/railway-health`);
      console.log('✅ Ready for requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

// Start it
startServer();

export { app };
