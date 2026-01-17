// test-kalshi.mjs - ES Module version
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(method, path, body = null) {
  const url = BASE_URL + path;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`\n${method} ${path}:`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Kalshi Integration...\n');
  
  // Test 1: Kalshi health
  await testEndpoint('GET', '/api/kalshi/health');
  
  // Test 2: Prediction generation
  await testEndpoint('POST', '/api/kalshi/predictions/generate', {
    prompt: 'Test NBA prediction',
    sport: 'NBA',
    includeKalshi: true
  });
  
  // Test 3: Analytics log
  await testEndpoint('POST', '/api/kalshi/analytics/log', {
    eventName: 'kalshi_market_view',
    eventData: { marketId: 'TEST-123', action: 'view' },
    userId: 'test_user_' + Date.now(),
    sessionId: 'session_' + Date.now(),
    source: 'test_script'
  });
}

runTests().catch(console.error);
