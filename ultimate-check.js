import fs from 'fs';
import path from 'path';

console.log('🏁 ULTIMATE BACKEND CHECK\n');

const criticalDirs = ['routes', 'models', 'middleware', 'services', 'controllers', 'utils'];
const ignoreFiles = ['.js', 'auth-backup.js', 'nba-backup.js', 'stubRoutes.js']; // Backup files can stay as-is

let totalChecked = 0;
let totalPassed = 0;

criticalDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .filter(f => !ignoreFiles.includes(f));
  
  console.log(`📂 ${dir}/ (${files.length} files)`);
  
  files.forEach(file => {
    totalChecked++;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (/require\(|module\.exports|exports\./.test(content)) {
      console.log(`  ❌ ${file} - STILL HAS CommonJS`);
      
      // Show the problematic lines
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/require\(|module\.exports|exports\./.test(line)) {
          console.log(`     Line ${i + 1}: ${line.trim().substring(0, 60)}...`);
        }
      });
    } else {
      totalPassed++;
      console.log(`  ✅ ${file}`);
    }
  });
  console.log('');
});

console.log('='.repeat(50));
console.log(`📊 RESULTS: ${totalPassed}/${totalChecked} files are pure ES modules`);
console.log(`🎯 ${Math.round((totalPassed/totalChecked)*100)}% conversion complete`);

if (totalPassed === totalChecked) {
  console.log('\n🎉 CONGRATULATIONS! Your backend is fully ES modules!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm test');
  console.log('   2. Start server: npm start');
  console.log('   3. Monitor for any runtime errors');
  console.log('   4. Delete backup files when confident:');
  console.log('      find . -name "*.backup" -type f -delete');
  console.log('      find . -name "*.needs-fix.md" -type f -delete');
} else {
  const remaining = totalChecked - totalPassed;
  console.log(`\n⚠️  ${remaining} files still need conversion.`);
  console.log('   Run the targeted fix scripts above.');
}
