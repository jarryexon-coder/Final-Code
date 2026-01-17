// test-local.js
import http from 'http';

const tests = [
  { method: 'GET', path: '/api/kalshi/health' },
  { 
    method: 'POST', 
    path: '/api/kalshi/predictions/generate',
    body: JSON.stringify({ prompt: 'Test', sport: 'NBA', includeKalshi: true })
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
    console.log(`\n${test.method} ${test.path}:`);
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  if (test.body) {
    req.write(test.body);
  }
  req.end();
});
