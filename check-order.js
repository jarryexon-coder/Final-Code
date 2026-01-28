const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

console.log('Checking order of execution...\n');

let foundLoadRoutes = false;
let foundSetupHealth = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setupRouterHealthEndpoints();')) {
    console.log(`Line ${i}: ${lines[i]}`);
    foundSetupHealth = true;
  }
  
  if (lines[i].includes('await loadRoutes();')) {
    console.log(`Line ${i}: ${lines[i]}`);
    foundLoadRoutes = true;
  }
}

console.log('\nAnalysis:');
console.log(`Found setupRouterHealthEndpoints: ${foundSetupHealth}`);
console.log(`Found loadRoutes: ${foundLoadRoutes}`);

if (foundSetupHealth && foundLoadRoutes) {
  // Check which comes first
  const setupIndex = content.indexOf('setupRouterHealthEndpoints();');
  const loadIndex = content.indexOf('await loadRoutes();');
  
  if (setupIndex < loadIndex) {
    console.log('✅ CORRECT: Health endpoints setup BEFORE loadRoutes');
  } else {
    console.log('❌ PROBLEM: Health endpoints setup AFTER loadRoutes');
    console.log('This is why /api/fantasy returns 404!');
  }
}
