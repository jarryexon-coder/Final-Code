import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CommonJS to ES module patterns
const CONVERSION_RULES = {
  // Import patterns
  requireStatements: {
    pattern: /(?:const|let|var|import)\s+([^=]+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: (match, vars, modulePath) => {
      // Check if it's a destructuring import
      if (vars.includes('{')) {
        return `import ${vars} from '${modulePath}';`;
      }
      return `import ${vars} from '${modulePath}';`;
    }
  },
  
  // Dynamic imports
  dynamicRequires: {
    pattern: /require\(['"]([^'"]+)['"]\)(?!\s*\.)/g,
    replacement: (match, modulePath) => {
      if (modulePath.startsWith('.')) {
        return `import('${modulePath}.js')`;
      }
      return `import('${modulePath}')`;
    }
  },
  
  // Module exports
  moduleExports: {
    pattern: /module\.exports\s*=\s*{([^}]+)}/gs,
    replacement: (match, exports) => {
      const exportLines = exports.split(',').map(line => line.trim()).filter(line => line);
      const namedExports = exportLines.map(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        if (key === value) {
          return `export { ${key} };`;
        }
        return `export { ${value} as ${key} };`;
      });
      return namedExports.join('\n');
    }
  },
  
  // Default exports
  defaultExports: {
    pattern: /module\.exports\s*=\s*([^{;\n]+);/g,
    replacement: 'export default $1;'
  },
  
  // Named exports
  namedExports: {
    pattern: /exports\.(\w+)\s*=/g,
    replacement: 'export const $1 ='
  },
  
  // Export assignments
  exportsAssign: {
    pattern: /exports\s*=\s*{([^}]+)}/gs,
    replacement: (match, exports) => {
      const exportLines = exports.split(',').map(line => line.trim()).filter(line => line);
      const namedExports = exportLines.map(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        if (key === value) {
          return `export { ${key} };`;
        }
        return `export { ${value} as ${key} };`;
      });
      return namedExports.join('\n');
    }
  },
  
  // __dirname and __filename
  dirname: {
    pattern: /__dirname/g,
    replacement: 'import.meta.dirname'
  },
  
  filename: {
    pattern: /__filename/g,
    replacement: 'import.meta.filename'
  },
  
  // Process.exit to throw
  processExit: {
    pattern: /process\.exit\((\d+)\)/g,
    replacement: 'throw new Error(`Process exited with code $1`)'
  }
};

