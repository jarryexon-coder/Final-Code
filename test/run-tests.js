// test/run-tests.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}🚀 NBA Fantasy AI Backend Test Runner${colors.reset}`);
console.log(`${colors.cyan}=======================================${colors.reset}\n`);

// Check if server is running
async function checkServerHealth() {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:3002/api/health');
    const data = await response.json();
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run a specific test
function runTest(testFile, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}▶️  Running: ${testFile}${colors.reset}`);
    
    const envVars = {
      ...process.env,
      ...env,
      NODE_ENV: 'test',
      NODE_NO_WARNINGS: '1'
    };
    
    const testProcess = spawn('node', [
      '--experimental-vm-modules',
      '--no-warnings',
      join(__dirname, 'integration', testFile)
    ], {
      env: envVars,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✅ ${testFile} passed${colors.reset}\n`);
        resolve({ success: true, output, errorOutput });
      } else {
        console.log(`${colors.red}❌ ${testFile} failed with code ${code}${colors.reset}\n`);
        reject(new Error(`Test failed with code ${code}: ${errorOutput}`));
      }
    });
  });
}

// Main test runner
async function runAllTests() {
  const tests = [
    'app-flow.test.js'
  ];
  
  let passed = 0;
  let failed = 0;
  const startTime = Date.now();
  
  try {
    // Check if server is running
    console.log(`${colors.yellow}🔄 Checking server health...${colors.reset}`);
    const isHealthy = await checkServerHealth();
    
    if (!isHealthy) {
      console.log(`${colors.yellow}⚠️  Server not running. Starting test server...${colors.reset}`);
      
      // Start the server in test mode
      const { default: app } = await import('../server.js');
      const testServer = app.listen(3003, () => {
        console.log(`${colors.green}✅ Test server started on port 3003${colors.reset}`);
      });
      
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Run each test
    for (const testFile of tests) {
      try {
        await runTest(testFile);
        passed++;
      } catch (error) {
        failed++;
        console.error(`${colors.red}Error in ${testFile}:${colors.reset}`, error.message);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`${colors.cyan}📊 Test Summary:${colors.reset}`);
    console.log(`${colors.cyan}===============${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.blue}⏱️  Duration: ${duration}s${colors.reset}`);
    console.log(`${colors.cyan}================${colors.reset}`);
    
    if (failed > 0) {
      console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error(`${colors.red}💥 Test runner error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
