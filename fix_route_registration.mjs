import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

console.log('Fixing route registration in server.js...');

// List of routes that should exist
const expectedRoutes = [
  'players',
  'teams', 
  'games',
  'auth',
  'admin',
  'secret-phrases',
  'analytics',
  'betting',
  'predictions'
];

// Check what route files actually exist
const routesDir = path.join(__dirname, 'routes');
const existingRoutes = fs.readdirSync(routesDir)
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace('.js', ''));

console.log('Existing route files:', existingRoutes);

// Add missing imports
let importSection = '';
let routeRegistration = '';

existingRoutes.forEach(route => {
  // Check if import exists
  const importPattern = new RegExp(`import.*${route}.*from.*['"]\\./routes/${route}['"]`);
  if (!content.match(importPattern)) {
    importSection += `import ${route}Routes from './routes/${route}.js';\n`;
    console.log(`✓ Added import for ${route}Routes`);
  }
  
  // Check if route is registered
  const usePattern = new RegExp(`app\\.use\\(['"]/api/${route}['"]`);
  if (!content.match(usePattern)) {
    routeRegistration += `app.use('/api/${route}', ${route}Routes);\n`;
    console.log(`✓ Will register /api/${route}`);
  }
});

// Insert imports after other imports
if (importSection) {
  // Find the last import statement
  const importEnd = content.lastIndexOf('import');
  const importLineEnd = content.indexOf('\n', importEnd);
  
  // Insert new imports
  content = content.slice(0, importLineEnd + 1) + 
            importSection + 
            content.slice(importLineEnd + 1);
}

// Insert route registration after other route registrations
if (routeRegistration) {
  // Find a good place to insert (after other app.use() calls for routes)
  const usePattern = /app\.use\(['"]\/api\/\w+['"]/g;
  const lastMatch = [...content.matchAll(usePattern)].pop();
  
  if (lastMatch) {
    const insertPos = content.indexOf('\n', lastMatch.index + lastMatch[0].length);
    content = content.slice(0, insertPos + 1) + 
              routeRegistration + 
              content.slice(insertPos + 1);
  } else {
    // If no routes registered yet, add after middleware but before error handling
    const middlewareEnd = content.indexOf('// Error handling');
    if (middlewareEnd > 0) {
      content = content.slice(0, middlewareEnd) + 
                '\n// API Routes\n' + routeRegistration + '\n' +
                content.slice(middlewareEnd);
    }
  }
}

// Write updated content
fs.writeFileSync(serverFile, content);
console.log('\n✓ Updated server.js with route imports and registration');
console.log('\nRestart your server with: npm start');
