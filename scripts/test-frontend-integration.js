const http = require('http');

console.log('🧪 Simulating Frontend Analytics Events...\n');

const simulateFrontendEvents = async () => {
  const events = [
    {
      event_name: 'app_launch',
      event_properties: { source: 'cold_start' },
      user_id: 'user_12345',
      session_id: 'session_67890',
      timestamp: new Date().toISOString(),
      device_info: {
        platform: 'iOS',
        version: '16.0',
        model: 'iPhone 14 Pro'
      },
      app_version: '1.2.0'
    },
    {
      event_name: 'screen_view',
      event_properties: { 
        screen_name: 'HomeScreen',
        previous_screen: null 
      },
      user_id: 'user_12345',
      session_id: 'session_67890',
      timestamp: new Date().toISOString(),
      device_info: {
        platform: 'iOS',
        version: '16.0',
        model: 'iPhone 14 Pro'
      },
      app_version: '1.2.0'
    },
    {
      event_name: 'feature_usage',
      event_properties: {
        feature_name: 'fantasy_predictions',
        sport: 'NBA',
        duration: 45
      },
      user_id: 'user_12345',
      session_id: 'session_67890',
      timestamp: new Date().toISOString(),
      device_info: {
        platform: 'iOS',
        version: '16.0',
        model: 'iPhone 14 Pro'
      },
      app_version: '1.2.0'
    }
  ];

  const data = JSON.stringify({ events });

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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Successfully sent ${events.length} frontend-style events`);
          console.log(`   Response: ${responseData}`);
        } else {
          console.log(`❌ Error: Status ${res.statusCode}`);
          console.log(`   Response: ${responseData}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Network Error: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const checkDashboardAfterEvents = async () => {
  console.log('\n📊 Checking Dashboard After Events...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/dashboard',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Total Events: ${jsonData.data.overview.totalEvents}`);
            console.log(`   Active Users: ${jsonData.data.overview.activeUsers}`);
            console.log(`   Popular Screens:`, jsonData.data.popularScreens);
          } catch (e) {
            console.log(`   Error parsing: ${e.message}`);
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      resolve();
    });

    req.end();
  });
};

async function runTest() {
  await simulateFrontendEvents();
  await checkDashboardAfterEvents();
  
  console.log('\n🎯 Frontend Integration Test Complete!');
  console.log('\nNext: Update your React Native app to send events to:');
  console.log('   POST http://localhost:3000/api/analytics/events');
  console.log('\nExpected event format:');
  console.log(`   {
    "events": [{
      "event_name": "screen_view",
      "event_properties": { "screen_name": "Home" },
      "user_id": "user_id",
      "session_id": "session_id",
      "timestamp": "ISO8601",
      "device_info": { ... },
      "app_version": "1.0.0"
    }]
  }`);
}

runTest();
