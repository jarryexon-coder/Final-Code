import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking route files...\n');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir);

files.forEach(file => {
  console.log(`📄 ${file}`);
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for router definitions
  const routeMatches = content.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)/g);
  if (routeMatches) {
    routeMatches.forEach(match => {
      console.log(`  ${match}`);
    });
  }
  console.log('');
});
