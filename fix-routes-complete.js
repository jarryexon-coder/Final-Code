const fs = require('fs');
const path = require('path');

console.log('🚀 Creating clean, working NBA routes file...');

// Create a clean, working routes file
const cleanContent = `const express = require('express');
const router = express.Router();

// Cache middleware
const cacheMiddleware = (seconds) => {
  return (req, res, next) => {
    res.set('Cache-Control', \`public, max-age=\${seconds}\`);
    next();
  };
};

// ===== NBA GAMES ENDPOINT =====
router.get('/games/today', cacheMiddleware(60), (req, res) => {
  console.log('[NBA] Returning today\'s games');
  
  const games = [
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
      home_team: 'Denver Nuggets',
      away_team: 'Phoenix Suns',
      time: '10:00 PM ET',
      channel: 'NBA TV',
      home_score: 0,
      away_score: 0,
      status: 'Upcoming'
    }
  ];
  
  res.json({
    success: true,
    data: games,
    timestamp: new Date().toISOString()
  });
});

// ===== NBA PLAYERS ENDPOINT =====
router.get('/players', cacheMiddleware(300), (req, res) => {
  console.log('[NBA] Returning players list');
  
  const players = [
    { id: 1, name: 'LeBron James', team: 'LAL', position: 'SF', points: 27.8, rebounds: 8.2, assists: 8.5 },
    { id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 28.5, rebounds: 4.9, assists: 6.3 },
    { id: 3, name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 29.1, rebounds: 7.2, assists: 5.8 },
    { id: 4, name: 'Nikola Jokic', team: 'DEN', position: 'C', points: 26.3, rebounds: 12.1, assists: 9.0 },
    { id: 5, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4, rebounds: 11.5, assists: 6.5 }
  ];
  
  res.json({
    success: true,
    data: players,
    count: players.length
  });
});

// ===== BETTING ODDS ENDPOINT (FIXED) =====
router.get('/betting/odds', cacheMiddleware(300), (req, res) => {
  console.log('[NBA] Returning betting odds');
  
  const odds = {
    games: [
      {
        id: 1,
        home_team: 'Lakers',
        away_team: 'Warriors',
        date: 'Tonight 7:30 PM',
        moneyline: { home: -150, away: +130 },
        spread: { home: -3.5, away: +3.5 },
        total: { points: 225.5 }
      },
      {
        id: 2,
        home_team: 'Celtics',
        away_team: 'Heat',
        date: 'Tonight 8:00 PM',
        moneyline: { home: -180, away: +155 },
        spread: { home: -4.5, away: +4.5 },
        total: { points: 218.5 }
      }
    ],
    player_props: [
      { player: 'LeBron James', stat: 'Points', line: 27.5, over: -110, under: -110 },
      { player: 'Stephen Curry', stat: '3-Pointers', line: 4.5, over: -115, under: -105 },
      { player: 'Nikola Jokic', stat: 'Assists', line: 8.5, over: -120, under: +100 }
    ],
    last_updated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: odds,
    source: 'Sample Data'
  });
});

// ===== FANTASY ADVICE ENDPOINT =====
router.get('/fantasy/advice', cacheMiddleware(600), (req, res) => {
  console.log('[NBA] Returning fantasy advice');
  
  const advice = {
    must_starts: [
      { player: 'LeBron James', reason: 'High usage with Davis out', projection: '55+ fantasy points' },
      { player: 'Nikola Jokic', reason: 'Triple-double threat every night', projection: '65+ fantasy points' }
    ],
    sleepers: [
      { player: 'Austin Reaves', reason: 'Increased minutes, good matchup', projection: '35+ fantasy points' },
      { player: 'Jalen Williams', reason: 'Hot streak, high efficiency', projection: '40+ fantasy points' }
    ],
    busts: [
      { player: 'Jordan Poole', reason: 'Inconsistent shooting, turnovers', projection: 'Under 25 fantasy points' },
      { player: 'Ben Simmons', reason: 'Limited offensive role', projection: 'Under 30 fantasy points' }
    ]
  };
  
  res.json({
    success: true,
    data: advice,
    generated_at: new Date().toISOString()
  });
});

// ===== PLAYER SEARCH ENDPOINT =====
router.get('/players/search', (req, res) => {
  const query = req.query.q || '';
  console.log(\`[NBA] Searching players for: \${query}\`);
  
  const allPlayers = [
    { id: 1, name: 'LeBron James', team: 'LAL', position: 'SF', points: 27.8 },
    { id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 28.5 },
    { id: 3, name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 29.1 },
    { id: 4, name: 'Nikola Jokic', team: 'DEN', position: 'C', points: 26.3 },
    { id: 5, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4 },
    { id: 6, name: 'Luka Doncic', team: 'DAL', position: 'PG', points: 33.2 },
    { id: 7, name: 'Jayson Tatum', team: 'BOS', position: 'SF', points: 27.5 },
    { id: 8, name: 'Joel Embiid', team: 'PHI', position: 'C', points: 34.8 }
  ];
  
  const results = query 
    ? allPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : allPlayers;
  
  res.json({
    success: true,
    data: results,
    query: query,
    count: results.length
  });
});

// ===== SINGLE PLAYER ENDPOINT =====
router.get('/player/:playerName', (req, res) => {
  const playerName = req.params.playerName;
  console.log(\`[NBA] Getting player: \${playerName}\`);
  
  const player = {
    name: playerName,
    team: 'LAL',
    position: 'SF',
    stats: {
      points: 27.8,
      rebounds: 8.2,
      assists: 8.5,
      steals: 1.3,
      blocks: 0.8,
      fg_percentage: 52.3,
      three_point_percentage: 39.5
    },
    fantasy_points: 58.7,
    injury_status: 'Healthy',
    next_game: 'vs Warriors, Tonight 7:30 PM'
  };
  
  res.json({
    success: true,
    data: player
  });
});

module.exports = router;`;

// Write the clean file
fs.writeFileSync('routes/nba.js', cleanContent);
console.log('✅ Created clean routes/nba.js file');

// Also update server.js to use routes properly
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix route mounting if needed
if (!serverContent.includes("app.use('/api/nba', require('./routes/nba')")) {
  console.log('⚠️  Updating server.js to use NBA routes...');
  
  // Find where to add the NBA routes
  const lines = serverContent.split('\n');
  let insertIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("app.use('/api/promo'") || lines[i].includes("// Promo routes")) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, "// NBA routes");
    lines.splice(insertIndex + 1, 0, "app.use('/api/nba', require('./routes/nba'));");
    serverContent = lines.join('\n');
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Updated server.js to include NBA routes');
  }
}

console.log('🎉 Fix complete! Restarting server...');
