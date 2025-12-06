require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sports API Scheduler Integration
const { sportsScheduler, createSportsRoutes } = require('./services/sports-scheduler');
app.use('/api/sports', createSportsRoutes(sportsScheduler));
console.log('🏀 Sports API Scheduler (CommonJS) integrated');

// Rate limiting middleware
const { apiLimiter, authLimiter, strictLimiter } = require('./middleware/rateLimitMiddleware');
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
const authRoutes = require('./routes/auth');
const nbaRoutes = require('./routes/nba');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/nba', nbaRoutes);

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
