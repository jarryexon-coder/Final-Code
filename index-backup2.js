require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏀 NBA Fantasy AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
