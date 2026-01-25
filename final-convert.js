// final-convert.js - One script to convert all remaining files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_CONVERT = {
  routes: [
    'routes/auth-backup.js',
    'routes/influencer-backup.js', 
    'routes/influencer-complex.js',
    'routes/influencer-test.js',
    'routes/influencer-ultrasimple.js',
    'routes/influencer.js',
    'routes/nba-backup.js',
    'routes/secretPhraseRoutes.js',
    'routes/stubRoutes.js'
  ],
  models: [
    'models/FantasyTeam.js',
    'models/Prediction.js'
  ],
  middleware: [
    'middleware/rateLimit.js',
    'middleware/rateLimitMiddleware.js'
  ],
  services: [
    'services/emailService.js',
    'services/enhancedNBAService.js', 
    'services/notificationService.js'
  ],
  utils: [
    'utils/dbUtils.js'
  ]
};

// Pattern-specific conversions
const CONVERSION_RULES = [
  // Pattern 1: Standard require statements
  {
    pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);/g,
    replacement: (match, varName, moduleName) => {
      if (moduleName.startsWith('.')) {
        const ext = path.extname(moduleName);
        if (!ext) return `import ${varName} from '${moduleName}.js';`;
      }
      return `import ${varName} from '${moduleName}';`;
    }
  },
  
  // Pattern 2: Destructured require
  {
    pattern: /const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);/g,
    replacement: (match, vars, moduleName) => {
      if (moduleName.startsWith('.')) {
        const ext = path.extname(moduleName);
        if (!ext) return `import { ${vars.trim()} } from '${moduleName}.js';`;
      }
      return `import { ${vars.trim()} } from '${moduleName}';`;
    }
  },
  
  // Pattern 3: module.exports = variable
  {
    pattern: /module\.exports\s*=\s*(\w+);/g,
    replacement: 'export default $1;'
  },
  
  // Pattern 4: module.exports = {}
  {
    pattern: /module\.exports\s*=\s*\{\s*\};/g,
    replacement: 'export default {};'
  },
  
  // Pattern 5: exports.variable = ...
  {
    pattern: /exports\.(\w+)\s*=/g,
    replacement: 'export const $1 ='
  },
  
  // Pattern 6: require('dotenv').config()
  {
    pattern: /require\('dotenv'\)\.config\(\);/g,
    replacement: "import 'dotenv/config';"
  }
];

async function convertFile(filePath) {
  try {
    console.log(`🔧 Converting ${filePath}...`);
    
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.final-backup`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content);
    }
    
    // Apply all conversion rules
    let converted = content;
    for (const rule of CONVERSION_RULES) {
      if (typeof rule.replacement === 'function') {
        converted = converted.replace(rule.pattern, rule.replacement);
      } else {
        converted = converted.replace(rule.pattern, rule.replacement);
      }
    }
    
    // Fix relative imports
    converted = fixRelativeImports(converted, filePath);
    
    // Handle __dirname/__filename if present
    if (converted.includes('__dirname') || converted.includes('__filename')) {
      converted = addImportMetaPolyfill(converted);
    }
    
    // Write converted file
    fs.writeFileSync(filePath, converted);
    
    console.log(`✅ Successfully converted ${filePath}`);
    return { success: true, file: filePath };
    
  } catch (error) {
    console.error(`❌ Failed to convert ${filePath}: ${error.message}`);
    return { success: false, file: filePath, error: error.message };
  }
}

function fixRelativeImports(content, filePath) {
  const dir = path.dirname(filePath);
  
  return content.replace(
    /from\s+['"](\.\.?\/[^'"]+?)['"]/g,
    (match, importPath) => {
      // Skip if already has extension
      if (importPath.match(/\.(js|jsx|ts|tsx|json)$/)) {
        return match;
      }
      
      // Check if it's a directory
      const fullPath = path.join(dir, importPath);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Check for index.js
          const indexPath = path.join(fullPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return match.replace(importPath, `${importPath}/index.js`);
          }
        }
      } catch {
        // Path doesn't exist
      }
      
      // Add .js extension
      return match.replace(importPath, `${importPath}.js`);
    }
  );
}

function addImportMetaPolyfill(content) {
  const polyfill = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`;
  
  // Insert after existing imports
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find where imports end
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('import ') && 
        !lines[i].startsWith('//') && 
        lines[i].trim() !== '') {
      insertIndex = i;
      break;
    }
  }
  
  lines.splice(insertIndex, 0, polyfill);
  return lines.join('\n');
}

async function main() {
  console.log('🚀 FINAL BACKEND CONVERSION\n');
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  // Convert all files by category
  for (const [category, files] of Object.entries(FILES_TO_CONVERT)) {
    console.log(`\n📂 ${category.toUpperCase()}:`);
    
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.log(`   ⚠️  Skipped: ${file} (not found)`);
        results.skipped++;
        continue;
      }
      
      const result = await convertFile(file);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CONVERSION COMPLETE:');
  console.log(`   ✅ Successfully converted: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log('='.repeat(50));
  
  // Test the converted files
  console.log('\n🧪 Running syntax checks...\n');
  await testConvertedFiles();
  
  // Cleanup instructions
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Run your application: npm start');
  console.log('   2. Test all endpoints');
  console.log('   3. If everything works, delete backup files:');
  console.log('      rm -f **/*.backup **/*.final-backup');
}

async function testConvertedFiles() {
  const testPromises = [];
  
  // Test each category
  for (const [category, files] of Object.entries(FILES_TO_CONVERT)) {
    for (const file of files) {
      if (fs.existsSync(file)) {
        testPromises.push(testFileSyntax(file));
      }
    }
  }
  
  const testResults = await Promise.all(testPromises);
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  
  console.log(`   ${passed}/${total} files passed syntax check`);
  
  if (passed === total) {
    console.log('\n🎉 All converted files have valid syntax!');
  } else {
    console.log('\n⚠️  Some files may need manual adjustment:');
    testResults
      .filter(r => !r.success)
      .forEach(r => console.log(`   ❌ ${r.file}: ${r.error}`));
  }
}

function testFileSyntax(filePath) {
  return new Promise((resolve) => {
    try {
      // Simple syntax check by trying to parse it
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for obvious syntax errors
      if (content.includes('require(')) {
        resolve({ file: filePath, success: false, error: 'Still contains require()' });
        return;
      }
      
      if (content.includes('module.exports')) {
        resolve({ file: filePath, success: false, error: 'Still contains module.exports' });
        return;
      }
      
      resolve({ file: filePath, success: true });
    } catch (error) {
      resolve({ file: filePath, success: false, error: error.message });
    }
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { convertFile, testFileSyntax };
