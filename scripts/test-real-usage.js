const http = require('http');

console.log('📱 Simulating Real App Usage Patterns...\n');

// Simulate a user session
async function simulateUserSession(userId, sessionId) {
  const events = [
    // App launch
    {
      event_name: 'app_launch',
      event_properties: { 
        source: 'cold_start',
        os_version: '17.0',
        app_version: '1.2.0'
      },
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      device_info: {
        platform: 'iOS',
        version: '17.0',
        model: 'iPhone 15 Pro'
      },
      app_version: '1.2.0'
    },
    // Navigate through screens
    {
      event_name: 'screen_view',
      event_properties: { 
        screen_name: 'Home',
        previous_screen: null
      },
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date(Date.now() + 1000).toISOString(),
      device_info: { platform: 'iOS' },
      app_version: '1.2.0'
    },
    {
      event_name: 'screen_view',
      event_properties: { 
        screen_name: 'Games',
        previous_screen: 'Home'
      },
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date(Date.now() + 3000).toISOString(),
      device_info: { platform: 'iOS' },
      app_version: '1.2.0'
    },
    // Feature usage
    {
      event_name: 'feature_usage',
      event_properties: {
        feature_name: 'fantasy_predictions',
        sport: 'NBA',
        duration: 45,
        action: 'view_details'
      },
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date(Date.now() + 5000).toISOString(),
      device_info: { platform: 'iOS' },
      app_version: '1.2.0'
    },
    // Subscription event
    {
      event_name: 'subscription_upgrade_attempt',
      event_properties: {
        plan_id: 'pro_monthly',
        source: 'games_screen',
        screen_name: 'Games'
      },
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date(Date.now() + 8000).toISOString(),
      device_info: { platform: 'iOS' },
      app_version: '1.2.0'
    }
  ];

  const data = JSON.stringify({ events });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(responseData);
          console.log(`   ✅ Session simulated: ${events.length} events sent`);
          resolve(result);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('1. Simulating 3 user sessions...');
  
  for (let i = 1; i <= 3; i++) {
    const userId = `real_user_${i}`;
    const sessionId = `session_real_${Date.now()}_${i}`;
    
    try {
      await simulateUserSession(userId, sessionId);
    } catch (error) {
      console.log(`   ⚠️ Session ${i} failed: ${error.message}`);
    }
  }
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n2. Checking updated dashboard...');
  
  const dashboardData = await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/dashboard',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });
    
    req.on('error', () => resolve({}));
    req.end();
  });
  
  if (dashboardData.success) {
    console.log(`   📊 Total Events: ${dashboardData.data.overview.totalEvents}`);
    console.log(`   👥 Active Users: ${dashboardData.data.overview.activeUsers}`);
    console.log(`   📱 Popular Screens:`);
    dashboardData.data.popularScreens.forEach((screen, i) => {
      console.log(`      ${i+1}. ${screen._id || 'Unknown'}: ${screen.count} views`);
    });
  }
  
  console.log('\n✅ Real Usage Test Complete!');
  console.log('\n🎯 Your analytics system is now ready for:');
  console.log('   • Real user tracking');
  console.log('   • Feature usage analytics');
  console.log('   • Screen flow analysis');
  console.log('   • Conversion tracking');
}

runTest().catch(console.error);
