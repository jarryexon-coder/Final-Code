// test-all-routes.js - Discover and test all available routes
import fetch from 'node-fetch';

async function testAllRoutes() {
  console.log('🔍 Discovering and testing all routes...\n');
  
  // First, get the root endpoint to discover available routes
  try {
    const rootResponse = await fetch('http://localhost:3002/');
    const rootData = await rootResponse.json();
    
    console.log('Server Information:');
    console.log(`📦 Version: ${rootData.version}`);
    console.log(`🌍 Environment: ${rootData.environment}`);
    console.log('\nAvailable Endpoints:');
    
    let passed = 0;
    let failed = 0;
    
    // Test each endpoint listed in the root response
    if (rootData.endpoints && Array.isArray(rootData.endpoints)) {
      for (const endpoint of rootData.endpoints) {
        try {
          const response = await fetch(`http://localhost:3002${endpoint}`);
          const status = response.status;
          
          if (status >= 200 && status < 300) {
            console.log(`✅ ${endpoint} - HTTP ${status}`);
            passed++;
          } else {
            console.log(`❌ ${endpoint} - HTTP ${status}`);
            failed++;
          }
        } catch (error) {
          console.log(`❌ ${endpoint} - ${error.message}`);
          failed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      console.log('⚠ No endpoints listed in root response');
    }
    
    console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
    
    // Test MongoDB connection
    console.log('\n🗄️ Database Status:');
    try {
      const healthResponse = await fetch('http://localhost:3002/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`✅ Database: ${healthData.databases?.mongodb || 'connected'}`);
      }
    } catch (error) {
      console.log(`⚠ Health check error: ${error.message}`);
    }
    
    console.log('\n========================================');
    if (failed === 0 && passed > 0) {
      console.log('🎉 ALL ROUTES WORKING! Ready for deployment.');
    } else if (passed > 0) {
      console.log('✅ Core routes working. Some endpoints may need fixing.');
    } else {
      console.log('⚠ No routes tested successfully.');
    }
    console.log('========================================');
    
  } catch (error) {
    console.log(`❌ Cannot connect to server: ${error.message}`);
    console.log('\nMake sure the server is running:');
    console.log('   node server.js');
    process.exit(1);
  }
}

testAllRoutes().catch(console.error);
