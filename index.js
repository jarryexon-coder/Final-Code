// index.js - ES Module version
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sports API Scheduler Integration
// Note: You'll need to convert sports-scheduler.js to ES modules too
import { sportsScheduler, createSportsRoutes } from './services/sports-scheduler.js';
app.use('/api/sports', createSportsRoutes(sportsScheduler));
console.log('🏀 Sports API Scheduler (ES Modules) integrated');

// Rate limiting middleware
// Note: You'll need to convert rateLimitMiddleware.js to ES modules too
import { apiLimiter, authLimiter, strictLimiter } from './middleware/rateLimitMiddleware.js';
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Modern MongoDB connection (remove deprecated options)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((error) => {
    console.log('❌ MongoDB connection error:', error.message);
    console.log('💡 Make sure MongoDB is installed and running');
    process.exit(1);
  });

// Import routes
import authRoutes from './routes/auth.js';
import nbaRoutes from './routes/nba.js';
import stubRoutes from './routes/stubRoutes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/nba', nbaRoutes);
app.use('/api/stub', stubRoutes); // Add stubRoutes if you need them

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NBA Fantasy AI Server is running!',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏀 NBA Fantasy AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
