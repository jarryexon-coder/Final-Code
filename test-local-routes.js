// test-local-routes.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const routes = [
  '/api/nhl/players',
  '/api/nhl/standings',
  '/api/games/live',
  '/api/nhl/games',
  '/api/nba/games',
  '/health'
];

async function testRoute(route) {
  try {
    const response = await axios.get(`${BASE_URL}${route}`, { timeout: 3000 });
    console.log(`✅ ${route} - Status: ${response.status}`);
    if (response.data.success !== undefined) {
      console.log(`   Success: ${response.data.success}`);
    }
    return true;
  } catch (error) {
    console.log(`❌ ${route} - Error: ${error.response?.status || error.code}`);
    if (error.response?.data?.error) {
      console.log(`   Message: ${error.response.data.error}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🔍 Testing local routes...');
  console.log('Server should be running on', BASE_URL);
  console.log('='.repeat(60));
  
  for (const route of routes) {
    await testRoute(route);
    console.log('---');
  }
}

runTests();
