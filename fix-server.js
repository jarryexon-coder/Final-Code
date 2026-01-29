const fs = require('fs');

// Read the server.js file
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

// Find the 404 handler (app.use('*', ...))
let start404 = -1;
let end404 = -1;
let in404 = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("app.use('*'") || lines[i].includes('app.use("*"')) {
    start404 = i;
    in404 = true;
  }
  if (in404 && lines[i].trim() === '});' && i > start404) {
    end404 = i;
    break;
  }
}

if (start404 !== -1 && end404 !== -1) {
  console.log(`Found 404 handler at lines ${start404+1} to ${end404+1}`);
  
  // Comment out the 404 handler
  for (let i = start404; i <= end404; i++) {
    if (!lines[i].startsWith('//')) {
      lines[i] = '// ' + lines[i];
    }
  }
  
  // Add new 404 handler after routes are loaded
  // Find where to insert it (after console.log with "Routes loaded")
  let insertPoint = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Routes loaded:')) {
      insertPoint = i + 1;
      break;
    }
  }
  
  if (insertPoint === -1) {
    insertPoint = lines.length - 1;
  }
  
  const new404 = [
    '',
    '    // ====================',
    '    // 404 HANDLER (MUST BE AFTER ALL ROUTES!)',
    '    // ====================',
    '    app.use(\'*\', (req, res) => {',
    '      console.log(`❌ 404: ${req.method} ${req.originalUrl}`);',
    '      res.status(404).json({',
    '        success: false,',
    '        error: \'Endpoint not found\',',
    '        path: req.originalUrl,',
    '        availableEndpoints: [',
    '          \'/health\',',
    '          \'/api/health\',',
    '          \'/api/auth\',',
    '          \'/api/nba\',',
    '          \'/api/players\',',
    '          \'/api/fantasy\'',
    '        ]',
    '      });',
    '    });',
    ''
  ];
  
  // Insert the new 404 handler
  lines.splice(insertPoint, 0, ...new404);
  
  // Write the fixed file
  fs.writeFileSync('server-fixed.js', lines.join('\n'));
  console.log('✅ Created server-fixed.js with the fix!');
  console.log('Run: node server-fixed.js');
} else {
  console.log('❌ Could not find 404 handler in server.js');
}
