import axios from 'axios';

const API_BASE = 'http://localhost:3002';

async function testSituationalEndpoints() {
  console.log('🎯 Testing Situational Analysis Endpoints...\n');
  
  const tests = [
    {
      name: 'Spot Plays',
      endpoint: '/api/situational/spot-plays',
      params: { sport: 'NBA', date: '2024-01-15' }
    },
    {
      name: 'Psychological Edges',
      endpoint: '/api/situational/psychological-edges',
      params: { sport: 'NBA' }
    },
    {
      name: 'Weather Impacts',
      endpoint: '/api/situational/weather-impacts',
      params: { sport: 'NFL', location: 'Buffalo, NY' }
    },
    {
      name: 'Live Betting Opportunities',
      endpoint: '/api/situational/live-betting',
      params: { sport: 'NBA' }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios.get(`${API_BASE}${test.endpoint}`, { 
        params: test.params,
        timeout: 5000 
      });
      
      if (response.data.success) {
        console.log(`✅ ${test.name}: SUCCESS`);
        const data = response.data.data || {};
        const itemCount = data.spotPlays?.length || data.analyses?.length || 
                         data.scenarios?.length || data.opportunities?.length || 0;
        console.log(`   Found: ${itemCount} items\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED - ${response.data.error || 'Unknown error'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
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

testSituationalEndpoints().catch(console.error);
