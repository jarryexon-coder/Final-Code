// server-production.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Add at the top of server-production.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple .env file locations
const envPaths = [
  join(__dirname, '.env'),
  join(process.cwd(), '.env'),
  join(__dirname, '..', '.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ No .env file found, using process environment variables');
}

// Set default NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('⚠️ NODE_ENV not set, defaulting to "development"');
}

// Log environment info
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT || 3002);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'nba-fantasy-ai-backend',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1,
    uptime: process.uptime()
  });
});

// Import and use routes
async function loadRoutes() {
  const routes = [
    { path: '/api/auth', file: './routes/authRoutes.js', name: 'Authentication' },
    { path: '/api/nba', file: './routes/nbaRoutes.js', name: 'NBA Data' },
    { path: '/api/fantasy', file: './routes/fantasyRoutes.js', name: 'Fantasy' },
    // Add other routes as needed
  ];
  
  for (const route of routes) {
    try {
      const module = await import(route.file);
      app.use(route.path, module.default);
      console.log(`✅ ${route.name} routes loaded`);
    } catch (error) {
      console.error(`❌ Failed to load ${route.name}:`, error.message);
    }
  }
}

// MongoDB connection with retry
async function connectMongoDB() {
  const maxRetries = 5;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        console.error('❌ All MongoDB connection attempts failed');
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Start server
async function startServer() {
  console.log('🚀 Starting NBA Fantasy AI Backend...');
  
  // Connect to MongoDB
  const mongoConnected = await connectMongoDB();
  
  if (!mongoConnected) {
    console.warn('⚠️ Starting server without MongoDB connection');
  }
  
  // Load routes
  await loadRoutes();
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
  });
}

// Graceful shutdown
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
