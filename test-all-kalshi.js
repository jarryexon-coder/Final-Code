// test-all-kalshi.js
const http = require('http');

const tests = [
  {
    name: 'GET /api/kalshi/health',
    method: 'GET',
    path: '/api/kalshi/health'
  },
  {
    name: 'POST /api/predictions/generate',
    method: 'POST',
    path: '/api/predictions/generate',
    body: JSON.stringify({
      prompt: 'Test prediction',
      sport: 'NBA',
      includeKalshi: true
    })
  },
  {
    name: 'POST /api/analytics/log',
    method: 'POST',
    path: '/api/analytics/log',
    body: JSON.stringify({
      eventName: 'test_event',
      eventData: { marketId: 'TEST-123' },
      userId: 'test_user',
      sessionId: 'session_123',
      source: 'test'
    })
  },
  {
    name: 'GET /api/analytics/summary',
    method: 'GET',
    path: '/api/analytics/summary?includeKalshi=true'
  }
];

tests.forEach(test => {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: test.path,
    method: test.method,
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
      console.log(`\n${test.name}:`);
      console.log(`Status: ${res.statusCode}`);
      try {
        console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`\n${test.name}: ERROR - ${error.message}`);
  });

  if (test.body) {
    req.write(test.body);
  }
  req.end();
  
  // Add small delay between requests
  setTimeout(() => {}, 100);
});
