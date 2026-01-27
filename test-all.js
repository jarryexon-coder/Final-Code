// test-all.js
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const BASE_URL = 'http://localhost:3002';

async function checkServer() {
  console.log('🌐 Checking server...');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Server is running:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    return false;
  }
}

async function checkDatabase() {
  console.log('\n🗄️  Checking database...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Check users
    const User = mongoose.model('User', new mongoose.Schema({}), 'users');
    const count = await User.countDocuments();
    console.log(`📊 Total users: ${count}`);
    
    // Show sample
    const users = await User.find().limit(3);
    console.log('\n👥 Sample users:');
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.name || 'No name'})`);
      console.log(`     First: ${u.firstName || 'N/A'}, Last: ${u.lastName || 'N/A'}`);
    });
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Database error:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('\n📝 Testing registration...');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.success) {
      console.log('✅ Registration successful');
      console.log('   User:', response.data.data.user.email);
      console.log('   Name split:', `${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      
      return {
        success: true,
        user: response.data.data.user,
        tokens: response.data.data.tokens
      };
    } else {
      console.log('❌ Registration failed:', response.data.message);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Registration error:', error.response?.data?.error || error.message);
    return { success: false };
  }
}

async function testLogin(email, password) {
  console.log(`\n🔑 Testing login for ${email}...`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      console.log('✅ Login successful');
      return {
        success: true,
        tokens: response.data.data.tokens
      };
    } else {
      console.log('❌ Login failed:', response.data.message);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.error || error.message);
    return { success: false };
  }
}

async function testProtectedRoute(token) {
  console.log('\n🔒 Testing protected route...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Protected route access successful');
      console.log('   User data:', response.data.data.email);
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

async function runAllTests() {
  console.log('🧪 Running All Authentication Tests\n');
  console.log('=' .repeat(50));
  
  // Step 1: Check server
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log('\n❌ Cannot proceed without server');
    return;
  }
  
  // Step 2: Check database
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\n❌ Cannot proceed without database');
    return;
  }
  
  // Step 3: Test registration
  const regResult = await testRegistration();
  if (!regResult.success) {
    console.log('\n❌ Registration test failed');
    return;
  }
  
  // Step 4: Test login with new user
  const loginResult = await testLogin(
    regResult.user.email,
    'Test123!@#'
  );
  
  if (!loginResult.success) {
    console.log('\n❌ Login test failed');
    return;
  }
  
  // Step 5: Test protected route
  const protectedOk = await testProtectedRoute(loginResult.tokens.accessToken);
  
  // Step 6: Test existing user login
  console.log('\n👥 Testing existing user login...');
  const existingLogin = await testLogin('test@example.com', 'password123');
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log('✅ Server check:', serverOk);
  console.log('✅ Database check:', dbOk);
  console.log('✅ Registration test:', regResult.success);
  console.log('✅ Login test (new user):', loginResult.success);
  console.log('✅ Protected route test:', protectedOk);
  console.log('✅ Existing user login:', existingLogin.success);
  
  if (regResult.success && loginResult.success && protectedOk) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication system is working.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
  }
}

runAllTests().catch(console.error);
