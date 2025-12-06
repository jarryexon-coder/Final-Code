const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Simple backend is running',
    timestamp: new Date().toISOString(),
    server: 'simple-server.js',
    clientIp: req.ip
  });
});

// NBA endpoints
app.get('/api/nba/games/today', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        home_team: 'Lakers',
        away_team: 'Warriors',
        time: '7:30 PM ET',
        status: 'Upcoming'
      }
    ]
  });
});

app.get('/api/nba/players', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'LeBron James',
        team: 'LAL',
        points: 25.5
      }
    ]
  });
});

app.get('/api/nba/fantasy/advice', (req, res) => {
  res.json({
    success: true,
    data: {
      must_starts: [
        { player: 'LeBron James', reason: 'Test reason' }
      ]
    }
  });
});

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

// Promo endpoint
app.get('/api/promo/public', (req, res) => {
  res.json({
    success: true,
    promos: [
      {
        id: 'WELCOME100',
        name: 'Welcome Bonus',
        code: 'WELCOME100'
      }
    ]
  });
});

// Influencer endpoint
app.get('/api/influencer/directory/public', (req, res) => {
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        name: 'NBA Analyst',
        followers: '250K'
      }
    ]
  });
});

app.get('/api/influencer/:id/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      name: 'NBA Analyst',
      followers_growth: '+5%'
    }
  });
});

// Start server on ALL interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 Simple server running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log(`   http://10.0.0.183:${PORT}`);
  console.log(`   And any other interface...`);
  console.log(`\n📡 Test with: curl http://localhost:${PORT}/health`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
