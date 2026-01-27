// test-fixed.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testRegistration() {
  console.log('📝 Testing Registration...\n');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'John Smith'
  };
  
  try {
    console.log(`Registering: ${testUser.name} (${testUser.email})`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.success) {
      console.log('✅ Registration successful!');
      console.log('   User ID:', response.data.data.user.id);
      console.log('   First Name:', response.data.data.user.firstName);
      console.log('   Last Name:', response.data.data.user.lastName);
      console.log('   Access Token:', response.data.data.tokens.accessToken.substring(0, 30) + '...');
      return response.data;
    } else {
      console.log('❌ Registration failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log(`\n🔑 Testing Login: ${email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('   Name:', response.data.data.user.name);
      console.log('   Role:', response.data.data.user.role);
      return response.data.data.tokens.accessToken;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testProtectedRoute(token) {
  console.log('\n🔒 Testing Protected Route...');
  
  if (!token) {
    console.log('❌ No token provided');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Protected route access successful!');
      console.log('   User:', response.data.data.email);
      return true;
    } else {
      console.log('❌ Protected route failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Protected route error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testExistingUsers() {
  console.log('\n👥 Testing Existing Users...');
  console.log('============================');
  
  const testAccounts = [
    { email: 'test@example.com', password: 'password123', name: 'Test User' },
    { email: 'user@example.com', password: 'password123', name: 'Regular User' },
    { email: 'admin@example.com', password: 'password123', name: 'Admin User' }
  ];
  
  for (const account of testAccounts) {
    console.log(`\nTesting: ${account.name} (${account.email})`);
    const token = await testLogin(account.email, account.password);
    if (token) {
      await testProtectedRoute(token);
    }
  }
}

async function runTests() {
  console.log('🧪 Running Authentication Tests');
  console.log('===============================\n');
  
  // Test 1: New registration
  const regResult = await testRegistration();
  
  // Test 2: Login with new user
  if (regResult) {
    const newUserToken = await testLogin(
      regResult.data.user.email,
      'Test123!@#'
    );
    if (newUserToken) {
      await testProtectedRoute(newUserToken);
    }
  }
  
  // Test 3: Existing users
  await testExistingUsers();
  
  // Test 4: Health check
  console.log('\n🌐 Testing Health Check...');
  try {
    const health = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Health check:', health.data.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
