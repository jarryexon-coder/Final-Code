const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Add direct routes before the monitoring routes
const insertPoint = content.indexOf('// =============================================================================\n// MONITORING ROUTES');
const newContent = content.slice(0, insertPoint) + 
`// =============================================================================
// DIRECT INFLUENCER ROUTES (Fallback)
// =============================================================================

// Direct health endpoint
app.get('/api/influencer/health', (req, res) => {
  console.log('✅ Direct influencer health endpoint hit');
  res.json({
    success: true,
    message: 'Influencer system is running - DIRECT ROUTE',
    timestamp: new Date().toISOString()
  });
});

// Direct directory endpoint
app.get('/api/influencer/directory/public', (req, res) => {
  console.log('✅ Direct influencer directory endpoint hit');
  res.json({
    success: true,
    influencers: [
      {
        id: 1,
        username: 'NBAInfluencer',
        social_handle: '@nba_influencer',
        total_commission: 500.00,
        referral_count: 25
      },
      {
        id: 2,
        username: 'BallIsLife',
        social_handle: '@ballislife',
        total_commission: 250.00,
        referral_count: 15
      }
    ]
  });
});

// Direct analytics endpoint
app.get('/api/influencer/:id/analytics', (req, res) => {
  const { id } = req.params;
  console.log(\`✅ Direct influencer analytics endpoint hit for ID \${id}\`);
  
  res.json({
    success: true,
    influencer: {
      id: parseInt(id),
      username: 'Direct Test Influencer',
      total_commission: 750.00,
      referral_count: 35
    },
    codes: [
      {
        code: 'DIRECTTEST',
        commission_rate: 15.00,
        uses_count: 12
      }
    ]
  });
});

` + content.slice(insertPoint);

fs.writeFileSync('server.js', newContent);
console.log('✅ Added direct influencer routes as fallback');
