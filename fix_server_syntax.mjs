import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

console.log('Fixing syntax errors in server.js...');

// Fix 1: Remove the problematic line with invalid identifier
content = content.replace(
  /app\.use\('\/api\/livegames\.backup\.\d+', livegames\.backup\.\d+Routes\);/g,
  '// Removed invalid route registration'
);

// Fix 2: Also check for any other invalid identifiers
const invalidPattern = /app\.use\(['"]\/api\/[^'"]+['"],\s*([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)+)Routes\);/g;
content = content.replace(invalidPattern, (match, identifier) => {
  console.log(`⚠ Found invalid route identifier: ${identifier}`);
  return `// Invalid route removed: ${identifier}`;
});

// Fix 3: Clean up any duplicate or malformed imports
// Remove imports for files that don't exist
const importsToRemove = [
  'livegames.backup',
  'backup',
  'backup.1765918689'
];

importsToRemove.forEach(importName => {
  const importPattern = new RegExp(`import.*${importName}.*from.*['"][^'"]+['"];?\\n?`, 'g');
  content = content.replace(importPattern, '');
});

// Fix 4: Clean up any empty lines or multiple newlines
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

// Write the fixed content
fs.writeFileSync(serverFile, content);
console.log('✓ Fixed syntax errors in server.js');

// Also create a backup
const backupFile = path.join(__dirname, `server.js.backup.${Date.now()}`);
fs.writeFileSync(backupFile, content);
console.log(`✓ Backup created: ${backupFile}`);
