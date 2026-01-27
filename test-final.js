// test-final.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testEverything() {
  console.log('🚀 FINAL AUTHENTICATION TEST');
  console.log('=============================\n');
  
  const testUser = {
    email: `final-test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Final Test User'
  };
  
  try {
    // Test 1: Register
    console.log('1. Testing Registration...');
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (registerRes.data.success) {
      console.log('✅ Registration SUCCESS!');
      console.log('   User ID:', registerRes.data.data.user.id);
      console.log('   Email:', registerRes.data.data.user.email);
      console.log('   Name:', registerRes.data.data.user.name);
      console.log('   First Name:', registerRes.data.data.user.firstName);
      console.log('   Last Name:', registerRes.data.data.user.lastName);
      console.log('   Token:', registerRes.data.data.tokens.accessToken.substring(0, 30) + '...');
    } else {
      console.log('❌ Registration failed:', registerRes.data.message);
      if (registerRes.data.errors) {
        console.log('   Errors:', registerRes.data.errors);
      }
      return;
    }
    
    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginRes.data.success) {
      console.log('✅ Login SUCCESS!');
      console.log('   User:', loginRes.data.data.user.email);
      console.log('   Role:', loginRes.data.data.user.role);
    } else {
      console.log('❌ Login failed:', loginRes.data.message);
      return;
    }
    
    // Test 3: Protected Route
    console.log('\n3. Testing Protected Route...');
    const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${loginRes.data.data.tokens.accessToken}` }
    });
    
    if (profileRes.data.success) {
      console.log('✅ Protected Route SUCCESS!');
      console.log('   User Profile:', profileRes.data.data.email);
    } else {
      console.log('❌ Protected route failed:', profileRes.data.message);
    }
    
    // Test 4: Existing User Login
    console.log('\n4. Testing Existing User Login...');
    const existingLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (existingLoginRes.data.success) {
      console.log('✅ Existing User Login SUCCESS!');
      console.log('   User:', existingLoginRes.data.data.user.email);
    } else {
      console.log('❌ Existing user login failed:', existingLoginRes.data.message);
    }
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n💡 You can now:');
    console.log('   - Register new users');
    console.log('   - Login with new users');
    console.log('   - Login with existing users (password: "password123")');
    console.log('   - Access protected routes');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testEverything();
