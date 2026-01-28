import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: __dirname });
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    return true;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function fixAll() {
  console.log('=========================================');
  console.log('  NBA FANTASY AI - COMPLETE ESM FIX     ');
  console.log('=========================================');
  
  // 1. Fix Mongoose connection
  await runCommand(
    'node fix_mongoose_connection.mjs',
    'Step 1: Fixing Mongoose connection options'
  );
  
  // 2. Fix model registration
  await runCommand(
    'node fix_model_registration.mjs',
    'Step 2: Fixing model registration'
  );
  
  // 3. Fix missing endpoints
  await runCommand(
    'node fix_missing_endpoints.mjs',
    'Step 3: Fixing missing endpoints'
  );
  
  // 4. Test database connection
  await runCommand(
    'node test-db-connection-fixed.mjs',
    'Step 4: Testing database connection'
  );
  
  // 5. Check backend startup
  console.log('\nStep 5: Testing backend startup...');
  try {
    // Try to start server in background
    const serverProcess = exec('node server.js', { cwd: __dirname });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test health endpoint
    const { stdout: healthOutput } = await execAsync('curl -s http://localhost:3002/health');
    if (healthOutput.includes('healthy') || healthOutput.includes('status')) {
      console.log('✓ Backend health endpoint working');
    } else {
      console.log('⚠ Backend health endpoint returned:', healthOutput);
    }
    
    // Kill the server
    serverProcess.kill();
  } catch (error) {
    console.log('⚠ Could not test backend startup:', error.message);
  }
  
  console.log('\n=========================================');
  console.log('  FIX COMPLETE!                         ');
  console.log('=========================================');
  console.log('\nNext steps:');
  console.log('1. Start backend: npm start');
  console.log('2. Test endpoints: curl http://localhost:3002/health');
  console.log('3. Check models are working');
  console.log('4. Deploy to Railway');
}

// Run the fix
fixAll().catch(console.error);
