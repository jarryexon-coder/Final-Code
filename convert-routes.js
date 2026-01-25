import { readFileSync, writeFileSync } from 'fs';

const routes = [
  'routes/admin.js',
  'routes/analytics.js',
  'routes/auth.js',
  'routes/betting.js',
  'routes/fantasyTeams.js',
  'routes/favorites.js',
  'routes/nba.js',
  'routes/news.js'
];

for (const route of routes) {
  try {
    let content = readFileSync(route, 'utf8');
    
    // Pattern 1: const express = require('express');
    content = content.replace(
      /const express = require\('express'\);/g,
      'import express from \'express\';'
    );
    
    // Pattern 2: const router = express.Router();
    content = content.replace(
      /const router = express\.Router\(\);/g,
      'const router = express.Router();'
    );
    
    // Pattern 3: const Model = require('../models/Model');
    content = content.replace(
      /const (\w+) = require\('\.\.\/models\/(\w+)'\);/g,
      'import $1 from \'../models/$2.js\';'
    );
    
    // Pattern 4: module.exports = router;
    content = content.replace(
      /module\.exports = router;/g,
      'export default router;'
    );
    
    // Pattern 5: Other requires
    content = content.replace(
      /const (\{?[\w\s{},]+\}?) = require\('([^']+)'\);/g,
      (match, vars, modulePath) => {
        if (modulePath.startsWith('.')) {
          return `import ${vars} from '${modulePath}.js';`;
        }
        return `import ${vars} from '${modulePath}';`;
      }
    );
    
    writeFileSync(route + '.backup', content);
    writeFileSync(route, content);
    console.log(`✅ Converted ${route}`);
  } catch (error) {
    console.log(`⚠️  Skipped ${route}: ${error.message}`);
  }
}
