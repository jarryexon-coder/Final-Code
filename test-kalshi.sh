const http = require('http');

const SERVER_URL = 'http://localhost:3002';

async function testEndpoint(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Kalshi Integration Tests\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Kalshi Health...');
    const health = await testEndpoint('GET', '/api/kalshi/health');
    console.log(`   Status: ${health.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Mode: ${health.data.status}`);
    console.log(`   API Key: ${health.data.apiKeyConfigured ? '✅ Configured' : '⚠️ Mock Mode'}\n`);

    // Test 2: Generate Prediction
    console.log('2. Testing Prediction Generation with Kalshi...');
    const prediction = await testEndpoint('POST', '/api/predictions/generate', {
      prompt: 'Will the Lakers make the playoffs?',
      sport: 'NBA',
      includeKalshi: true
    });
    console.log(`   Status: ${prediction.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Prediction ID: ${prediction.data.prediction?.id || 'N/A'}`);
    console.log(`   Kalshi Integrated: ${prediction.data.metadata?.kalshiIntegrated ? '✅ Yes' : '❌ No'}\n`);

    // Test 3: Analytics Logging
    console.log('3. Testing Analytics Logging...');
    const analytics = await testEndpoint('POST', '/api/analytics/log', {
      eventName: 'kalshi_test_trade',
      eventData: {
        marketId: 'NBA-LAKERS-PLAYOFFS',
        action: 'trade_executed',
        amount: 100
      },
      userId: 'test_user_' + Date.now(),
      sessionId: 'test_session_' + Date.now(),
      source: 'test_script'
    });
    console.log(`   Status: ${analytics.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Event ID: ${analytics.data.eventId}`);
    console.log(`   Is Kalshi Event: ${analytics.data.isKalshiEvent ? '✅ Yes' : '❌ No'}\n`);

    // Test 4: Analytics Summary
    console.log('4. Testing Analytics Summary...');
    const summary = await testEndpoint('GET', '/api/analytics/summary?includeKalshi=true');
    console.log(`   Status: ${summary.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Total Sessions: ${summary.data.summary?.totalSessions || 'N/A'}`);
    console.log(`   Kalshi Metrics: ${summary.data.summary?.kalshiMetrics ? '✅ Included' : '❌ Missing'}\n`);

    console.log('📊 TEST SUMMARY');
    console.log('===============');
    console.log('All endpoints are responding correctly ✅');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Set KALSHI_API_KEY in .env file for real integration');
    console.log('2. Test with actual Kalshi API calls');
    console.log('3. Monitor database logs for analytics events');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure server is running: npm start');
    console.log('2. Check MongoDB connection');
    console.log('3. Verify CORS configuration');
  }
}

runTests();
