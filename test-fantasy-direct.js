import fetch from 'node-fetch';

async function test() {
  console.log('Testing fantasy endpoints directly:\n');
  
  // Test different variations
  const tests = [
    'http://localhost:3002/api/fantasy',
    'http://localhost:3002/api/fantasy/',
    'http://localhost:3002/api/fantasy/players',
    'http://localhost:3002/api/fantasy/players?limit=5',
    'http://localhost:3002/api/fantasy/ai-advice',
  ];
  
  for (const url of tests) {
    try {
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: 'No JSON' }));
      
      console.log(`${url}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Success: ${data.success !== undefined ? data.success : 'N/A'}`);
      console.log(`  Message: ${data.message || data.error || 'No message'}`);
      console.log('');
    } catch (error) {
      console.log(`${url}`);
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

test();
