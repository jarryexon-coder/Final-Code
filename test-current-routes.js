// test-current-routes.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testCurrentRoutes() {
  console.log('🔍 Testing Current RevenueCat Routes\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/revenuecat/health', name: 'Health Check' },
    { method: 'GET', path: '/api/revenuecat/plans', name: 'Plans' },
    { method: 'GET', path: '/api/revenuecat/validate/test123', name: 'Validate Subscription' },
    { method: 'POST', path: '/api/revenuecat/webhook', name: 'Webhook', data: { type: 'TEST' } },
    { method: 'POST', path: '/api/revenuecat/stripe-receipt', name: 'Stripe Receipt', data: { app_user_id: 'test', fetch_token: 'test' } },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          validateStatus: () => true
        });
      } else {
        response = await axios.post(`${BASE_URL}${endpoint.path}`, endpoint.data, {
          validateStatus: () => true
        });
      }
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testCurrentRoutes().catch(console.error);
