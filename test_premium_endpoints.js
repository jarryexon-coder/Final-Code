import axios from 'axios';

const API_BASE = 'http://localhost:3002';

async function testPremiumEndpoints() {
  console.log('💎 Testing Premium Features Endpoints...\n');
  
  const testUserId = 'test_user_123';
  
  const tests = [
    {
      name: 'Check Feature Access',
      method: 'GET',
      endpoint: '/api/premium/check-access',
      params: { userId: testUserId, featureKey: 'snake_draft' }
    },
    {
      name: 'Get Premium Status',
      method: 'GET',
      endpoint: `/api/premium/status/${testUserId}`
    },
    {
      name: 'Get Available Upgrades',
      method: 'GET',
      endpoint: `/api/premium/upgrades/${testUserId}`
    },
    {
      name: 'Validate Subscription',
      method: 'GET',
      endpoint: `/api/premium/validate/${testUserId}`
    },
    {
      name: 'Get Usage Limits',
      method: 'GET',
      endpoint: `/api/premium/limits/${testUserId}`,
      params: { featureKey: 'secret_phrases' }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      let response;
      if (test.method === 'GET') {
        response = await axios.get(`${API_BASE}${test.endpoint}`, { 
          params: test.params,
          timeout: 5000 
        });
      } else {
        response = await axios.post(`${API_BASE}${test.endpoint}`, test.data, {
          timeout: 5000
        });
      }
      
      if (response.data.success || response.data.success === undefined) {
        console.log(`✅ ${test.name}: SUCCESS`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED - ${response.data.error || 'Unknown error'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 100)}`);
      }
      failed++;
    }
  }

  console.log(`\n📈 Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

testPremiumEndpoints().catch(console.error);
