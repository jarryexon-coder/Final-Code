// test-railway-deployment.js
import axios from 'axios';

// Use Railway URL or localhost
const BASE_URL = process.env.RAILWAY_STATIC_URL || 'http://localhost:3002';

console.log('🚂 Testing Railway Deployment');
console.log('============================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

async function testDeployment() {
  try {
    // Test basic health
    console.log('1. Testing main health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Main Health: ${health.status} - ${health.data.status}`);
    
    // Test revenuecat health
    console.log('\n2. Testing RevenueCat health endpoint...');
    const rcHealth = await axios.get(`${BASE_URL}/api/revenuecat/health`);
    console.log(`✅ RevenueCat Health: ${rcHealth.status}`);
    console.log(`📊 Configuration:`, rcHealth.data.configuration);
    
    // Test stripe receipt endpoint
    console.log('\n3. Testing Stripe receipt endpoint...');
    const receiptData = {
      app_user_id: 'test_user_123',
      fetch_token: 'sub_1SrXBYACyomyQW6NIkOGd9mj'
    };
    
    const receipt = await axios.post(
      `${BASE_URL}/api/revenuecat/stripe-receipt`,
      receiptData,
      { validateStatus: () => true } // Don't throw on error
    );
    
    console.log(`✅ Stripe Receipt: ${receipt.status}`);
    console.log(`📊 Response:`, receipt.data);
    
    if (receipt.data.note && receipt.data.note.includes('mock')) {
      console.log('⚠️ Running in mock mode - add REVENUECAT_SERVER_API_KEY to Railway variables');
    }
    
    // Test webhook
    console.log('\n4. Testing webhook endpoint...');
    const webhookData = {
      type: 'TEST',
      data: {
        app_user_id: 'test_user_123',
        product_id: 'prod_TpBYfFNjgIjtvi',
        purchased_at_ms: Date.now()
      }
    };
    
    const webhook = await axios.post(
      `${BASE_URL}/api/revenuecat/webhook`,
      webhookData,
      { validateStatus: () => true }
    );
    
    console.log(`✅ Webhook: ${webhook.status}`);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testDeployment();
