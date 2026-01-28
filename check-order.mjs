import { readFileSync } from 'fs';

const content = readFileSync('server.js', 'utf8');
const lines = content.split('\n');

console.log('🔍 Checking execution order...\n');

// Find key lines
let setupDefLine = -1;
let setupCallLine = -1;
let loadRoutesCallLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const setupRouterHealthEndpoints = () =>')) {
    setupDefLine = i + 1;
  }
  if (lines[i].includes('setupRouterHealthEndpoints();')) {
    setupCallLine = i + 1;
  }
  if (lines[i].includes('await loadRoutes();')) {
    loadRoutesCallLine = i + 1;
  }
}

console.log(`Line ${setupDefLine}: setupRouterHealthEndpoints defined`);
console.log(`Line ${setupCallLine}: setupRouterHealthEndpoints called`);
console.log(`Line ${loadRoutesCallLine}: loadRoutes called`);

if (setupCallLine > 0 && loadRoutesCallLine > 0) {
  if (setupCallLine < loadRoutesCallLine) {
    console.log('\n✅ CORRECT: Health endpoints setup BEFORE loadRoutes');
  } else {
    console.log('\n❌ PROBLEM: Health endpoints setup AFTER loadRoutes');
    console.log('Express will process the router first, causing 404 for /api/fantasy');
  }
}

// Show context
console.log('\n📋 Context around loadRoutes call:');
for (let i = Math.max(0, loadRoutesCallLine - 3); i < Math.min(lines.length, loadRoutesCallLine + 3); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
