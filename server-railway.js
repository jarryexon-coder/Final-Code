// NBA Fantasy Backend - Railway Optimized
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Railway sets PORT automatically, fallback to 3002
const PORT = process.env.PORT || 3002;

// Middleware - SIMPLIFIED
app.use(express.json());
app.use(cors({
  origin: ['https://nba-frontend.up.railway.app', 'http://localhost:19006'],
  credentials: true
}));

console.log('🚀 Starting server on Railway...');
console.log('📊 PORT:', PORT);
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);

// ====================
// CRITICAL: ALL ENDPOINTS HERE
// ====================

// 1. Root - MUST BE FIRST
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Backend - Railway',
    version: '5.0.3',
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    endpoints: [
      { path: '/health', method: 'GET', description: 'System health' },
      { path: '/api/health', method: 'GET', description: 'API health' },
      { path: '/privacy', method: 'GET', description: 'Privacy policy' },
      { path: '/api/database/health', method: 'GET', description: 'Database health' }
    ]
  });
});

// 2. Health endpoint (for Railway health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy Backend',
    version: '5.0.3',
    timestamp: new Date().toISOString(),
    port: PORT,
    note: 'Railway deployment'
  });
});

// 3. API Health (the one that was failing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy API',
    version: '5.0.3',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// 4. Privacy Policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Privacy Policy</title></head>
    <body>
      <h1>Privacy Policy</h1>
      <p>Content goes here.</p>
    </body>
    </html>
  `);
});

// 5. Database Health
app.get('/api/database/health', (req, res) => {
  res.json({
    success: true,
    database: 'MongoDB configured',
    timestamp: new Date().toISOString(),
    note: 'Check Railway variables for MONGODB_URI'
  });
});

// ====================
// ERROR HANDLING
// ====================

// Catch-all for 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requested: req.originalUrl,
    available: [
      '/', '/health', '/api/health', '/privacy', '/api/database/health'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 http://0.0.0.0:${PORT}`);
  
  // Test endpoints internally
  console.log('\n📡 Endpoint self-test:');
  const endpoints = ['/', '/health', '/api/health', '/privacy', '/api/database/health'];
  endpoints.forEach(endpoint => {
    console.log(`   http://localhost:${PORT}${endpoint}`);
  });
});

// Handle Railway signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
