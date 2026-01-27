// test-registration.js
import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testRegistration() {
  console.log('🧪 Testing Registration with Name Splitting...\n');
  
  const testUsers = [
    {
      email: `single-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Single'
    },
    {
      email: `double-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'John Doe'
    },
    {
      email: `triple-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'John Michael Doe'
    }
  ];
  
  for (const user of testUsers) {
    try {
      console.log(`Registering: ${user.name} (${user.email})`);
      
      const response = await axios.post(`${BASE_URL}/api/auth/register`, user);
      
      if (response.data.success) {
        console.log('✅ Success!');
        console.log('   First Name:', response.data.data.user.firstName);
        console.log('   Last Name:', response.data.data.user.lastName);
        console.log('   Access Token:', response.data.data.tokens.accessToken?.substring(0, 30) + '...');
        
        // Try to get profile
        try {
          const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { 
              Authorization: `Bearer ${response.data.data.tokens.accessToken}` 
            }
          });
          console.log('   Profile Access: ✅');
        } catch (profileError) {
          console.log('   Profile Access: ❌', profileError.response?.data?.message);
        }
      } else {
        console.log('❌ Failed:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
    console.log('');
  }
}

testRegistration();
