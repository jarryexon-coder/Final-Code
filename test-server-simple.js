// test-server-simple.js
const API_URL = 'http://localhost:3002';

async function testServer() {
  console.log('Testing server connection...\n');
  
  try {
    // Test 1: Basic server response
    console.log('1. Testing server root...');
    const rootRes = await fetch(API_URL);
    const rootText = await rootRes.text();
    console.log(`   Status: ${rootRes.status}`);
    console.log(`   Content-Type: ${rootRes.headers.get('content-type')}`);
    console.log(`   First 100 chars: ${rootText.substring(0, 100)}...`);
    
    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthRes = await fetch(`${API_URL}/health`);
    const healthText = await healthRes.text();
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Response: ${healthText}`);
    
    // Test 3: Check if it's HTML
    if (healthText.includes('<!DOCTYPE') || healthText.includes('<html')) {
      console.log('\n⚠️ WARNING: Server is returning HTML, not JSON!');
      console.log('This could mean:');
      console.log('  1. Wrong port (maybe it\'s running on a different port)');
      console.log('  2. Wrong server (maybe another app is running on 3002)');
      console.log('  3. Server error causing HTML error page');
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\nPossible reasons:');
    console.log('  1. Server is not running');
    console.log('  2. Server is on a different port');
    console.log('  3. Firewall blocking connection');
  }
}

testServer();
