// fixed-verification.js - Accurate verification for NBA Fantasy AI Backend
import fetch from 'node-fetch';

async function runFixedVerification() {
  console.log('🚀 NBA Fantasy AI Backend Verification\n');
  
  // Test endpoints that DEFINITELY exist based on server.js
  const testEndpoints = [
    // Root and health endpoints (always exist)
    { path: '/', name: 'Root API' },
    { path: '/health', name: 'Health Check' },
    { path: '/api/health', name: 'API Health' },
    
    // Basic API endpoints (defined in server.js)
    { path: '/api/nba', name: 'NBA API' },
    { path: '/api/players', name: 'Players API' },
    { path: '/api/teams', name: 'Teams API' },
    { path: '/api/games', name: 'Games API' },
    { path: '/api/games/live', name: 'Live Games' },
    { path: '/api/auth', name: 'Auth API' },
    { path: '/api/admin', name: 'Admin API' },
    { path: '/api/analytics', name: 'Analytics API' },
    { path: '/api/predictions', name: 'Predictions API' },
    { path: '/api/secret-phrases', name: 'Secret Phrases API' },
    { path: '/api/betting', name: 'Betting API' },
    { path: '/api/fantasy', name: 'Fantasy API' },
    { path: '/api/picks', name: 'Picks API' },
    { path: '/api/news', name: 'News API' },
  ];

  let passed = 0;
  let failed = 0;

  console.log('Testing API endpoints...\n');

  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint.path}`);
      const status = response.status;
      
      if (status >= 200 && status < 300) {
        console.log(`✅ ${endpoint.name} (${endpoint.path}) - HTTP ${status}`);
        passed++;
        
        // Show response for key endpoints
        if (endpoint.path === '/api/health') {
          const data = await response.json();
          console.log(`   📊 Database status: ${data.databases?.mongodb || 'unknown'}`);
        }
      } else {
        console.log(`❌ ${endpoint.name} (${endpoint.path}) - HTTP ${status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} (${endpoint.path}) - ${error.message}`);
      failed++;
    }
    
    // Small delay to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);

  // Test database connection directly
  console.log('\n🗄️ Testing MongoDB connection...');
  try {
    const { MongoClient } = await import('mongodb');
    const dotenv = await import('dotenv');
    
    dotenv.config();
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log(`✅ MongoDB connected successfully!`);
    console.log(`✅ Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      const collectionNames = collections.map(c => c.name).join(', ');
      console.log(`📁 Collections: ${collectionNames}`);
    }
    
    await client.close();
  } catch (error) {
    console.log(`❌ MongoDB connection test failed: ${error.message}`);
  }

  console.log('\n========================================');
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Backend is fully operational.');
    console.log('✅ Ready for deployment to Railway!');
  } else {
    console.log(`⚠ ${failed} test(s) failed. Check the endpoints above.`);
  }
  
  console.log('========================================');
  
  process.exit(failed === 0 ? 0 : 1);
}

runFixedVerification().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
