cat > test-webhook.js << 'EOF'
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3002';

async function testWebhook() {
  console.log('🔄 Testing RevenueCat Webhook Endpoint\n');
  
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
    console.log('Response:', error.response?.data);
  }
  
  console.log('\n2. Testing Stripe receipt forwarding');
  try {
    const stripePayload = {
      app_user_id: 'test_user_123',
      fetch_token: 'sub_1SrXBYACyomyQW6NIkOGd9mj' // From your logs
    };
    
    const response = await axios.post(`${BASE_URL}/api/revenuecat/stripe-receipt`, stripePayload);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, response.data);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    console.log('Note: This requires REVENUECAT_SERVER_API_KEY in .env');
  }
  
  console.log('\n3. Testing subscription validation');
  try {
    const response = await axios.get(`${BASE_URL}/api/revenuecat/validate/test_user_123`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Is valid subscription: ${response.data.data.isValid}`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

testWebhook();
EOF

