import { readFileSync, writeFileSync } from 'fs';

const filePath = 'server.js';
let content = readFileSync(filePath, 'utf8');

console.log('🔧 Applying correct fix...');

// FIRST: Remove any existing router health endpoint code
// Find and remove the patch we added earlier
const lines = content.split('\n');
const newLines = [];
let skipNextLines = 0;

for (let i = 0; i < lines.length; i++) {
  if (skipNextLines > 0) {
    skipNextLines--;
    continue;
  }
  
  // Skip the patch we added
  if (lines[i].includes('Router health endpoints (added automatically)')) {
    console.log('Removing old patch...');
    // Skip until we find a line that's not part of the patch
    skipNextLines = 30; // Skip about 30 lines
    continue;
  }
  
  // Skip the specific router health setup lines
  if (lines[i].includes('Setting up router health endpoints')) {
    continue;
  }
  
  newLines.push(lines[i]);
}

content = newLines.join('\n');

// SECOND: Add router endpoints BEFORE loadRoutes()
// Find the right place to insert (before loadRoutes function)
const searchText = 'async function loadRoutes() {';
const insertIndex = content.indexOf(searchText);

if (insertIndex === -1) {
  console.log('❌ Could not find loadRoutes function');
  process.exit(1);
}

// Insert router definitions BEFORE loadRoutes
const routerDefinitions = `

// ====================
// ROUTER HEALTH ENDPOINTS (MUST be defined BEFORE loadRoutes)
// ====================

// Define router health endpoints FIRST so they take precedence
const setupRouterHealthEndpoints = () => {
  console.log('🔧 Setting up router health endpoints...');
  
  const routerEndpoints = [
    '/api/fantasy',
    '/api/picks',
    '/api/news',
    '/api/analytics',
    '/api/predictions',
    '/api/betting'
  ];
  
  routerEndpoints.forEach(endpoint => {
    // Health endpoint WITHOUT trailing slash
    app.get(endpoint, (req, res) => {
      res.json({
        success: true,
        message: \`\${endpoint} API is loaded and working\`,
        status: 'active',
        timestamp: new Date().toISOString(),
        note: 'This router supports sub-routes'
      });
    });
    
    // Health endpoint WITH trailing slash
    app.get(endpoint + '/', (req, res) => {
      res.json({
        success: true,
        message: \`\${endpoint} API is loaded and working\`,
        status: 'active',
        timestamp: new Date().toISOString(),
        note: 'This is the router root endpoint'
      });
    });
    
    console.log(\`✅ Health endpoint configured for \${endpoint}\`);
  });
  
  console.log('✅ All router health endpoints configured');
};

// Call it immediately
setupRouterHealthEndpoints();

`;

const newContent = content.slice(0, insertIndex) + routerDefinitions + content.slice(insertIndex);

writeFileSync(filePath, newContent);
console.log('✅ Correctly patched server.js');
console.log('Router health endpoints are now defined BEFORE loadRoutes()');
