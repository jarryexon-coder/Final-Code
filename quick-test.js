// quick-test.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function quickTest() {
  console.log('🧪 Quick Authentication Test\n');
  
  // Test 1: Try to register
  const testEmail = `test${Date.now()}@example.com`;
  
  console.log('1. Testing registration...');
  try {
    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: testEmail,
      password: 'Test123!@#',
      name: 'John Doe'
    });
    
    if (regRes.data.success) {
      console.log('✅ Registration successful!');
      console.log('   User:', regRes.data.data.user.email);
      console.log('   First Name:', regRes.data.data.user.firstName);
      console.log('   Last Name:', regRes.data.data.user.lastName);
      
      // Test 2: Login
      console.log('\n2. Testing login...');
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testEmail,
        password: 'Test123!@#'
      });
      
      if (loginRes.data.success) {
        console.log('✅ Login successful!');
        console.log('   Token:', loginRes.data.data.tokens.accessToken.substring(0, 30) + '...');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
    console.log('Full error:', error.response?.data);
  }
}

quickTest();
