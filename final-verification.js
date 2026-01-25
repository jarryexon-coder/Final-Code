import fs from 'fs';
import path from 'path';

console.log('🔍 FINAL VERIFICATION CHECK\n');

const criticalDirs = ['routes', 'models', 'middleware', 'services', 'utils', 'controllers'];
let allPassed = true;

for (const dir of criticalDirs) {
  if (!fs.existsSync(dir)) continue;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let dirPassed = true;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (/require\(|module\.exports|exports\./.test(content)) {
      console.log(`❌ ${filePath} - Still has CommonJS`);
      dirPassed = false;
      allPassed = false;
    }
  }
  
  if (dirPassed) {
    console.log(`✅ ${dir}/ - All files are ES modules`);
  }
}

if (allPassed) {
  console.log('\n🎉 CONGRATULATIONS!');
  console.log('All critical backend files are now ES modules!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run tests: npm test');
  console.log('   2. Start server: npm start');
  console.log('   3. Delete backup files when confirmed working');
} else {
  console.log('\n⚠️  Some files still need conversion.');
  console.log('Run: node final-convert.js to fix remaining files');
}
