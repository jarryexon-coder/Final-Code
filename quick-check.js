import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const criticalDirs = [
  'controllers',
  'routes',
  'models', 
  'middleware',
  'services',
  'config',
  'utils',
  'websocket'
];

console.log('🔍 Checking critical directories...\n');

let totalFiles = 0;
let commonJSFiles = 0;

for (const dir of criticalDirs) {
  try {
    const files = readdirSync(dir);
    let dirTotal = 0;
    let dirCommonJS = 0;
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = join(dir, file);
        try {
          const content = readFileSync(filePath, 'utf8');
          dirTotal++;
          totalFiles++;
          
          if (/require\(|module\.exports|exports\./.test(content)) {
            dirCommonJS++;
            commonJSFiles++;
            console.log(`  ❌ ${filePath}`);
          }
        } catch (error) {
          // Skip unreadable files
        }
      }
    }
    
    if (dirTotal > 0) {
      const percent = Math.round((1 - dirCommonJS/dirTotal) * 100);
      console.log(`📂 ${dir}: ${dirCommonJS}/${dirTotal} CommonJS (${percent}% converted)\n`);
    }
  } catch (error) {
    // Directory doesn't exist
  }
}

console.log(`\n📊 OVERALL: ${commonJSFiles}/${totalFiles} CommonJS in critical directories`);
console.log(`   ${Math.round((1 - commonJSFiles/totalFiles) * 100)}% converted\n`);

if (commonJSFiles === 0) {
  console.log('🎉 All critical files are now ES modules!');
  console.log('💡 You can now safely delete *.backup files');
}
