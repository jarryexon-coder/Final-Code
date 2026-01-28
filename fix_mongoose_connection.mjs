// Fix Mongoose connection issues (ES Module version)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Fixing Mongoose connection issues...');

// Files that likely contain Mongoose connections
const filesToCheck = [
  'server.js',
  'models/index.js',
  'services/databaseService.js',
  'utils/db.js',
  'config/database.js'
];

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Fix deprecated Mongoose options
    if (content.includes('useNewUrlParser')) {
      content = content.replace(/useNewUrlParser:\s*true\s*,?\s*/g, '');
      changed = true;
    }
    if (content.includes('useUnifiedTopology')) {
      content = content.replace(/useUnifiedTopology:\s*true\s*,?\s*/g, '');
      changed = true;
    }
    
    // Also fix any mongoose.connect() calls with old options
    if (content.includes('mongoose.connect(')) {
      content = content.replace(
        /mongoose\.connect\([^)]*\)/g,
        match => match.replace(/\s*,\s*{\s*useNewUrlParser:\s*true\s*,\s*useUnifiedTopology:\s*true\s*}\s*\)/, ')')
      );
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${file}`);
    }
  }
}

console.log('Database connection fix complete!');
