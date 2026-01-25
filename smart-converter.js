// smart-converter.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CONVERSION_TEMPLATES = {
  // Pattern for mongoose models
  mongoose: {
    pattern: /const mongoose = require\('mongoose'\);/,
    replacement: "import mongoose from 'mongoose';"
  },
  
  // Pattern for express imports
  express: {
    pattern: /const express = require\('express'\);/,
    replacement: "import express from 'express';"
  },
  
  // Pattern for pg (PostgreSQL)
  pg: {
    pattern: /const \{ Pool \} = require\('pg'\);/,
    replacement: "import { Pool } from 'pg';"
  },
  
  // Pattern for node-cache
  nodeCache: {
    pattern: /const NodeCache = require\('node-cache'\);/,
    replacement: "import NodeCache from 'node-cache';"
  },
  
  // Pattern for axios
  axios: {
    pattern: /const axios = require\('axios'\);/,
    replacement: "import axios from 'axios';"
  },
  
  // Pattern for dotenv
  dotenv: {
    pattern: /require\('dotenv'\)\.config\(\);/,
    replacement: "import 'dotenv/config';"
  },
  
  // Pattern for module.exports = {}
  emptyExport: {
    pattern: /module\.exports = \{\};/,
    replacement: "export default {};"
  },
  
  // Pattern for module.exports = new Class()
  classExport: {
    pattern: /module\.exports = new (\w+)\(\);/,
    replacement: "export default new $1();"
  },
  
  // Pattern for module.exports = router
  routerExport: {
    pattern: /module\.exports = (\w+);/,
    replacement: "export default $1;"
  },
  
  // Pattern for require statements with destructuring
  destructuredRequire: {
    pattern: /const \{ ([\w,\s]+) \} = require\(['"]([^'"]+)['"]\);/,
    replacement: "import { $1 } from '$2';"
  }
};

class SmartConverter {
  constructor() {
    this.stats = {
      converted: 0,
      skipped: 0,
      errors: 0
    };
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const patternsFound = [];
      
      for (const [name, template] of Object.entries(CONVERSION_TEMPLATES)) {
        if (template.pattern.test(content)) {
          patternsFound.push(name);
        }
      }
      
      return {
        path: filePath,
        size: content.length,
        lines: content.split('\n').length,
        patterns: patternsFound,
        hasCommonJS: /require\(|module\.exports|exports\./.test(content)
      };
    } catch (error) {
      return { path: filePath, error: error.message };
    }
  }

  convertFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let converted = originalContent;
      
      // Apply conversions in logical order
      for (const [name, template] of Object.entries(CONVERSION_TEMPLATES)) {
        if (template.pattern.test(converted)) {
          converted = converted.replace(template.pattern, template.replacement);
        }
      }
      
      // Fix relative imports (add .js extension)
      converted = this.fixRelativeImports(converted, filePath);
      
