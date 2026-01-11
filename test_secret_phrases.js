import axios from 'axios';

const API_BASE = 'http://localhost:3002';

async function testSecretPhraseIntegration() {
  console.log('🎭 Testing Secret Phrase Integration...\n');
  
  const testCases = [
    {
      phrase: '26snake_anchor',
      description: 'Snake Draft Anchor Strategy',
      service: 'draft',
      endpoint: '/api/draft/snake/anchor',
      params: { draftPosition: 5, teamCount: 10, sport: 'NBA' }
    },
    {
      phrase: '26gpp_leverage',
      description: 'GPP Leverage Strategy',
      service: 'contest',
      endpoint: '/api/contest/gpp/leverage',
      params: { sport: 'NFL', contestSize: 'large' }
    },
    {
      phrase: '26kalshi_inefficiency',
      description: 'Kalshi Market Inefficiency',
      service: 'kalshi',
      endpoint: '/api/kalshi/inefficiencies',
      params: { marketType: 'all' }
    },
    {
      phrase: 'arbitrage',
      description: 'Sports Betting Arbitrage',
      service: 'sports-analytics',
      endpoint: '/api/sports-analytics/arbitrage',
      params: { sport: 'NBA' }
    },
    {
      phrase: 'spot_play',
      description: 'Situational Spot Play',
      service: 'situational',
      endpoint: '/api/situational/spot-plays',
      params: { sport: 'NBA', date: '2024-01-15' }
    }
  ];

  console.log('Testing phrase handlers connect to correct services:');
  console.log('===================================================\n');

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.description} (${testCase.phrase})`);
      
      const response = await axios.get(`${API_BASE}${testCase.endpoint}`, {
        params: testCase.params,
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log(`✅ ${testCase.phrase}: Connected to ${testCase.service} service`);
        console.log(`   Response keys: ${Object.keys(response.data.data || {}).join(', ') || 'empty'}\n`);
      } else {
        console.log(`⚠️  ${testCase.phrase}: Service responded but with error: ${response.data.error || 'Unknown'}\n`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.phrase}: Cannot connect to ${testCase.service} service`);
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.error || 'No error message'}`);
      }
      console.log();
    }
  }

  // Test the health endpoint to ensure server is running
  console.log('\n🏥 Testing Server Health:');
  console.log('========================\n');
  
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    console.log(`✅ Server Health: ${healthResponse.data.status}`);
    console.log(`   Version: ${healthResponse.data.version}`);
    console.log(`   Uptime: ${healthResponse.data.uptime}\n`);
  } catch (error) {
    console.log(`❌ Server Health Check Failed: ${error.message}\n`);
  }

  console.log('✨ Secret Phrase System Integration Test Complete');
}

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

testSecretPhraseIntegration().catch(console.error);
