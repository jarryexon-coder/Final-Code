#!/bin/bash
# diagnose-endpoint-issues.sh

echo "🔍 COMPREHENSIVE ENDPOINT DIAGNOSIS"
echo "==================================="
echo ""

# 1. Check what the endpoints actually return
echo "📡 Testing problematic endpoints..."
echo ""

cat > /tmp/test-endpoints.js << 'EOF'
async function testEndpointsDetailed() {
  const endpoints = [
    { path: '/api/nfl/standings', name: 'NFL Standings' },
    { path: '/api/nhl/standings', name: 'NHL Standings' },
    { path: '/api/prizepicks/analytics', name: 'PrizePicks Analytics' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 ${endpoint.name} (${endpoint.path})`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch(`https://pleasing-determination-production.up.railway.app${endpoint.path}`);
      const data = await response.json();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Success: ${data.success}`);
      console.log(`📝 Message: ${data.message}`);
      
      // Check the structure
      if (endpoint.path.includes('standings')) {
        const standings = data.standings;
        console.log(`🏈 Standings type: ${typeof standings}`);
        
        if (typeof standings === 'object' && !Array.isArray(standings)) {
          console.log('⚠️  Standings is OBJECT with keys:', Object.keys(standings));
          
          // Check nested structure
          if (standings.afc) {
            console.log('   AFC:', Array.isArray(standings.afc) ? `Array with ${standings.afc.length} divisions` : typeof standings.afc);
            if (Array.isArray(standings.afc) && standings.afc.length > 0) {
              const afcTeams = standings.afc.reduce((sum, div) => sum + (div.teams?.length || 0), 0);
              console.log(`   Total AFC teams: ${afcTeams}`);
            }
          }
          
          if (standings.nfc) {
            console.log('   NFC:', Array.isArray(standings.nfc) ? `Array with ${standings.nfc.length} divisions` : typeof standings.nfc);
            if (Array.isArray(standings.nfc) && standings.nfc.length > 0) {
              const nfcTeams = standings.nfc.reduce((sum, div) => sum + (div.teams?.length || 0), 0);
              console.log(`   Total NFC teams: ${nfcTeams}`);
            }
          }
          
          if (standings.eastern) {
            console.log('   Eastern:', Array.isArray(standings.eastern) ? `Array with ${standings.eastern.length} divisions` : typeof standings.eastern);
          }
          
          if (standings.western) {
            console.log('   Western:', Array.isArray(standings.western) ? `Array with ${standings.western.length} divisions` : typeof standings.western);
          }
        } else if (Array.isArray(standings)) {
          console.log(`✅ Standings is ARRAY with ${standings.length} items`);
        }
      }
      
      if (endpoint.path.includes('analytics')) {
        const analytics = data.analytics;
        console.log(`📈 Analytics type: ${typeof analytics}`);
        
        if (typeof analytics === 'object' && !Array.isArray(analytics)) {
          console.log('⚠️  Analytics is OBJECT with keys:', Object.keys(analytics));
          
          // Check what arrays exist
          const arrayKeys = Object.keys(analytics).filter(key => Array.isArray(analytics[key]));
          console.log(`   Array properties: ${arrayKeys.length > 0 ? arrayKeys.join(', ') : 'None'}`);
          
          arrayKeys.forEach(key => {
            console.log(`   ${key}: Array with ${analytics[key].length} items`);
          });
        } else if (Array.isArray(analytics)) {
          console.log(`✅ Analytics is ARRAY with ${analytics.length} items`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testEndpointsDetailed();
EOF

echo "Running endpoint analysis..."
echo "Copy the above JavaScript and run in browser console"
echo ""

# 2. Check frontend fetch calls
echo "🔍 Checking frontend fetch calls in problematic screens..."
echo ""

for file in src/pages/NFLAnalyticsScreen.tsx src/pages/PrizePicksScreen.tsx; do
  if [ -f "$file" ]; then
    echo "📄 $file"
    echo "Fetch functions found:"
    grep -n "fetch\|useEffect.*fetch\|axios" "$file" | head -10
    echo ""
    
    echo "Data handling patterns:"
    grep -n "\.then\|\.json()\|response\|data\." "$file" | head -10
    echo "---"
  fi
done

# 3. Create a test component to verify frontend can parse data
echo "🧪 Creating test component to verify parsing..."
echo ""

cat > /tmp/TestDataParser.jsx << 'EOF'
import React, { useEffect, useState } from 'react';

const TestDataParser = () => {
  const [results, setResults] = useState({});

  const testEndpoint = async (url, name) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      let parsedData = [];
      let structure = 'unknown';
      
      if (name.includes('Standings')) {
        const standings = data.standings;
        if (Array.isArray(standings)) {
          structure = 'array';
          parsedData = standings;
        } else if (standings && typeof standings === 'object') {
          structure = 'object';
          // Try to extract teams
          if (standings.afc && Array.isArray(standings.afc)) {
            standings.afc.forEach(division => {
              if (division.teams && Array.isArray(division.teams)) {
                parsedData.push(...division.teams.map(team => ({
                  ...team,
                  conference: 'AFC',
                  division: division.division
                })));
              }
            });
          }
          if (standings.nfc && Array.isArray(standings.nfc)) {
            standings.nfc.forEach(division => {
              if (division.teams && Array.isArray(division.teams)) {
                parsedData.push(...division.teams.map(team => ({
                  ...team,
                  conference: 'NFC',
                  division: division.division
                })));
              }
            });
          }
          if (standings.eastern && Array.isArray(standings.eastern)) {
            standings.eastern.forEach(division => {
              if (division.teams && Array.isArray(division.teams)) {
                parsedData.push(...division.teams.map(team => ({
                  ...team,
                  conference: 'Eastern',
                  division: division.division
                })));
              }
            });
          }
          if (standings.western && Array.isArray(standings.western)) {
            standings.western.forEach(division => {
              if (division.teams && Array.isArray(division.teams)) {
                parsedData.push(...division.teams.map(team => ({
                  ...team,
                  conference: 'Western',
                  division: division.division
                })));
              }
            });
          }
        }
      } else if (name.includes('Analytics')) {
        const analytics = data.analytics;
        if (Array.isArray(analytics)) {
          structure = 'array';
          parsedData = analytics;
        } else if (analytics && typeof analytics === 'object') {
          structure = 'object';
          if (analytics.bySport && Array.isArray(analytics.bySport)) {
            parsedData.push(...analytics.bySport);
          }
          if (analytics.topPerformers && Array.isArray(analytics.topPerformers)) {
            parsedData.push(...analytics.topPerformers);
          }
        }
      }
      
      return {
        success: data.success,
        structure,
        itemCount: parsedData.length,
        sampleItem: parsedData[0] || null,
        rawKeys: Object.keys(data)
      };
      
    } catch (error) {
      return { error: error.message };
    }
  };

  useEffect(() => {
    const runTests = async () => {
      const endpoints = [
        { url: 'https://pleasing-determination-production.up.railway.app/api/nfl/standings', name: 'NFL Standings' },
        { url: 'https://pleasing-determination-production.up.railway.app/api/nhl/standings', name: 'NHL Standings' },
        { url: 'https://pleasing-determination-production.up.railway.app/api/prizepicks/analytics', name: 'PrizePicks Analytics' }
      ];
      
      const testResults = {};
      for (const endpoint of endpoints) {
        testResults[endpoint.name] = await testEndpoint(endpoint.url, endpoint.name);
      }
      
      setResults(testResults);
    };
    
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Endpoint Data Parser Test</h2>
      {Object.entries(results).map(([name, result]) => (
        <div key={name} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>{name}</h3>
          {result.error ? (
            <div style={{ color: 'red' }}>Error: {result.error}</div>
          ) : (
            <>
              <div>Success: {result.success ? '✅' : '❌'}</div>
              <div>Structure: {result.structure}</div>
              <div>Parsed Items: {result.itemCount}</div>
              <div>Raw Data Keys: {result.rawKeys?.join(', ')}</div>
              {result.sampleItem && (
                <div>
                  Sample Item: <pre style={{ fontSize: '12px' }}>{JSON.stringify(result.sampleItem, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TestDataParser;
EOF

echo "📁 Test component created at /tmp/TestDataParser.jsx"
echo ""
echo "📋 DIAGNOSIS STEPS:"
echo "=================="
echo "1. Run the JavaScript test in browser console to see endpoint structure"
echo "2. Add the TestDataParser component to your app temporarily"
echo "3. Check browser console for errors when loading screens"
echo ""
echo "🔧 IMMEDIATE FIX OPTIONS:"
echo "========================"
echo ""
echo "OPTION A: Fix Backend (Recommended)"
echo "-----------------------------------"
echo "Update these files to return ARRAYS:"
echo "1. routes/nflRoutes.js - Change standings to array"
echo "2. routes/nhlRoutes.js - Change standings to array"
echo "3. routes/prizepicksAnalyticsRoutes.js - Change analytics to array"
echo ""
echo "OPTION B: Fix Frontend Data Extraction"
echo "--------------------------------------"
echo "Update your screens to properly extract data:"

cat > /tmp/fix-script.sh << 'EOF'
#!/bin/bash
# proper-frontend-fix.sh

echo "🔧 Applying proper frontend data extraction fixes..."

# Fix NFLAnalyticsScreen.tsx data extraction
if [ -f "src/pages/NFLAnalyticsScreen.tsx" ]; then
  echo "📄 Fixing NFLAnalyticsScreen.tsx data handling..."
  
  # Find the fetch function and update data extraction
  if grep -q "fetch.*nfl.*standings" src/pages/NFLAnalyticsScreen.tsx; then
    # Look for the .then() or async/await pattern
    sed -i '
      # After fetching data, add proper extraction
      /\.then.*response.*json()/,/\.then.*data/ {
        /\.then.*data/ {
          a\
          // Extract teams from nested structure\
          const extractTeams = (standingsData) => {\
            if (!standingsData) return [];\
            if (Array.isArray(standingsData)) return standingsData;\
            \
            const teams = [];\
            \
            // Handle NFL division structure\
            if (standingsData.afc && Array.isArray(standingsData.afc)) {\
              standingsData.afc.forEach(division => {\
                if (division.teams && Array.isArray(division.teams)) {\
                  teams.push(...division.teams.map(team => ({\
                    ...team,\
                    conference: "AFC",\
                    division: division.division\
                  })));\
                }\
              });\
            }\
            \
            if (standingsData.nfc && Array.isArray(standingsData.nfc)) {\
              standingsData.nfc.forEach(division => {\
                if (division.teams && Array.isArray(division.teams)) {\
                  teams.push(...division.teams.map(team => ({\
                    ...team,\
                    conference: "NFC",\
                    division: division.division\
                  })));\
                }\
              });\
            }\
            \
            return teams;\
          };\
          \
          const teamsData = extractTeams(data.standings);\
          setStandings(teamsData);
        }
      }
    ' src/pages/NFLAnalyticsScreen.tsx
    
    echo "   ✅ Updated NFL standings data extraction"
  fi
fi

# Fix PrizePicksScreen.tsx data extraction
if [ -f "src/pages/PrizePicksScreen.tsx" ]; then
  echo "📄 Fixing PrizePicksScreen.tsx data handling..."
  
  if grep -q "fetch.*prizepicks.*analytics" src/pages/PrizePicksScreen.tsx; then
    sed -i '
      # After fetching data, add proper extraction
      /\.then.*response.*json()/,/\.then.*data/ {
        /\.then.*data/ {
          a\
          // Extract analytics from nested structure\
          const extractAnalytics = (analyticsData) => {\
            if (!analyticsData) return [];\
            if (Array.isArray(analyticsData)) return analyticsData;\
            \
            const items = [];\
            \
            // Extract bySport data\
            if (analyticsData.bySport && Array.isArray(analyticsData.bySport)) {\
              items.push(...analyticsData.bySport.map(item => ({\
                type: "sport_performance",\
                ...item\
              })));\
            }\
            \
            // Extract top performers\
            if (analyticsData.topPerformers && Array.isArray(analyticsData.topPerformers)) {\
              items.push(...analyticsData.topPerformers.map(item => ({\
                type: "top_performer",\
                ...item\
              })));\
            }\
            \
            // Extract by pick type\
            if (analyticsData.byPickType && Array.isArray(analyticsData.byPickType)) {\
              items.push(...analyticsData.byPickType.map(item => ({\
                type: "pick_type",\
                ...item\
              })));\
            }\
            \
            return items;\
          };\
          \
          const analyticsItems = extractAnalytics(data.analytics);\
          setAnalytics(analyticsItems);
        }
      }
    ' src/pages/PrizePicksScreen.tsx
    
    echo "   ✅ Updated PrizePicks analytics data extraction"
  fi
fi

echo ""
echo "✅ Proper data extraction fixes applied!"
echo "📊 These changes will extract data from the nested object structure"
echo "🎯 Your screens should now display data correctly"
EOF

chmod +x /tmp/fix-script.sh
echo "📁 Proper fix script created: /tmp/fix-script.sh"
echo ""
echo "🚀 Run this command to apply the fix:"
echo "   /tmp/fix-script.sh"
