import { readFileSync, writeFileSync } from 'fs';

const files = [
  'middleware/cacheMiddleware.js',
  'middleware/rateLimit.js',
  'middleware/rateLimitMiddleware.js',
  'config/database.js',
  'config/firebase-admin.js',
  'websocket/server.js',
  'utils/dbUtils.js'
];

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8');
    
    // Common patterns
    content = content.replace(/const (\w+) = require\('([^']+)'\);/g, "import $1 from '$2';");
    content = content.replace(/module\.exports = (\w+);/g, "export default $1;");
    content = content.replace(/module\.exports = \{\};/g, "export default {};");
    content = content.replace(/require\('dotenv'\)\.config\(\);/g, "import 'dotenv/config';");
    
    // Specific fixes
    content = content.replace(
      /const \{ Pool \} = require\('pg'\);/,
      "import { Pool } from 'pg';"
    );
    
    content = content.replace(
      /const NodeCache = require\('node-cache'\);/,
      "import NodeCache from 'node-cache';"
    );
    
    writeFileSync(file + '.backup', readFileSync(file, 'utf8'));
    writeFileSync(file, content);
    console.log(`✅ Converted ${file}`);
  } catch (error) {
    console.log(`⚠️  Skipped ${file}: ${error.message}`);
  }
}
