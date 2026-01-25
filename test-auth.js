// test-auth.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/auth';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');
  
  // Test 1: Health check
  try {
    const healthRes = await fetch('http://localhost:3002/health');
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Test registration
  console.log('\nTesting registration...');
  try {
    const registerRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    const registerData = await registerRes.json();
    
    if (registerRes.ok) {
      console.log('✅ Registration successful');
      console.log('   Token:', registerData.token?.substring(0, 20) + '...');
      console.log('   User ID:', registerData.user?.id);
      
      // Test 3: Test login
      console.log('\nTesting login...');
      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });
      
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        console.log('✅ Login successful');
        
        // Test 4: Test protected route
        console.log('\nTesting protected route (GET /me)...');
        const meRes = await fetch(`${API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        const meData = await meRes.json();
        if (meRes.ok) {
          console.log('✅ Protected route accessible');
          console.log('   User:', meData.user?.email);
        } else {
          console.log('❌ Protected route failed:', meData.error);
        }
      } else {
        console.log('❌ Login failed:', loginData.error);
      }
    } else {
      console.log('❌ Registration failed:', registerData.error);
    }
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
  }
}

testAuth();
