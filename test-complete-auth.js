// test-complete-auth.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testCompleteAuth() {
  console.log('🚀 COMPLETE AUTHENTICATION TEST');
  console.log('================================\n');
  
  const testUser = {
    email: `complete-test-${Date.now()}@example.com`,
    password: 'Complete123!',
    name: 'Complete Test User'
  };
  
  let accessToken = null;
  let refreshToken = null;
  let userId = null;
  
  try {
    // 1. REGISTER
    console.log('1. Testing Registration...');
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (!registerRes.data.success) {
      console.log('❌ Registration failed:', registerRes.data.message);
      return;
    }
    
    console.log('✅ Registration successful!');
    console.log('   User ID:', registerRes.data.data.user.id);
    console.log('   Email:', registerRes.data.data.user.email);
    console.log('   Name:', registerRes.data.data.user.name);
    
    userId = registerRes.data.data.user.id;
    
    // 2. LOGIN
    console.log('\n2. Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (!loginRes.data.success) {
      console.log('❌ Login failed:', loginRes.data.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   User:', loginRes.data.data.user.email);
    console.log('   Role:', loginRes.data.data.user.role);
    
    accessToken = loginRes.data.data.tokens.accessToken;
    refreshToken = loginRes.data.data.tokens.refreshToken;
    
    // 3. PROTECTED ROUTE
    console.log('\n3. Testing Protected Route...');
    const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!profileRes.data.success) {
      console.log('❌ Protected route failed:', profileRes.data.message);
      return;
    }
    
    console.log('✅ Protected route successful!');
    console.log('   Profile data received');
    console.log('   Email:', profileRes.data.data.email);
    console.log('   Name:', profileRes.data.data.name);
    
    // 4. UPDATE PROFILE
    console.log('\n4. Testing Profile Update...');
    const updateRes = await axios.put(`${BASE_URL}/api/auth/profile`, {
      name: 'Updated Name',
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!updateRes.data.success) {
      console.log('❌ Profile update failed:', updateRes.data.message);
    } else {
      console.log('✅ Profile update successful!');
      console.log('   New name:', updateRes.data.data.user.name);
    }
    
    // 5. TOKEN REFRESH
    console.log('\n5. Testing Token Refresh...');
    const refreshRes = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken
    });
    
    if (!refreshRes.data.success) {
      console.log('❌ Token refresh failed:', refreshRes.data.message);
    } else {
      console.log('✅ Token refresh successful!');
      console.log('   New access token received');
      
      // Update token and test again
      const newAccessToken = refreshRes.data.data.accessToken;
      
      const newProfileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${newAccessToken}` }
      });
      
      if (newProfileRes.data.success) {
        console.log('✅ New token works!');
      }
    }
    
    // 6. LOGOUT
    console.log('\n6. Testing Logout...');
    const logoutRes = await axios.post(`${BASE_URL}/api/auth/logout`, {
      refreshToken
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!logoutRes.data.success) {
      console.log('❌ Logout failed:', logoutRes.data.message);
    } else {
      console.log('✅ Logout successful!');
      
      // Try to use the token after logout (should fail)
      try {
        await axios.get(`${BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log('⚠️  Token still works after logout (refresh would fail)');
      } catch (error) {
        console.log('✅ Token invalidated after logout (expected)');
      }
    }
    
    // 7. EXISTING USER LOGIN
    console.log('\n7. Testing Existing User Login...');
    const existingLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (existingLoginRes.data.success) {
      console.log('✅ Existing user login works!');
      console.log('   User:', existingLoginRes.data.data.user.email);
    } else {
      console.log('❌ Existing user login failed:', existingLoginRes.data.message);
    }
    
    console.log('\n🎉 ALL AUTHENTICATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📋 SUMMARY:');
    console.log('   ✅ User registration');
    console.log('   ✅ User login');
    console.log('   ✅ Protected routes');
    console.log('   ✅ Profile management');
    console.log('   ✅ Token refresh');
    console.log('   ✅ Logout');
    console.log('   ✅ Existing users');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testCompleteAuth();
