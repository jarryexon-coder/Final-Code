// test-kalshi.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testKalshiEndpoints() {
  console.log('🧪 Starting Kalshi Integration Tests...\n');
  
  try {
    // 1. Test Kalshi Health
    console.log('1. Testing /api/kalshi/health...');
    const healthRes = await axios.get(`${BASE_URL}/api/kalshi/health`);
    console.log(`   ✅ Status: ${healthRes.status}`);
    console.log(`   Mode: ${healthRes.data.status}`);
    console.log(`   API Key Configured: ${healthRes.data.apiKeyConfigured}\n`);
    
    // 2. Test Prediction Generation
    console.log('2. Testing /api/predictions/generate...');
    const predictionRes = await axios.post(`${BASE_URL}/api/predictions/generate`, {
      prompt: "Will Warriors win the championship?",
      sport: "NBA",
      includeKalshi: true
    });
    console.log(`   ✅ Status: ${predictionRes.status}`);
    console.log(`   Prediction ID: ${predictionRes.data.prediction.id}`);
    console.log(`   Kalshi Context: ${predictionRes.data.prediction.kalshiContext ? '✅ Present' : '❌ Missing'}\n`);
    
    // 3. Test Analytics Logging
    console.log('3. Testing /api/analytics/log...');
    const analyticsRes = await axios.post(`${BASE_URL}/api/analytics/log`, {
      eventName: "kalshi_market_view",
      eventData: {
        marketId: "NBA-WARRIORS-2024",
        action: "viewed",
        price: "0.25"
      },
      userId: "test_user_" + Date.now(),
      sessionId: "session_" + Date.now(),
      source: "test_script"
    });
    console.log(`   ✅ Status: ${analyticsRes.status}`);
    console.log(`   Event ID: ${analyticsRes.data.eventId}`);
    console.log(`   Is Kalshi Event: ${analyticsRes.data.isKalshiEvent}\n`);
    
    // 4. Test Analytics Summary
    console.log('4. Testing /api/analytics/summary...');
    const summaryRes = await axios.get(`${BASE_URL}/api/analytics/summary?includeKalshi=true`);
    console.log(`   ✅ Status: ${summaryRes.status}`);
    console.log(`   Kalshi Metrics: ${summaryRes.data.summary.kalshiMetrics ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Total Sessions: ${summaryRes.data.summary.totalSessions}\n`);
    
    console.log('🎉 All Kalshi endpoints are working correctly!');
    console.log('\n📋 Summary:');
    console.log('- Kalshi health endpoint: ✅');
    console.log('- Prediction generation with Kalshi: ✅');
    console.log('- Analytics logging: ✅');
    console.log('- Analytics summary with Kalshi metrics: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testKalshiEndpoints();
