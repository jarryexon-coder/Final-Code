// test-new-endpoints.js (ES Module Version)
import axios from 'axios';

const BASE_URL = 'https://pleasing-determination-production.up.railway.app';

async function testEndpoint(endpoint, method = 'GET') {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${method} ${url}`);
    
    const response = await axios({
      method,
      url,
      timeout: 8000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    
    if (response.data.count !== undefined) {
      console.log(`✅ Count: ${response.data.count}`);
    }
    
    if (response.data.data) {
      const dataType = Array.isArray(response.data.data) ? 'array' : typeof response.data.data;
      console.log(`✅ Data type: ${dataType}`);
      
      if (Array.isArray(response.data.data)) {
        console.log(`✅ Items in array: ${response.data.data.length}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code}`);
    console.log(`❌ Message: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting endpoint tests...');
  console.log('='.repeat(60));
  
  const tests = [
    '/api/nhl/players',
    '/api/nhl/standings',
    '/api/games/live',
    '/api/nhl/games',
    '/api/nba/games',
    '/api/daily-picks'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of tests) {
    const success = await testEndpoint(endpoint);
    if (success) passed++;
    else failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All endpoints are working!');
  } else {
    console.log('⚠️ Some endpoints need attention');
  }
}

runTests();
