// test-simple.js - Simple test to verify endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    if (endpoint.includes('kalshi')) {
      options.headers['kalshi-access-key'] = 'test_key';
    }
    
    console.log(`🔍 Testing: ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data.success !== undefined ? `Success: ${data.success}` : 'OK');
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Running NBA Backend Tests\n');
  
  // Test endpoints
  const tests = [
    { endpoint: '/health', method: 'GET' },
    { endpoint: '/api/health', method: 'GET' },
    { endpoint: '/api/nba/games', method: 'GET' },
    { endpoint: '/api/kalshi/health', method: 'GET' },
    { endpoint: '/api/kalshi/markets?limit=2', method: 'GET' },
    { endpoint: '/api/kalshi/news', method: 'GET' },
    { endpoint: '/api/predictions/generate', method: 'POST', body: { prompt: 'Test prediction', sport: 'NBA' } },
    { endpoint: '/api/analytics/log', method: 'POST', body: { eventName: 'test', userId: 'test123' } },
    { endpoint: '/api/analytics/summary?userId=test123', method: 'GET' },
    { endpoint: '/api/premium/validate/test123', method: 'GET' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.method, test.body);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    console.log('---\n');
  }
  
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server is running: ${data.status}\n`);
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running at http://localhost:3002');
    console.log('💡 Please start your server with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runAllTests();
  } else {
    process.exit(1);
  }
}

main();
