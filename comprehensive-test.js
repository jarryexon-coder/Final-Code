// comprehensive-test.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function runTests() {
  console.log('🚀 COMPREHENSIVE AUTH TEST SUITE');
  console.log('================================\n');
  
  const tests = [
    {
      name: 'Simple registration',
      data: { email: 'simple1@test.com', password: 'Test123!@#', name: 'Simple One' }
    },
    {
      name: 'Single name registration',
      data: { email: 'single@test.com', password: 'Test123!@#', name: 'Single' }
    },
    {
      name: 'Three name registration',
      data: { email: 'three@test.com', password: 'Test123!@#', name: 'John Michael Doe' }
    },
    {
      name: 'Existing user login',
      data: { email: 'test@example.com', password: 'password123' },
      loginOnly: true
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log('─'.repeat(40));
    
    try {
      if (test.loginOnly) {
        // Login test
        console.log('Logging in...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, test.data);
        
        if (response.data.success) {
          console.log('✅ Login successful!');
          console.log(`   User: ${response.data.data.user.email}`);
          console.log(`   Role: ${response.data.data.user.role}`);
          
          // Test protected route
          const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${response.data.data.tokens.accessToken}` }
          });
          
          if (profileRes.data.success) {
            console.log('✅ Protected route access successful!');
          }
        } else {
          console.log('❌ Login failed:', response.data.message);
        }
      } else {
        // Registration test
        console.log('Registering...');
        const response = await axios.post(`${BASE_URL}/api/auth/register`, test.data);
        
        if (response.data.success) {
          console.log('✅ Registration successful!');
          console.log(`   User ID: ${response.data.data.user.id}`);
          console.log(`   Name: ${response.data.data.user.name}`);
          console.log(`   First: ${response.data.data.user.firstName}`);
          console.log(`   Last: ${response.data.data.user.lastName}`);
          
          // Try login
          console.log('Testing login...');
          const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: test.data.email,
            password: test.data.password
          });
          
          if (loginRes.data.success) {
            console.log('✅ Login successful after registration!');
          }
        } else {
          console.log('❌ Registration failed:', response.data.message);
          if (response.data.errors) {
            console.log('   Errors:', response.data.errors);
          }
        }
      }
    } catch (error) {
      console.error('❌ Test error:', error.response?.data?.error || error.message);
    }
  }
  
  // Health check
  console.log('\n🌐 Final health check...');
  try {
    const health = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Health check:', health.data.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
