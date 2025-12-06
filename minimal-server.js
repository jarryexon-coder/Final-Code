const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Minimal backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Backend',
    endpoints: [
      '/health',
      '/api/nba/games/today',
      '/api/nba/players',
      '/api/nba/fantasy/advice',
      '/api/nba/betting/odds',
      '/api/promo/public',
      '/api/influencer/directory/public'
    ]
  });
});

// NBA Games
app.get('/api/nba/games/today', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        home_team: 'Los Angeles Lakers',
        away_team: 'Golden State Warriors',
        time: '7:30 PM ET',
        channel: 'TNT',
        home_score: 112,
        away_score: 108,
        status: 'Final'
      },
      {
        id: 2,
        home_team: 'Boston Celtics',
        away_team: 'Miami Heat',
        time: '8:00 PM ET',
        channel: 'ESPN',
        home_score: 105,
        away_score: 102,
        status: 'Q3 4:32'
      }
    ]
  });
});

// NBA Players
app.get('/api/nba/players', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'LeBron James',
        team: 'LAL',
        position: 'SF',
        points: 27.8,
        rebounds: 8.2,
        assists: 8.5
      }
    ]
  });
});

// Fantasy Advice
app.get('/api/nba/fantasy/advice', (req, res) => {
  res.json({
    success: true,
    data: {
      must_starts: [
        { player: 'LeBron James', reason: 'High usage with Davis out', projection: '55+ fantasy points' }
      ]
    }
  });
});

// Betting Odds
app.get('/api/nba/betting/odds', (req, res) => {
  res.json({
    success: true,
    data: {
      games: [
        {
          home_team: 'Lakers',
          away_team: 'Warriors',
          moneyline: { home: -150, away: +130 }
        }
      ]
    }
  });
});

// Promo System
app.get('/api/promo/public', (req, res) => {
  res.json({
    success: true,
    promos: [
      {
        id: 'WELCOME100',
        name: 'Welcome Bonus',
        description: 'Get $100 in free bets when you sign up!',
        code: 'WELCOME100',
        expiration: '2024-12-31'
      }
    ]
  });
});

// Influencer Directory
app.get('/api/influencer/directory/public', (req, res) => {
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        name: 'NBA Analyst',
        followers: '250K',
        specialty: 'Fantasy Picks',
        success_rate: '78%'
      }
    ]
  });
});

// Influencer Analytics
app.get('/api/influencer/:id/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      name: 'NBA Analyst',
      followers_growth: '+5% this week',
      engagement_rate: '4.2%'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requested: req.url,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal backend running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log(`   http://10.0.0.183:${PORT}`);
  console.log('\n📡 Endpoints available:');
  console.log(`   GET  /health`);
  console.log(`   GET  /api/nba/games/today`);
  console.log(`   GET  /api/nba/players`);
  console.log(`   GET  /api/nba/fantasy/advice`);
  console.log(`   GET  /api/nba/betting/odds`);
  console.log(`   GET  /api/promo/public`);
  console.log(`   GET  /api/influencer/directory/public`);
  console.log(`   GET  /api/influencer/:id/analytics`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
