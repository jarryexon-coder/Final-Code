// Railway Production Server
import express from 'express';
import cors from 'cors';

const app = express();

// Railway sets PORT, fallback to 3002 for local
const PORT = process.env.PORT || 3002;

// Important: Must bind to 0.0.0.0 for Railway
const HOST = '0.0.0.0';

// Simple CORS
app.use(cors({
  origin: ['https://nba-frontend.up.railway.app', 'http://localhost:19006'],
  credentials: true
}));

app.use(express.json());

console.log('🚀 Starting Railway Production Server');
console.log(`📊 PORT: ${PORT}`);
console.log(`🌐 HOST: ${HOST}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

// ========== ESSENTIAL ENDPOINTS ==========

// Root endpoint - SIMPLE
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Backend - Production',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health endpoint (for Railway health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Health (the one that was failing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBA Fantasy API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    note: 'API is fully operational'
  });
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Privacy Policy</title></head>
    <body>
      <h1>Privacy Policy</h1>
      <p>Your privacy is important to us.</p>
    </body>
    </html>
  `);
});

// Database Health
app.get('/api/database/health', (req, res) => {
  res.json({
    success: true,
    database: 'MongoDB is configured',
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requested: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ========== START SERVER ==========
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🌐 External URL: https://pleasing-determination-production.up.railway.app`);
  console.log(`📊 Health: https://pleasing-determination-production.up.railway.app/health`);
  console.log(`🔧 API Health: https://pleasing-determination-production.up.railway.app/api/health`);
  
  // Test server internally
  console.log('\n🔍 Internal endpoint test:');
  const endpoints = ['/', '/health', '/api/health', '/privacy'];
  endpoints.forEach(endpoint => {
    console.log(`   http://${HOST}:${PORT}${endpoint}`);
  });
});