// Files that should be converted
function shouldConvertFile(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  const isJS = ext === '.js' || ext === '.cjs';
  const hasCommonJS = /require\(|module\.exports|exports\./.test(content);
  
  return isJS && hasCommonJS;
}

// Fix relative imports by adding .js extension
function fixRelativeImports(content, filePath) {
  const dir = path.dirname(filePath);
  
  // Pattern for relative imports without .js extension
  const importPattern = /(?:import|from)\s+['"](\.\.?\/[^'"]+?)['"]/g;
  
  return content.replace(importPattern, (match, importPath) => {
    // Skip if already has extension
    if (path.extname(importPath)) {
      return match;
    }
    
    // Check if the path exists as a directory
    const fullImportPath = path.join(dir, importPath);
    
    try {
      const stat = fs.statSync(fullImportPath);
      if (stat.isDirectory()) {
        // It's a directory, check for index.js
        const indexPath = path.join(fullImportPath, 'index.js');
        if (fs.existsSync(indexPath)) {
          return match.replace(importPath, `${importPath}/index.js`);
        }
      }
    } catch (error) {
      // Path doesn't exist, might be a module
    }
    
    // Add .js extension
    return match.replace(importPath, `${importPath}.js`);
  });
}

// Convert a single file
function convertFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    if (!shouldConvertFile(filePath, originalContent)) {
      return { converted: false, message: 'No CommonJS detected' };
    }
    
    // Create backup
    const backupPath = `${filePath}.cjs-backup`;
    fs.writeFileSync(backupPath, originalContent);
    
    let convertedContent = originalContent;
    
    // Apply conversion rules
    for (const [ruleName, rule] of Object.entries(CONVERSION_RULES)) {
      if (typeof rule.replacement === 'function') {
        convertedContent = convertedContent.replace(rule.pattern, rule.replacement);
      } else {
        convertedContent = convertedContent.replace(rule.pattern, rule.replacement);
      }
    }
    
    // Fix relative imports
    convertedContent = fixRelativeImports(convertedContent, filePath);
    
    // Add import.meta polyfill if needed
    if (convertedContent.includes('import.meta.')) {
      const importMetaPolyfill = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`;
      
      // Insert after existing imports
      const lines = convertedContent.split('\n');
      const lastImportIndex = lines.findIndex(line => 
        !line.trim().startsWith('import ') && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('/*') &&
        line.trim() !== ''
      );
      
      if (lastImportIndex > 0) {
        lines.splice(lastImportIndex, 0, importMetaPolyfill);
        convertedContent = lines.join('\n');
      } else {
        convertedContent = importMetaPolyfill + convertedContent;
      }
    }
    
    // Rename .cjs to .js
    let newFilePath = filePath;
    if (filePath.endsWith('.cjs')) {
      newFilePath = filePath.slice(0, -4) + '.js';
      fs.unlinkSync(filePath); // Remove old .cjs file
    }
    
    // Write converted file
    fs.writeFileSync(newFilePath, convertedContent);
    
    return {
      converted: true,
      backup: backupPath,
      original: filePath,
      new: newFilePath
    };
    
  } catch (error) {
    return {
      converted: false,
      error: error.message
    };
  }
}

// Find all CommonJS files
function findCommonJSFiles(startDir) {
  const commonJSFiles = [];
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build'];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (ext === '.js' || ext === '.cjs') {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (shouldConvertFile(fullPath, content)) {
              commonJSFiles.push(fullPath);
            }
          } catch (error) {
            console.error(`Error reading ${fullPath}:`, error.message);
          }
        }
      }
    }
  }
  
  scanDirectory(startDir);
  return commonJSFiles;
}

// Dry run - show what would be converted
function dryRun(filePaths) {
  console.log('🔍 DRY RUN - Files that would be converted:\n');
  
  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for specific CommonJS patterns
      const patterns = {
        'require() statements': /require\(['"][^'"]+['"]\)/g,
        'module.exports': /module\.exports/g,
        'exports.': /exports\.\w+\s*=/g,
        '__dirname/__filename': /__(?:dir|file)name/g
      };
      
      const issues = [];
      for (const [name, pattern] of Object.entries(patterns)) {
        const matches = content.match(pattern);
        if (matches) {
          issues.push(`${name}: ${matches.length}`);
        }
      }
      
      if (issues.length > 0) {
        console.log(`📄 ${filePath}`);
        console.log(`   Issues: ${issues.join(', ')}`);
        console.log();
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }
}

// Main function
async function main() {
  console.log('🔄 CommonJS to ES Module Converter\n');
  
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1] || __dirname;
  
  switch (command) {
    case 'dry-run':
      console.log('Running dry run...\n');
      const filesToCheck = findCommonJSFiles(target);
      if (filesToCheck.length === 0) {
        console.log('✅ No CommonJS files found!');
      } else {
        dryRun(filesToCheck);
        console.log(`📊 Found ${filesToCheck.length} files with CommonJS patterns`);
      }
      break;
      
    case 'convert':
      console.log(`Converting files in: ${target}\n`);
      const filesToConvert = findCommonJSFiles(target);
      
      if (filesToConvert.length === 0) {
        console.log('✅ No CommonJS files to convert!');
        return;
      }
      
      console.log(`Found ${filesToConvert.length} files to convert:\n`);
      
      const results = [];
      for (const filePath of filesToConvert) {
        console.log(`Converting: ${filePath}`);
        const result = convertFile(filePath);
        results.push(result);
        
        if (result.converted) {
          console.log(`  ✅ Converted (backup: ${result.backup})`);
          if (result.original !== result.new) {
            console.log(`  📝 Renamed: ${path.basename(result.original)} → ${path.basename(result.new)}`);
          }
        } else {
          console.log(`  ❌ Failed: ${result.error || result.message}`);
        }
        console.log();
      }
      
      // Summary
      const converted = results.filter(r => r.converted).length;
      const failed = results.filter(r => !r.converted).length;
      
      console.log('📊 CONVERSION SUMMARY:');
      console.log(`   ✅ Successfully converted: ${converted}`);
      console.log(`   ❌ Failed conversions: ${failed}`);
      console.log(`   💾 Backups created with .cjs-backup extension`);
      
      if (converted > 0) {
        console.log('\n⚠️  IMPORTANT NOTES:');
        console.log('   1. Review converted files for any syntax errors');
        console.log('   2. Test your application thoroughly');
        console.log('   3. Delete .cjs-backup files after confirming everything works');
        console.log('   4. Complex cases may require manual adjustment');
      }
      break;
      
    case 'rollback':
      console.log('Rolling back conversions...\n');
      const backupFiles = findBackupFiles(target);
      
      if (backupFiles.length === 0) {
        console.log('No backup files found (.cjs-backup)');
        return;
      }
      
      for (const backupFile of backupFiles) {
        const originalFile = backupFile.replace('.cjs-backup', '');
        
        try {
          fs.copyFileSync(backupFile, originalFile);
          fs.unlinkSync(backupFile);
          console.log(`✅ Restored: ${originalFile}`);
        } catch (error) {
          console.error(`❌ Failed to restore ${originalFile}:`, error.message);
        }
      }
      console.log(`\n✅ Rolled back ${backupFiles.length} files`);
      break;
      
    case 'find':
      console.log('Finding CommonJS files...\n');
      const foundFiles = findCommonJSFiles(target);
      
      if (foundFiles.length === 0) {
        console.log('✅ No CommonJS files found!');
      } else {
        console.log(`Found ${foundFiles.length} CommonJS files:\n`);
        foundFiles.forEach((file, index) => {
          console.log(`${index + 1}. ${file}`);
        });
        
        console.log('\n💡 Run conversion with: node fix-modules.js convert');
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node fix-modules.js dry-run [path]      - Show what would be converted');
      console.log('  node fix-modules.js convert [path]      - Convert CommonJS to ES modules');
      console.log('  node fix-modules.js rollback [path]     - Restore from backups');
      console.log('  node fix-modules.js find [path]         - Find CommonJS files');
      console.log('\nExamples:');
      console.log('  node fix-modules.js dry-run             - Dry run on current directory');
      console.log('  node fix-modules.js convert ./src       - Convert files in ./src');
      console.log('  node fix-modules.js find ./controllers  - Find CommonJS in controllers');
      break;
  }
}

function findBackupFiles(startDir) {
  const backupFiles = [];
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build'];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && item.endsWith('.cjs-backup')) {
        backupFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(startDir);
  return backupFiles;
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run main function
main().catch(console.error);
