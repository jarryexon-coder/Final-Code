// quick-test.js - Quick verification for Railway deployment
import fetch from 'node-fetch';

async function quickTest() {
  console.log('🏀 NBA Backend Railway Deployment Test\n');
  
  const criticalEndpoints = [
    '/health',
    '/api/health',
    '/api/nba',
    '/api/players',
    '/api/teams',
    '/api/auth'
  ];
  
  console.log('Testing critical endpoints...\n');
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint}`);
      const status = response.status;
      
      if (status >= 200 && status < 300) {
        console.log(`✅ ${endpoint} - HTTP ${status}`);
      } else {
        console.log(`❌ ${endpoint} - HTTP ${status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ${error.message}`);
    }
  }
  
  console.log('\n✅ Quick test complete!');
  console.log('If all endpoints return 200, backend is ready for Railway.');
  console.log('\n🚀 To deploy to Railway:');
  console.log('1. Commit all changes: git add . && git commit -m "Ready for Railway"');
  console.log('2. Push to Railway: git push railway main');
}

// Run the test
quickTest().catch(console.error);
