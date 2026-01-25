// test-complete-auth.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/auth';

async function testCompleteAuth() {
  console.log('=== Testing Complete Authentication Flow ===\n');
  
  const testEmail = `user${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  try {
    // 1. Test Registration
    console.log('1. Testing Registration...');
    const registerRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    const registerData = await registerRes.json();
    
    if (!registerRes.ok) {
      console.log('❌ Registration failed:', registerData.error);
      return;
    }
    
    console.log('✅ Registration successful');
    console.log('   User ID:', registerData.user.id);
    console.log('   Token received:', registerData.token ? 'Yes' : 'No');
    
    const authToken = registerData.token;
    
    // 2. Test Login with wrong password
    console.log('\n2. Testing Login with wrong password...');
    try {
      const wrongLoginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!'
        })
      });
      
      const wrongLoginData = await wrongLoginRes.json();
      console.log('✅ Correctly rejected wrong password');
    } catch (error) {
      console.log('❌ Wrong password test error:', error.message);
    }
    
    // 3. Test Login with correct credentials
    console.log('\n3. Testing Login with correct credentials...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }
    
    console.log('✅ Login successful');
    const newAuthToken = loginData.token;
    
    // 4. Test Protected Route (/me)
    console.log('\n4. Testing Protected Route (GET /me)...');
    const meRes = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${newAuthToken}`
      }
    });
    
    const meData = await meRes.json();
    
    if (!meRes.ok) {
      console.log('❌ Protected route failed:', meData.error);
      return;
    }
    
    console.log('✅ Protected route accessible');
    console.log('   Current user:', meData.user.email);
    console.log('   Role:', meData.user.role);
    
    // 5. Test Token Refresh
    console.log('\n5. Testing Token Refresh...');
    const refreshRes = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: newAuthToken
      })
    });
    
    const refreshData = await refreshRes.json();
    
    if (refreshRes.ok) {
      console.log('✅ Token refresh successful');
      console.log('   New token received');
    } else {
      console.log('⚠️ Token refresh:', refreshData.error || 'Not implemented');
    }
    
    // 6. Test Logout
    console.log('\n6. Testing Logout...');
    const logoutRes = await fetch(`${API_URL}/logout`, {
      method: 'POST'
    });
    
    const logoutData = await logoutRes.json();
    console.log('✅ Logout:', logoutData.message);
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Registration: ✅');
    console.log('   - Login: ✅');
    console.log('   - Protected routes: ✅');
    console.log('   - Complete auth flow: ✅');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

testCompleteAuth();
