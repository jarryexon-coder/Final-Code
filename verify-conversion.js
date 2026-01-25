import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const checkDir = (dir, depth = 0) => {
  const files = readdirSync(dir);
  let total = 0;
  let commonJS = 0;
  
  for (const file of files) {
    const fullPath = join(dir, file);
    
    try {
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git'].includes(file) && depth < 3) {
        const result = checkDir(fullPath, depth + 1);
        total += result.total;
        commonJS += result.commonJS;
      } else if (file.endsWith('.js')) {
        total++;
        const content = readFileSync(fullPath, 'utf8');
        if (/require\(|module\.exports|exports\./.test(content)) {
          commonJS++;
          if (commonJS < 10) { // Show first 10
            console.log(`  ❌ ${fullPath}`);
          }
        }
      }
    } catch (error) {
      // Skip
    }
  }
  
  return { total, commonJS };
};

console.log('🔍 Checking for remaining CommonJS...\n');
const { total, commonJS } = checkDir('.');
console.log(`\n📊 Results: ${commonJS}/${total} files still have CommonJS`);
console.log(`   ${Math.round((1 - commonJS/total) * 100)}% converted to ES modules`);
