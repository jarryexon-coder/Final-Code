// test-simple.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };
  
  try {
    // Test registration
    console.log('1. Testing registration...');
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    console.log('✅ Registration successful');
    console.log('   User ID:', registerRes.data.data.user.id);
    
    const { accessToken, refreshToken } = registerRes.data.data.tokens;
    
    // Test protected route
    console.log('\n2. Testing protected route...');
    const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Protected route access successful');
    console.log('   User email:', profileRes.data.data.email);
    
    // Test login
    console.log('\n3. Testing login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful');
    
    // Test refresh token
    console.log('\n4. Testing token refresh...');
    const refreshRes = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken
    });
    console.log('✅ Token refresh successful');
    
    // Test logout
    console.log('\n5. Testing logout...');
    const logoutRes = await axios.post(`${BASE_URL}/api/auth/logout`, 
      { refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    console.log('✅ Logout successful');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testAuth();
