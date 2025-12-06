const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes/nba.js');
let content = fs.readFileSync(filePath, 'utf8');

// Check if betting/odds route exists
if (!content.includes("router.get('/betting/odds'")) {
  console.log('❌ Betting/odds route not found. Adding it...');
  
  // Find where to insert (after other betting routes if they exist)
  const insertPoint = content.indexOf('module.exports = router;');
  
  if (insertPoint !== -1) {
    const newRoute = `
// Betting odds endpoint
router.get('/betting/odds', cacheMiddleware(300), function(req, res) {
  try {
    console.log('[NBA] Returning betting odds data');
    
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
  } catch (error) {
    console.error('Betting odds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting odds'
    });
  }
});`;
    
    content = content.slice(0, insertPoint) + newRoute + '\n\n' + content.slice(insertPoint);
    fs.writeFileSync(filePath, content);
    console.log('✅ Added betting/odds route');
  }
} else {
  console.log('✅ Betting/odds route exists');
  
  // Check if it's working
  const lines = content.split('\n');
  const bettingLine = lines.findIndex(line => line.includes("router.get('/betting/odds'"));
  console.log(`Route found at line: ${bettingLine + 1}`);
}
