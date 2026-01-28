// Fix Mongoose connection options
const fs = require('fs');
const path = require('path');

console.log('Fixing Mongoose connection issues...');

// Files that likely contain Mongoose connections
const filesToCheck = [
  'server.js',
  'models/index.js',
  'services/databaseService.js',
  'utils/db.js'
];

filesToCheck.forEach(file => {
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
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${file}`);
    }
  }
});

// Also check package.json for Mongoose version
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (packageJson.dependencies.mongoose) {
    console.log(`Current Mongoose version: ${packageJson.dependencies.mongoose}`);
    console.log('Note: Mongoose 6+ removes useNewUrlParser and useUnifiedTopology options');
  }
}

console.log('Database connection fix complete!');
console.log('Try running: node test-db-connection.js');
