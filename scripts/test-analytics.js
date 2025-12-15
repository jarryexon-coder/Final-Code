const fetch = require('node-fetch');

async function testAnalytics() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🧪 Testing Analytics Endpoints...\n');
  
  // Test 1: Send analytics events
  console.log('1. Testing analytics events endpoint...');
  try {
    const events = [
      {
        event_name: 'app_launch',
        properties: {
          screen: 'Home',
          platform: 'iOS',
          version: '1.0.0'
        },
        user_id: 'test-user-123',
        timestamp: new Date().toISOString()
      },
      {
        event_name: 'screen_view',
        properties: {
          screen: 'Games',
          category: 'NBA'
        },
        user_id: 'test-user-123',
        timestamp: new Date().toISOString()
      }
    ];
    
    const response = await fetch(`${BASE_URL}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
    
    const result = await response.json();
    console.log(`   ✅ Success: ${result.received} events received`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Get analytics dashboard
  console.log('\n2. Testing analytics dashboard...');
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/dashboard`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${result.success}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Analytics tests completed!');
}

testAnalytics();
