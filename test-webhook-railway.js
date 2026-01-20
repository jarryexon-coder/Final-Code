// test-webhook-railway.js
import axios from 'axios';

const BASE_URL = process.env.RAILWAY_STATIC_URL || 'http://localhost:3002';

async function testWebhook() {
  console.log('🔄 Testing RevenueCat Webhook Endpoint\n');
  
  // Test the webhook endpoint with a test payload
  const testPayload = {
    type: 'TEST',
    data: {
      app_user_id: 'test_user_123',
      product_id: 'prod_TpBYfFNjgIjtvi',
      purchased_at_ms: Date.now(),
      price: 19.99,
      currency: 'USD',
      environment: 'SANDBOX'
    }
  };
  
  try {
    console.log('1. Testing POST /api/revenuecat/webhook');
    const response = await axios.post(`${BASE_URL}/api/revenuecat/webhook`, testPayload);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, response.data);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  console.log('\n2. Testing health check');
  try {
    const response = await axios.get(`${BASE_URL}/api/revenuecat/health`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, response.data);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

testWebhook().catch(console.error);
