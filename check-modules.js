import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMONJS_PATTERNS = [
  /\brequire\s*\(/,
  /\bmodule\.exports\b/,
  /\bexports\.\w+\s*=/,
  /\bexports\s*=\s*/
];

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build'];
const IGNORE_FILES = ['check-modules.js'];

function isCommonJSFile(filePath, content) {
  // Check for CommonJS patterns in content
  return COMMONJS_PATTERNS.some(pattern => pattern.test(content));
}

function checkDirectory(dirPath, results) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        checkDirectory(fullPath, results);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      
      // Check .js and .cjs files
      if (ext === '.js' || ext === '.cjs') {
        if (IGNORE_FILES.includes(item)) continue;
        
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (isCommonJSFile(fullPath, content)) {
            // Check for .cjs extension (explicit CommonJS)
            if (ext === '.cjs') {
              results.cjsFiles.push({
                path: fullPath,
                issue: 'Has .cjs extension (explicit CommonJS)'
              });
            } else {
              results.commonJSInJS.push({
                path: fullPath,
                issue: 'Contains CommonJS syntax'
              });
            }
          }
          
          // Check for ES module syntax errors
          if (ext === '.js' && !isCommonJSFile(fullPath, content)) {
            // Check for potential ES module issues
            if (content.includes('import ') && !content.includes(' from ')) {
              results.potentialIssues.push({
                path: fullPath,
                issue: 'Possible malformed import statement'
              });
            }
          }
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error.message);
        }
      }
    }
  }
}

function main() {
  console.log('🔍 Scanning for CommonJS modules...\n');
  
  const results = {
    cjsFiles: [],        // .cjs files
    commonJSInJS: [],    // .js files with CommonJS syntax
    potentialIssues: []  // Other potential issues
  };
  
  const startDir = process.argv[2] || __dirname;
  console.log(`Starting scan in: ${startDir}\n`);
  
  checkDirectory(startDir, results);
  
  // Display results
  if (results.cjsFiles.length > 0) {
    console.log('❌ .cjs FILES (Explicit CommonJS):');
    results.cjsFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.path}`);
      console.log(`     Issue: ${file.issue}`);
    });
    console.log();
  }
  
  if (results.commonJSInJS.length > 0) {
    console.log('❌ .js FILES WITH COMMONJS SYNTAX:');
    results.commonJSInJS.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.path}`);
      console.log(`     Issue: ${file.issue}`);
      
      // Show a snippet of the problematic code
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n');
        const problemLine = lines.findIndex(line => 
          COMMONJS_PATTERNS.some(pattern => pattern.test(line))
        );
        
        if (problemLine !== -1 && problemLine < lines.length) {
          const start = Math.max(0, problemLine - 1);
          const end = Math.min(lines.length, problemLine + 2);
          console.log(`     Code snippet (lines ${start + 1}-${end}):`);
          for (let i = start; i < end; i++) {
            console.log(`       ${i + 1}: ${lines[i].trim()}`);
          }
        }
      } catch (e) {
        // Ignore errors in snippet display
      }
      console.log();
    });
  }
  
  if (results.potentialIssues.length > 0) {
    console.log('⚠️  POTENTIAL ISSUES:');
    results.potentialIssues.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.path}`);
      console.log(`     Note: ${file.issue}`);
    });
    console.log();
  }
  
  // Summary
  const totalIssues = results.cjsFiles.length + results.commonJSInJS.length;
  if (totalIssues === 0) {
    console.log('✅ No CommonJS modules found! Your backend is fully ES modules compliant.');
  } else {
    console.log(`📊 SUMMARY:`);
    console.log(`   • .cjs files: ${results.cjsFiles.length}`);
    console.log(`   • .js files with CommonJS syntax: ${results.commonJSInJS.length}`);
    console.log(`   • Potential issues: ${results.potentialIssues.length}`);
    console.log(`   • TOTAL FILES TO CONVERT: ${totalIssues}`);
    
    console.log('\n🔄 CONVERSION RECOMMENDATIONS:');
    console.log('   1. For .cjs files: Rename to .js and convert to ES module syntax');
    console.log('   2. For .js files with CommonJS:');
    console.log('      - Change require() to import');
    console.log('      - Change module.exports to export');
    console.log('      - Add .js extensions to relative imports[citation:2]');
  }
}

main();
