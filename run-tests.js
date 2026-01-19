// run-tests.js - Simple test runner
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting NBA Backend Integration Tests...\n');

// Check if the server is running
async function checkServer() {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:3002/health');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server is running: ${data.status}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running on http://localhost:3002');
    console.log('   Please start your server with: npm run dev');
    return false;
  }
}

// Run Mocha tests
async function runTests() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n💡 Tip: Start your server first, then run tests.');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  console.log('\n🧪 Running integration tests...\n');
  
  // Run mocha with ES module support
  const mochaProcess = spawn('npx', [
    'mocha',
    'test/integration/app-flow.test.js',
    '--timeout',
    '10000',
    '--exit',
    '--reporter',
    'spec'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });
  
  mochaProcess.on('close', (code) => {
    console.log(`\n📊 Test process exited with code: ${code}`);
    process.exit(code);
  });
}

runTests().catch(console.error);
