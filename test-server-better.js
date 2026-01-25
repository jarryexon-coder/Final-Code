// test-server-better.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002';

async function testServer() {
  console.log('Testing server endpoints...\n');
  
  try {
    // Test 1: Server root
    console.log('1. Testing server root...');
    const rootRes = await fetch(API_URL);
    const rootText = await rootRes.text();
    
    if (rootRes.ok) {
      try {
        const data = JSON.parse(rootText);
        console.log('✅ Server is responding with JSON');
        console.log('   Response:', data);
      } catch {
        console.log('⚠️ Server responded, but not with JSON');
        console.log('   Response (first 200 chars):', rootText.substring(0, 200));
      }
    } else {
      console.log('❌ Server responded with error:', rootRes.status);
      console.log('   Response:', rootText.substring(0, 200));
    }
    
    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthRes = await fetch(`${API_URL}/health`);
    const healthText = await healthRes.text();
    
    if (healthRes.ok) {
      try {
        const data = JSON.parse(healthText);
        console.log('✅ Health check passed');
        console.log('   Status:', data);
      } catch {
        console.log('⚠️ Health endpoint returned non-JSON');
      }
    } else {
      console.log('❌ Health check failed:', healthRes.status);
    }
    
    // Test 3: Try registration
    console.log('\n3. Testing registration endpoint...');
    try {
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        })
      });
      
      const registerText = await registerRes.text();
      
      if (registerRes.ok) {
        try {
          const data = JSON.parse(registerText);
          console.log('✅ Registration endpoint works');
          console.log('   Success:', data.success);
          console.log('   Token present:', !!data.token);
        } catch {
          console.log('⚠️ Registration returned non-JSON');
          console.log('   Response:', registerText.substring(0, 200));
        }
      } else {
        console.log('❌ Registration failed:', registerRes.status);
        console.log('   Response:', registerText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Registration test failed:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Server connection failed:', error.message);
    console.log('\nMake sure the server is running on port 3002');
    console.log('Run: node server-complete.js');
  }
}

testServer();