      // Create backup
      const backupPath = `${filePath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, originalContent);
      }
      
      // Write converted file
      fs.writeFileSync(filePath, converted);
      
      this.stats.converted++;
      return { success: true, backup: backupPath };
      
    } catch (error) {
      this.stats.errors++;
      return { success: false, error: error.message };
    }
  }

  fixRelativeImports(content, filePath) {
    const dir = path.dirname(filePath);
    
    // Fix relative imports without .js extension
    return content.replace(
      /(?:import|from)\s+['"](\.\.?\/[^'"]+?)['"]/g,
      (match, importPath) => {
        // Skip if already has extension
        if (importPath.match(/\.(js|json|mjs|cjs)$/)) {
          return match;
        }
        
        // Check if it's a directory
        const fullPath = path.join(dir, importPath);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            return match.replace(importPath, `${importPath}/index.js`);
          }
        } catch {
          // Path doesn't exist
        }
        
        // Add .js extension
        return match.replace(importPath, `${importPath}.js`);
      }
    );
  }

  batchConvert(files, category) {
    console.log(`\n🔄 Converting ${category} (${files.length} files)...`);
    
    const results = [];
    for (const file of files) {
      const analysis = this.analyzeFile(file);
      
      if (analysis.error) {
        console.log(`  ⚠️  Skipped ${path.basename(file)}: ${analysis.error}`);
        this.stats.skipped++;
        continue;
      }
      
      if (!analysis.hasCommonJS) {
        console.log(`  ⏭️  Already ESM: ${path.basename(file)}`);
        this.stats.skipped++;
        continue;
      }
      
      console.log(`  📄 ${path.basename(file)} (${analysis.patterns.join(', ')})`);
      const result = this.convertFile(file);
      
      if (result.success) {
        console.log(`    ✅ Converted`);
        results.push({ file, success: true });
      } else {
        console.log(`    ❌ Failed: ${result.error}`);
        results.push({ file, success: false, error: result.error });
      }
    }
    
    return results;
  }

  printStats() {
    console.log('\n📊 CONVERSION STATISTICS:');
    console.log(`   ✅ Successfully converted: ${this.stats.converted}`);
    console.log(`   ⏭️  Skipped (already ESM): ${this.stats.skipped}`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    console.log(`   📈 Progress: ${Math.round(this.stats.converted / (this.stats.converted + this.stats.skipped) * 100)}% of attempted files`);
  }
}

// Main execution
async function main() {
  const converter = new SmartConverter();
  
  // Define conversion batches by priority
  const batches = {
    'MODELS': [
      'models/FantasyTeam.js',
      'models/Prediction.js',
      'models/promo/InfluencerCommission.js',
      'models/promo/PromoCode.js',
      'models/promo/PromoUsage.js',
      'models/promo/UserSubscription.js'
    ],
    
    'MIDDLEWARE': [
      'middleware/cacheMiddleware.js',
      'middleware/rateLimit.js',
      'middleware/rateLimitMiddleware.js'
    ],
    
    'SERVICES': [
      'services/ai-prediction-service.js',
      'services/analytics-service.js',
      'services/bettingAlgorithms.js',
      'services/emailService.js',
      'services/enhancedNBAService.js',
      'services/nba-data-service.js',
      'services/nbaApiService.js',
      'services/notificationService.js'
    ],
    
    'WEBSOCKET & CONFIG': [
      'websocket/server.js',
      'config/database.js',
      'config/firebase-admin.js'
    ],
    
    'UTILITIES': [
      'utils/dbUtils.js'
    ],
    
    'REMAINING ROUTES': [
      'routes/promo/apply.js',
      'routes/promo/enhanced.js',
      'routes/promo/index.js',
      'routes/promo/protected.js',
      'routes/promo/public.js',
      'routes/promo/validate.js',
      'routes/secretPhraseRoutes.js'
    ]
  };

  console.log('🏗️  SMART BATCH CONVERTER');
  console.log('========================\n');
  
  // Convert each batch
  for (const [category, files] of Object.entries(batches)) {
    // Filter out files that don't exist
    const existingFiles = files.filter(f => fs.existsSync(f));
    
    if (existingFiles.length > 0) {
      converter.batchConvert(existingFiles, category);
    }
  }
  
  converter.printStats();
  
  // Generate cleanup script
  generateCleanupScript();
}

function generateCleanupScript() {
  const cleanupScript = `
// cleanup-unused.js - Remove backup files after verification
import fs from 'fs';
import path from 'path';

async function cleanupBackups() {
  const files = fs.readdirSync('.');
  let removed = 0;
  
  for (const file of files) {
    if (file.endsWith('.backup') || file.endsWith('.cjs-backup')) {
      try {
        fs.unlinkSync(file);
        console.log(\`✅ Removed: \${file}\`);
        removed++;
      } catch (error) {
        console.log(\`⚠️  Failed to remove \${file}: \${error.message}\`);
      }
    }
  }
  
  console.log(\`\\n📊 Removed \${removed} backup files\\n\`);
  console.log('💡 Only run this after verifying your converted files work correctly!');
}

cleanupBackups().catch(console.error);
`;
  
  fs.writeFileSync('cleanup-backups.js', cleanupScript);
  console.log('\n📝 Created cleanup-backups.js for later use');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SmartConverter };
