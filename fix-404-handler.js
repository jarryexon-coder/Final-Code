import { readFileSync, writeFileSync } from 'fs';

const filePath = 'server-final-production.js';
let content = readFileSync(filePath, 'utf8');

console.log('🔧 Fixing 404 handler to allow router sub-routes...');

// Find the 404 handler section
const startMarker = '// ====================';
const endMarker = '// ====================';

const lines = content.split('\n');
const newLines = [];
let in404Handler = false;
let found404Handler = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find the 404 handler
  if (line.includes('// 404 HANDLER') || line.includes('app.use(\'*\'')) {
    in404Handler = true;
    found404Handler = true;
    
    // Replace the entire 404 handler with a better version
    newLines.push('// ====================');
    newLines.push('// 404 HANDLER - IMPROVED');
    newLines.push('// ====================');
    newLines.push('app.use(\'*\', (req, res) => {');
    newLines.push('  const requestedPath = req.originalUrl;');
    newLines.push('  ');
    newLines.push('  // Check if this might be a router path');
    newLines.push('  // Common router paths that have sub-routes');
    newLines.push('  const routerPaths = [');
    newLines.push('    \'/api/fantasy\',');
    newLines.push('    \'/api/picks\',');
    newLines.push('    \'/api/news\',');
    newLines.push('    \'/api/nba\',');
    newLines.push('    \'/api/auth\',');
    newLines.push('    \'/api/admin\',');
    newLines.push('    \'/api/analytics\',');
    newLines.push('    \'/api/predictions\',');
    newLines.push('    \'/api/secret-phrases\',');
    newLines.push('    \'/api/betting\'');
    newLines.push('  ];');
    newLines.push('  ');
    newLines.push('  const isRouterPath = routerPaths.some(routerPath =>');
    newLines.push('    requestedPath.startsWith(routerPath) && requestedPath !== routerPath');
    newLines.push('  );');
    newLines.push('  ');
    newLines.push('  if (isRouterPath) {');
    newLines.push('    // It\'s a router sub-route that wasn\'t found');
    newLines.push('    res.status(404).json({');
    newLines.push('      success: false,');
    newLines.push('      error: `Router sub-route not found: ${requestedPath}`');
    newLines.push('    });');
    newLines.push('  } else {');
    newLines.push('    // Standard 404');
    newLines.push('    res.status(404).json({');
    newLines.push('      success: false,');
    newLines.push('      error: \'Endpoint not found\',');
    newLines.push('      path: requestedPath,');
    newLines.push('      availableEndpoints: [');
    newLines.push('        \'/health\',');
    newLines.push('        \'/api/health\',');
    newLines.push('        \'/api/nba\',');
    newLines.push('        \'/api/auth\',');
    newLines.push('        \'/api/players\',');
    newLines.push('        \'/api/teams\',');
    newLines.push('        \'/api/games\',');
    newLines.push('        \'/api/predictions\',');
    newLines.push('        \'/api/fantasy\',');
    newLines.push('        \'/api/admin\',');
    newLines.push('        \'/api/secret-phrases\',');
    newLines.push('        \'/api/analytics\',');
    newLines.push('        \'/api/betting\'');
    newLines.push('      ],');
    newLines.push('      note: \'Router endpoints support sub-routes (e.g., /api/fantasy/players)\'');
    newLines.push('    });');
    newLines.push('  }');
    newLines.push('});');
    newLines.push('');
    
    // Skip the old 404 handler lines
    while (i < lines.length && !lines[i].includes('// ====================')) {
      i++;
    }
    continue;
  }
  
  if (!in404Handler) {
    newLines.push(line);
  }
}

if (!found404Handler) {
  console.log('❌ Could not find 404 handler');
  process.exit(1);
}

writeFileSync(filePath, newLines.join('\n'));
console.log('✅ Fixed 404 handler to properly handle router sub-routes');
