#!/bin/bash
# quick-backend-array-fix.sh

echo "🚀 Quick backend fix - convert objects to arrays"

cat > /tmp/backend-fix.js << 'EOF'
// Quick middleware to convert object responses to arrays
// Add this to your server.js or main app file

app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Only modify successful responses
    if (data && data.success === true) {
      // Convert NFL standings from object to array
      if (req.path.includes('/nfl/standings') && data.standings && typeof data.standings === 'object' && !Array.isArray(data.standings)) {
        const allTeams = [];
        
        // Extract from AFC divisions
        if (data.standings.afc && Array.isArray(data.standings.afc)) {
          data.standings.afc.forEach(division => {
            if (division.teams && Array.isArray(division.teams)) {
              allTeams.push(...division.teams.map(team => ({
                ...team,
                conference: 'AFC',
                division: division.division
              })));
            }
          });
        }
        
        // Extract from NFC divisions
        if (data.standings.nfc && Array.isArray(data.standings.nfc)) {
          data.standings.nfc.forEach(division => {
            if (division.teams && Array.isArray(division.teams)) {
              allTeams.push(...division.teams.map(team => ({
                ...team,
                conference: 'NFC',
                division: division.division
              })));
            }
          });
        }
        
        data.standings = allTeams;
        console.log(`✅ Converted NFL standings to array with ${allTeams.length} teams`);
      }
      
      // Convert NHL standings from object to array
      if (req.path.includes('/nhl/standings') && data.standings && typeof data.standings === 'object' && !Array.isArray(data.standings)) {
        const allTeams = [];
        
        // Extract from Eastern divisions
        if (data.standings.eastern && Array.isArray(data.standings.eastern)) {
          data.standings.eastern.forEach(division => {
            if (division.teams && Array.isArray(division.teams)) {
              allTeams.push(...division.teams.map(team => ({
                ...team,
                conference: 'Eastern',
                division: division.division
              })));
            }
          });
        }
        
        // Extract from Western divisions
        if (data.standings.western && Array.isArray(data.standings.western)) {
          data.standings.western.forEach(division => {
            if (division.teams && Array.isArray(division.teams)) {
              allTeams.push(...division.teams.map(team => ({
                ...team,
                conference: 'Western',
                division: division.division
              })));
            }
          });
        }
        
        data.standings = allTeams;
        console.log(`✅ Converted NHL standings to array with ${allTeams.length} teams`);
      }
      
      // Convert PrizePicks analytics from object to array
      if (req.path.includes('/prizepicks/analytics') && data.analytics && typeof data.analytics === 'object' && !Array.isArray(data.analytics)) {
        const allItems = [];
        
        // Extract bySport data
        if (data.analytics.bySport && Array.isArray(data.analytics.bySport)) {
          allItems.push(...data.analytics.bySport.map(item => ({
            type: 'sport_performance',
            ...item
          })));
        }
        
        // Extract top performers
        if (data.analytics.topPerformers && Array.isArray(data.analytics.topPerformers)) {
          allItems.push(...data.analytics.topPerformers.map(item => ({
            type: 'top_performer',
            ...item
          })));
        }
        
        // Extract by pick type
        if (data.analytics.byPickType && Array.isArray(data.analytics.byPickType)) {
          allItems.push(...data.analytics.byPickType.map(item => ({
            type: 'pick_type',
            ...item
          })));
        }
        
        data.analytics = allItems;
        console.log(`✅ Converted PrizePicks analytics to array with ${allItems.length} items`);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});

console.log('🔧 Added response converter middleware');
EOF

echo "📁 Backend fix code created at /tmp/backend-fix.js"
echo ""
echo "📝 Add this middleware to your server.js file:"
echo "1. Open server.js"
echo "2. Add the code after your route definitions but before app.listen()"
echo "3. Deploy backend"
echo ""
echo "🎯 This will automatically convert object responses to arrays!"
