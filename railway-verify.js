// railway-verify.js
import fetch from 'node-fetch';

async function verifyRailwayReadiness() {
  console.log('🚂 RAILWAY DEPLOYMENT VERIFICATION\n');
  
  const criticalEndpoints = [
    { url: '/health', name: 'Health Check' },
    { url: '/api/health', name: 'API Health' },
    { url: '/api/fantasy', name: 'Fantasy API' },
    { url: '/api/fantasy/players', name: 'Fantasy Players' },
    { url: '/api/picks', name: 'Picks API' },
    { url: '/api/news', name: 'News API' },
    { url: '/api/nba', name: 'NBA API' },
    { url: '/api/auth', name: 'Auth API' },
  ];
  
  console.log('Testing critical endpoints (must all pass):\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint.url}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${data.success !== undefined ? data.success : true}`);
        passed++;
      } else {
        console.log(`❌ ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error || 'Unknown'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('========================================');
  if (failed === 0) {
    console.log('🎉 ALL CRITICAL ENDPOINTS PASS!');
    console.log('🚀 Ready to deploy to Railway!');
    console.log('\nDeployment commands:');
    console.log('   git add .');
    console.log('   git commit -m "Ready for Railway deployment"');
    console.log('   git push railway main');
  } else {
    console.log(`⚠ ${failed} endpoint(s) failed`);
    console.log('Fix issues before deploying to Railway.');
  }
  console.log('========================================');
  
  process.exit(failed === 0 ? 0 : 1);
}

verifyRailwayReadiness().catch(console.error);
