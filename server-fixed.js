const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:8081', 'http://10.0.0.183:8081', 'exp://10.0.0.183:8081', 'http://localhost:19006', 'http://localhost:19000', 'http://localhost:3000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Assistant API',
    endpoints: {
      health: '/health',
      nba: {
        games: '/api/nba/games/today',
        players: '/api/nba/players',
        fantasy: '/api/nba/fantasy/advice',
        betting: '/api/nba/betting/odds'
      },
      promo: '/api/promo/public',
      influencer: '/api/influencer/directory/public'
    }
  });
});

// NBA Games Today
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
      },
      {
        id: 3,
        home_team: 'Phoenix Suns',
        away_team: 'Denver Nuggets',
        time: '9:00 PM ET',
        channel: 'NBA TV',
        status: 'Upcoming'
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
        assists: 8.5,
        fantasy_points: 56.3
      },
      {
        id: 2,
        name: 'Stephen Curry',
        team: 'GSW',
        position: 'PG',
        points: 32.1,
        rebounds: 5.2,
        assists: 6.8,
        fantasy_points: 58.9
      },
      {
        id: 3,
        name: 'Nikola Jokic',
        team: 'DEN',
        position: 'C',
        points: 26.4,
        rebounds: 12.3,
        assists: 9.1,
        fantasy_points: 62.5
      },
      {
        id: 4,
        name: 'Kevin Durant',
        team: 'PHX',
        position: 'SF',
        points: 29.8,
        rebounds: 7.2,
        assists: 5.8,
        fantasy_points: 54.7
      },
      {
        id: 5,
        name: 'Jayson Tatum',
        team: 'BOS',
        position: 'SF',
        points: 28.4,
        rebounds: 8.6,
        assists: 4.6,
        fantasy_points: 52.9
      }
    ]
  });
});

// NBA Fantasy Advice
app.get('/api/nba/fantasy/advice', (req, res) => {
  res.json({
    success: true,
    data: {
      must_starts: [
        { player: 'LeBron James', reason: 'High usage with Davis out', projection: '55+ fantasy points' },
        { player: 'Nikola Jokic', reason: 'Triple-double machine', projection: '60+ fantasy points' }
      ],
      sleepers: [
        { player: 'Austin Reaves', reason: 'Increased minutes', projection: '35+ fantasy points' }
      ],
      busts: [
        { player: 'Jordan Poole', reason: 'Inefficient shooting lately', projection: 'Under 25 fantasy points' }
      ]
    }
  });
});

// NBA Betting Odds
app.get('/api/nba/betting/odds', (req, res) => {
  res.json({
    success: true,
    data: {
      games: [
        {
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          moneyline: { home: -150, away: +130 },
          spread: { home: -3.5, away: +3.5 },
          over_under: 235.5
        },
        {
          id: 2,
          home_team: 'Celtics',
          away_team: 'Heat',
          moneyline: { home: -180, away: +155 },
          spread: { home: -4.5, away: +4.5 },
          over_under: 228.5
        }
      ]
    }
  });
});

// Promo System - Public
app.get('/api/promo/public', (req, res) => {
  res.json({
    success: true,
    promos: [
      {
        id: 'WELCOME100',
        name: 'Welcome Bonus',
        description: 'Get $100 in free bets when you sign up!',
        code: 'WELCOME100',
        expiration: '2024-12-31',
        terms: 'Min. deposit $10, wagering requirements apply'
      },
      {
        id: 'NBA2024',
        name: 'NBA Season Special',
        description: 'Get 50% bonus up to $200 on NBA bets',
        code: 'NBA2024',
        expiration: '2024-06-30',
        terms: 'For NBA markets only'
      }
    ]
  });
});

// Influencer Directory - Public
app.get('/api/influencer/directory/public', (req, res) => {
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        name: 'NBA Analyst',
        username: '@nba_analyst',
        followers: '250K',
        specialty: 'Fantasy Picks',
        success_rate: '78%',
        verified: true
      },
      {
        id: 2,
        name: 'Betting Pro',
        username: '@betting_pro',
        followers: '150K',
        specialty: 'Player Props',
        success_rate: '82%',
        verified: true
      }
    ]
  });
});

// Influencer Analytics
app.get('/api/influencer/:id/analytics', (req, res) => {
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id: id,
      name: id === 1 ? 'NBA Analyst' : 'Betting Pro',
      username: id === 1 ? '@nba_analyst' : '@betting_pro',
      followers_growth: '+5% this week',
      engagement_rate: '4.2%',
      total_referrals: id === 1 ? 1250 : 890,
      commission_earned: id === 1 ? '$12,500' : '$8,900'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requested: req.url,
    method: req.method
  });
});

// Error Handler
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log(`   http://10.0.0.183:${PORT}`);
  console.log('\n📡 Endpoints:');
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

module.exports = app;
