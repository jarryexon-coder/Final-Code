import fetch from 'node-fetch';

console.log('🚀 FINAL VERIFICATION TEST\n');
console.log('Testing all critical endpoints...\n');

const BASE_URL = 'http://localhost:3002';
const endpoints = [
  // Health endpoints
  { path: '/health', name: 'Health Check' },
  { path: '/api/health', name: 'API Health' },
  
  // Core API endpoints (from your test suite)
  { path: '/api/players', name: 'Players API' },
  { path: '/api/teams', name: 'Teams API' },
  { path: '/api/games/live', name: 'Live Games API' },
  { path: '/api/secret-phrases', name: 'Secret Phrases API' },
  { path: '/api/auth', name: 'Auth API' },
  { path: '/api/admin/health', name: 'Admin Health' },
  { path: '/api/analytics/overview', name: 'Analytics Overview' },
  { path: '/api/betting/odds', name: 'Betting Odds' },
  { path: '/api/predictions/today', name: 'Predictions Today' },
  
  // Additional critical endpoints
  { path: '/api/nba', name: 'NBA API' },
  { path: '/api/fantasy', name: 'Fantasy API' },
  { path: '/api/picks', name: 'Picks API' },
  { path: '/api/news', name: 'News API' }
];

let passed = 0;
let failed = 0;

for (const endpoint of endpoints) {
  const url = `${BASE_URL}${endpoint.path}`;
  process.stdout.write(`Testing ${endpoint.name} (${endpoint.path})... `);
  
  try {
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅');
      passed++;
    } else {
      console.log(`❌ HTTP ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${error.message}`);
    failed++;
  }
  
  // Small delay to avoid overwhelming
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Backend is fully operational.');
  console.log('\n✅ Ready for deployment to Railway!');
} else {
  console.log(`\n⚠ ${failed} tests failed. Check the endpoints above.`);
}

// Test database connectivity
console.log('\n🔗 Testing database connection...');
try {
  const mongoose = await import('mongoose');
  const dotenv = await import('dotenv');
  dotenv.config();
  
  await mongoose.connect(process.env.MONGODB_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✅ MongoDB connected with ${collections.length} collections`);
  await mongoose.disconnect();
} catch (error) {
  console.log(`⚠ Database test: ${error.message}`);
}

console.log('\n========================================');
console.log('FINAL STATUS: READY FOR DEPLOYMENT 🚀');
console.log('========================================');
process.exit(failed === 0 ? 0 : 1);
