// check-imports.js
import { readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';

console.log('=== Checking for CommonJS imports ===\n');

const directories = ['routes', 'middleware', 'models', 'utils'];

for (const dir of directories) {
  try {
    const files = readdirSync(dir);
    console.log(`📁 ${dir}/:`);
    
    for (const file of files) {
      if (extname(file) === '.js') {
        const filePath = join(dir, file);
        const content = readFileSync(filePath, 'utf8');
        
        if (content.includes('require(')) {
          console.log(`  ❌ ${file}: Contains require()`);
          // Show the line with require
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('require(')) {
              console.log(`    Line ${index + 1}: ${line.trim().substring(0, 80)}...`);
            }
          });
        } else if (content.includes('import ') && content.includes('from ')) {
          console.log(`  ✅ ${file}: Uses ES modules`);
        }
      }
    }
    console.log('');
  } catch (error) {
    console.log(`  ⚠️ Cannot read directory ${dir}: ${error.message}\n`);
  }
}
