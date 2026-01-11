import axios from 'axios';

const API_BASE = 'http://localhost:3002';

async function testAnalyticsEndpoints() {
  console.log('📊 Testing Sports Analytics Endpoints...\n');
  
  const tests = [
    {
      name: 'Arbitrage Opportunities',
      endpoint: '/api/sports-analytics/arbitrage',
      params: { sport: 'NBA' }
    },
    {
      name: 'Sharp Money Tracking',
      endpoint: '/api/sports-analytics/sharp-money',
      params: { sport: 'NFL' }
    },
    {
      name: 'Public vs Sharp Analysis',
      endpoint: '/api/sports-analytics/public-vs-sharp',
      params: { sport: 'NBA' }
    },
    {
      name: 'Regression Candidates',
      endpoint: '/api/sports-analytics/regression',
      params: { sport: 'NBA', statType: '3-Point Percentage' }
    },
    {
      name: 'Historical Trends',
      endpoint: '/api/sports-analytics/historical-trends',
      params: { sport: 'NBA', trendType: 'back-to-back' }
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
        console.log(`   Data received: ${Object.keys(response.data.data || {}).join(', ') || 'empty'}\n`);
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

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

testAnalyticsEndpoints().catch(console.error);
