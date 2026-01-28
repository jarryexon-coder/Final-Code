import fetch from 'node-fetch';

async function testProduction() {
  console.log('🧪 TESTING PRODUCTION SERVER\n');
  
  const tests = [
    { url: 'http://localhost:3002/health', expected: 200, name: 'Health' },
    { url: 'http://localhost:3002/api/health', expected: 200, name: 'API Health' },
    { url: 'http://localhost:3002/api/fantasy', expected: 200, name: 'Fantasy Root' },
    { url: 'http://localhost:3002/api/fantasy/players', expected: 200, name: 'Fantasy Players' },
    { url: 'http://localhost:3002/api/fantasy/ai-advice', expected: 200, name: 'Fantasy AI Advice' },
    { url: 'http://localhost:3002/api/picks', expected: 200, name: 'Picks API' },
    { url: 'http://localhost:3002/api/news', expected: 200, name: 'News API' },
    { url: 'http://localhost:3002/api/nba', expected: 200, name: 'NBA API' },
    { url: 'http://localhost:3002/api/auth', expected: 200, name: 'Auth API' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const status = response.status;
      
      if (status === test.expected) {
        console.log(`✅ ${test.name} - HTTP ${status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected ${test.expected}, got ${status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 PRODUCTION SERVER IS READY!');
    console.log('🚀 All endpoints working correctly');
    console.log('📦 Ready for Railway deployment');
  } else {
    console.log(`\n⚠ ${failed} test(s) failed`);
  }
  console.log('='.repeat(50));
  
  process.exit(failed === 0 ? 0 : 1);
}

testProduction();
