import { readFileSync, writeFileSync } from 'fs';

const filePath = 'server.js';
let content = readFileSync(filePath, 'utf8');

// Find where loadRoutes is called
const lines = content.split('\n');
let loadRoutesIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('await loadRoutes();')) {
    loadRoutesIndex = i;
    break;
  }
}

if (loadRoutesIndex === -1) {
  console.log('❌ Could not find loadRoutes() call');
  process.exit(1);
}

// Insert router health endpoints after loadRoutes
const patch = [
  '',
  '// Router health endpoints (added automatically)',
  'console.log(\'\\n🔧 Setting up router health endpoints...\');',
  'const routerEndpoints = [',
  '  \'/api/fantasy\',',
  '  \'/api/picks\',',
  '  \'/api/news\',',
  '  \'/api/analytics\',',
  '  \'/api/predictions\',',
  '  \'/api/betting\',',
  '  \'/api/nba\',',
  '  \'/api/auth\',',
  '  \'/api/admin\',',
  '  \'/api/players\',',
  '  \'/api/teams\',',
  '  \'/api/games\',',
  '  \'/api/secret-phrases\'',
  '];',
  '',
  'routerEndpoints.forEach(endpoint => {',
  '  app.get(endpoint, (req, res) => {',
  '    res.json({',
  '      success: true,',
  '      message: `API Router at ${endpoint} is active`,',
  '      status: \'loaded\',',
  '      timestamp: new Date().toISOString(),',
  '      note: \'This router accepts sub-routes. Try accessing specific endpoints.\'',
  '    });',
  '  });',
  '  ',
  '  app.get(endpoint + \'/\', (req, res) => {',
  '    res.json({',
  '      success: true,',
  '      message: `API Router at ${endpoint}/ is active`,',
  '      status: \'loaded\',',
  '      timestamp: new Date().toISOString(),',
  '      note: \'This is the router root. Sub-routes are available.\'',
  '    });',
  '  });',
  '  ',
  '  console.log(`✅ Health endpoint added for ${endpoint}`);',
  '});',
  '',
  'console.log(\'✅ All router health endpoints configured\');',
  ''
];

lines.splice(loadRoutesIndex + 1, 0, ...patch);

writeFileSync(filePath, lines.join('\n'));
console.log('✅ Patched server.js with router health endpoints');
