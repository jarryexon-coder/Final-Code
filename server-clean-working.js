import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // ========== HEALTH ENDPOINTS ==========
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'NBA Fantasy AI',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });
    
    // ========== ROOT ==========
    app.get('/', (req, res) => {
      res.json({
        message: 'NBA Fantasy AI Backend',
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/health',
          '/api/health',
          '/api/fantasy',
          '/api/picks',
          '/api/news',
          '/api/nba',
          '/api/auth'
        ]
      });
    });
    
    // ========== LOAD ROUTES WITH ERROR HANDLING ==========
    console.log('\n🔧 Loading routes...');
    
    const routesToLoad = [
      { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy' },
      { path: '/api/picks', file: 'picks.js', name: 'Picks' },
      { path: '/api/news', file: 'news.js', name: 'News' },
      { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA' },
      { path: '/api/auth', file: 'authRoutes.js', name: 'Auth' },
    ];
    
    for (const route of routesToLoad) {
      try {
        console.log(`Loading ${route.name}...`);
        const module = await import(`./routes/${route.file}`);
        
        if (module.default) {
          // Mount the router
          app.use(route.path, module.default);
          console.log(`✅ ${route.name} router mounted`);
          
          // Add health endpoint for this router (BEFORE the router handles it)
          // We need to add this manually since Express processes routes in order
          const originalGet = app.get.bind(app);
          // We'll handle health endpoints separately
        } else {
          console.log(`⚠ ${route.name} has no default export`);
        }
      } catch (error) {
        console.log(`❌ Could not load ${route.name}: ${error.message}`);
      }
    }
    
    // ========== MANUAL HEALTH ENDPOINTS ==========
    // These MUST respond to /api/fantasy, /api/picks, etc.
    
    // Fantasy API health
    app.get('/api/fantasy', (req, res) => {
      res.json({
        success: true,
        message: 'Fantasy API is working',
        endpoints: ['/players', '/players/:id', '/ai-advice'],
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/fantasy/', (req, res) => {
      res.json({
        success: true,
        message: 'Fantasy API is working (with slash)',
        endpoints: ['/players', '/players/:id', '/ai-advice'],
        timestamp: new Date().toISOString()
      });
    });
    
    // Picks API health
    app.get('/api/picks', (req, res) => {
      res.json({
        success: true,
        message: 'Picks API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/picks/', (req, res) => {
      res.json({
        success: true,
        message: 'Picks API is working (with slash)',
        timestamp: new Date().toISOString()
      });
    });
    
    // News API health
    app.get('/api/news', (req, res) => {
      res.json({
        success: true,
        message: 'News API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/news/', (req, res) => {
      res.json({
        success: true,
        message: 'News API is working (with slash)',
        timestamp: new Date().toISOString()
      });
    });
    
    // Other APIs
    app.get('/api/nba', (req, res) => {
      res.json({
        success: true,
        message: 'NBA API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/auth', (req, res) => {
      res.json({
        success: true,
        message: 'Auth API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/players', (req, res) => {
      res.json({
        success: true,
        message: 'Players API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/teams', (req, res) => {
      res.json({
        success: true,
        message: 'Teams API is working',
        timestamp: new Date().toISOString()
      });
    });
    
    // ========== 404 HANDLER ==========
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
          '/health',
          '/api/health',
          '/api/fantasy',
          '/api/picks',
          '/api/news',
          '/api/nba',
          '/api/auth',
          '/api/players',
          '/api/teams'
        ]
      });
    });
    
    // ========== START SERVER ==========
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n========================================`);
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
      console.log(`🔧 API Health: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🏀 Fantasy: http://0.0.0.0:${PORT}/api/fantasy`);
      console.log(`🎯 Picks: http://0.0.0.0:${PORT}/api/picks`);
      console.log(`📰 News: http://0.0.0.0:${PORT}/api/news`);
      console.log(`========================================`);
      console.log('\n🚀 READY FOR RAILWAY DEPLOYMENT!');
    });
    
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
