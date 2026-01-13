// NBA Fantasy Backend - Production Ready
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// Load environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  'https://nba-frontend.up.railway.app',
  'http://localhost:19006'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

console.log('✅ Server initialized');

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.warn('⚠️  MONGODB_URI not set in environment');
      console.warn('⚠️  Some features may not work without database');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️  Continuing without database connection');
  }
};

// Redis Connection
let redisClient;
try {
  if (process.env.REDIS_URL) {
    console.log('🔗 Connecting to Redis...');
    redisClient = new Redis(process.env.REDIS_URL);
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    redisClient.on('error', (err) => {
      console.warn('⚠️  Redis error:', err.message);
    });
  } else {
    console.log('ℹ️  REDIS_URL not set, skipping Redis');
  }
} catch (error) {
  console.warn('⚠️  Redis initialization error:', error.message);
}

// ====================
// ENDPOINTS
// ====================

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Backend',
    version: '5.0.2',
    status: 'online',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      privacy: '/privacy',
      databaseHealth: '/api/database/health'
    }
  });
});

// Health Check
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '5.0.2',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    databases: {
      mongodb: mongoState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.status === 'ready' ? 'connected' : 'not_configured'
    }
  });
});

// API Health (This was failing!)
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend API',
    version: '5.0.2',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    note: 'API endpoints are working'
  });
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Policy - NBA Fantasy Pro</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>Privacy Policy</h1>
      <p><strong>Effective Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
      <p>Your privacy is important to us. This privacy policy explains what personal data we collect and how we use it.</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us.</p>
      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to provide, maintain, and improve our services.</p>
      <h2>Contact Us</h2>
      <p>If you have questions about this privacy policy, please contact us.</p>
    </body>
    </html>
  `);
});

// Database Health
app.get('/api/database/health', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    
    res.json({
      success: mongoState === 1,
      database: {
        mongodb: mongoState === 1 ? 'connected' : 'disconnected',
        state: mongoState
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================
// SERVER STARTUP
// ====================
const startServer = async () => {
  // Connect to databases
  await connectDB();
  
  // Start server
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 NBA Fantasy AI Backend Started Successfully!');
    console.log('='.repeat(50));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Privacy: http://localhost:${PORT}/privacy`);
    console.log(`🗄️ Database Health: http://localhost:${PORT}/api/database/health`);
    console.log('='.repeat(50));
  });
};

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
