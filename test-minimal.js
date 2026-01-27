// test-minimal.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function minimalTest() {
  console.log('🧪 Minimal Working Test\n');
  
  // Test 1: Health check
  console.log('1. Health check...');
  try {
    const health = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Server is running:', health.data.message);
  } catch (error) {
    console.log('❌ Server not reachable:', error.message);
    return;
  }
  
  // Test 2: Simple registration
  console.log('\n2. Simple registration...');
  const testEmail = `minimal-${Date.now()}@test.com`;
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: testEmail,
      password: 'test123',
      name: 'Minimal Test'
    }, {
      timeout: 5000
    });
    
    console.log('Response status:', response.status);
    
    if (response.data.success) {
      console.log('✅ Registration worked!');
      console.log('   User ID:', response.data.data.user.id);
      console.log('   Token received:', !!response.data.data.tokens.accessToken);
    } else {
      console.log('❌ Registration failed:', response.data.message);
      console.log('   Errors:', response.data.errors);
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  console.log('\n🎉 Test completed');
}

minimalTest();
