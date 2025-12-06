// Mock endpoints for NBA Fantasy Backend
// Add this to your server.js or routes

const mockData = {
  gamesToday: {
    success: true,
    data: [
      { 
        id: 1, 
        home_team: 'Los Angeles Lakers', 
        away_team: 'Golden State Warriors', 
        time: '7:30 PM ET', 
        status: 'Upcoming',
        home_score: 0,
        away_score: 0,
        venue: 'Crypto.com Arena'
      },
      { 
        id: 2, 
        home_team: 'Boston Celtics', 
        away_team: 'Miami Heat', 
        time: '8:00 PM ET', 
        status: 'Upcoming',
        home_score: 0,
        away_score: 0,
        venue: 'TD Garden'
      }
    ]
  },
  
  players: {
    success: true,
    data: [
      { 
        id: 1, 
        name: 'LeBron James', 
        team: 'LAL', 
        position: 'SF',
        points: 25.5, 
        rebounds: 7.5, 
        assists: 8.5
      },
      { 
        id: 2, 
        name: 'Stephen Curry', 
        team: 'GSW', 
        position: 'PG',
        points: 28.3, 
        rebounds: 4.5, 
        assists: 6.5
      }
    ]
  },
  
  fantasyAdvice: [
    { 
      player: 'LeBron James', 
      recommendation: 'START', 
      confidence: 88 
    },
    { 
      player: 'Stephen Curry', 
      recommendation: 'START', 
      confidence: 92 
    }
  ],
  
  bettingOdds: {
    success: true,
    data: [
      {
        game: 'Lakers vs Warriors',
        moneyline: { home: -150, away: +130 },
        spread: { home: -3.5, away: +3.5 },
        total: 235.5
      }
    ]
  }
};

// Use these routes in your Express app
const mockRoutes = (app) => {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Backend is running', timestamp: new Date().toISOString() });
  });
  
  // NBA Games
  app.get('/api/nba/games/today', (req, res) => {
    res.json(mockData.gamesToday);
  });
  
  // NBA Players
  app.get('/api/nba/players', (req, res) => {
    res.json(mockData.players);
  });
  
  // Fantasy Advice
  app.get('/api/nba/fantasy/advice', (req, res) => {
    res.json(mockData.fantasyAdvice);
  });
  
  // Betting Odds
  app.get('/api/nba/betting/odds', (req, res) => {
    res.json(mockData.bettingOdds);
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
  
  console.log('✅ Mock endpoints registered');
};

module.exports = mockRoutes;
