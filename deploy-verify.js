// deploy-verify.js - Minimal verification for Railway deployment
import fetch from 'node-fetch';

async function verifyDeployment() {
  console.log('🚂 Railway Deployment Verification\n');
  
  const endpoints = [
    '/health',
    '/api/health'
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK`);
        
        // Show health data
        if (endpoint === '/api/health') {
          const data = await response.json();
          console.log(`   📊 Database: ${data.databases?.mongodb || 'connected'}`);
          console.log(`   🕐 Uptime: ${data.timestamp}`);
        }
      } else {
        console.log(`❌ ${endpoint} - HTTP ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ VERIFICATION PASSED!');
    console.log('🚀 Ready to deploy to Railway!');
    console.log('\nDeployment command:');
    console.log('   git push railway main');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('   Fix issues before deploying to Railway.');
  }
  console.log('========================================');
  
  process.exit(allPassed ? 0 : 1);
}

verifyDeployment().catch(console.error);
