// test-all-revenuecat-routes.js
import axios from 'axios';

// In test-all-revenuecat-routes.js, add more debugging:
console.log('Environment check:');
console.log('- REVENUECAT_SERVER_API_KEY exists:', !!process.env.REVENUECAT_SERVER_API_KEY);
console.log('- REVENUECAT_WEBHOOK_SECRET exists:', !!process.env.REVENUECAT_WEBHOOK_SECRET);

const BASE_URL = 'https://pleasing-determination-production.up.railway.app';

async function testAllRoutes() {
  console.log('🔍 Testing ALL RevenueCat Routes\n');
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/api/revenuecat/health',
      data: null
    },
    {
      name: 'Get Plans',
      method: 'GET',
      path: '/api/revenuecat/plans',
      data: null
    },
    {
      name: 'Validate Subscription',
      method: 'GET', 
      path: '/api/revenuecat/validate/test123',
      data: null
    },
    {
      name: 'Stripe Receipt',
      method: 'POST',
      path: '/api/revenuecat/stripe-receipt',
      data: { app_user_id: 'test123', fetch_token: 'sub_1SrXBYACyomyQW6NIkOGd9mj' }
    },
    {
      name: 'Webhook',
      method: 'POST',
      path: '/api/revenuecat/webhook',
      data: { type: 'TEST', data: { app_user_id: 'test123' } }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      let response;
      if (test.method === 'GET') {
        response = await axios.get(`${BASE_URL}${test.path}`, {
          validateStatus: () => true // Don't throw on 404
        });
      } else {
        response = await axios.post(`${BASE_URL}${test.path}`, test.data, {
          validateStatus: () => true
        });
      }
      
      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`📊 Success: ${response.data.success !== false}`);
        if (response.data.note) {
          console.log(`📝 Note: ${response.data.note}`);
        }
      } else if (response.status === 404) {
        console.log(`❌ Route not found!`);
        console.log(`   You need to add this route to server.js`);
      } else {
        console.log(`📊 Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test Complete!');
}

testAllRoutes().catch(console.error);
