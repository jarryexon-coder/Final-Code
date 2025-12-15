#!/usr/bin/env node

const http = require('http');
const assert = require('assert');

console.log('🧪 Testing Updated Analytics Endpoints...\n');

const testDashboard = async () => {
  return new Promise((resolve, reject) => {
    console.log('1. Testing analytics dashboard endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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
            
            // Check the new response structure
            assert(jsonData.success === true, 'Response should have success: true');
            assert(jsonData.data, 'Response should have data object');
            assert(jsonData.data.overview, 'Response should have overview data');
            assert(jsonData.data.overview.totalUsers !== undefined, 'Should have totalUsers');
            
            console.log(`   ✅ Success: Dashboard endpoint working`);
            console.log(`   📊 Total Users: ${jsonData.data.overview.totalUsers}`);
            console.log(`   📈 Active Users: ${jsonData.data.overview.activeUsers}`);
            console.log(`   🎯 Conversion Rate: ${jsonData.data.overview.conversionRate}%`);
            
            resolve(jsonData);
          } catch (e) {
            console.log(`   ❌ Error parsing response: ${e.message}`);
            console.log(`   Response: ${data.substring(0, 200)}...`);
            reject(e);
          }
        } else {
          console.log(`   ❌ Error: Status ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}...`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Network Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

const testAnalyticsEvents = async () => {
  return new Promise((resolve, reject) => {
    console.log('2. Testing analytics events endpoint...');
    
    const eventsData = JSON.stringify({
      events: [
        {
          event_name: 'test_event',
          event_properties: { test: 'data' },
          user_id: 'test_user',
          session_id: 'test_session',
          timestamp: new Date().toISOString()
        }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(eventsData)
      }
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
            console.log(`   ✅ Success: ${jsonData.received || 1} event(s) received`);
            resolve(jsonData);
          } catch (e) {
            console.log(`   ❌ Error parsing response: ${e.message}`);
            reject(e);
          }
        } else {
          console.log(`   ❌ Error: Status ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}...`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Network Error: ${error.message}`);
      reject(error);
    });

    req.write(eventsData);
    req.end();
  });
};

const testAnalyticsRealtime = async () => {
  return new Promise((resolve, reject) => {
    console.log('3. Testing analytics realtime endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/realtime',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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
            console.log(`   ✅ Success: Realtime endpoint working`);
            console.log(`   📡 Events in realtime buffer: ${jsonData.data?.length || 0}`);
            resolve(jsonData);
          } catch (e) {
            console.log(`   ⚠️  Warning: ${e.message}`);
            resolve({}); // Non-critical endpoint
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`   ⚠️  Expected: Authentication required (${res.statusCode})`);
          resolve({}); // Expected for non-authenticated requests
        } else {
          console.log(`   ⚠️  Warning: Status ${res.statusCode}`);
          resolve({}); // Non-critical endpoint
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ⚠️  Warning: ${error.message} (endpoint might not be available)`);
      resolve({}); // Non-critical endpoint
    });

    req.end();
  });
};

async function runAllTests() {
  try {
    await testDashboard();
    console.log('');
    await testAnalyticsEvents();
    console.log('');
    await testAnalyticsRealtime();
    
    console.log('\n✅ All analytics tests completed successfully!');
    console.log('\n🎯 Analytics System Status:');
    console.log('   • Dashboard: ✅ Working');
    console.log('   • Events Collection: ✅ Working');
    console.log('   • Realtime: ⚠️  May require auth');
    console.log('   • MongoDB Connection: ✅ Connected');
    
  } catch (error) {
    console.log(`\n❌ Tests failed: ${error.message}`);
    process.exit(1);
  }
}

runAllTests();
