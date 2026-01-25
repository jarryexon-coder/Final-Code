import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const controllers = [
  'controllers/analyticsController.js',
  'controllers/fantasyController.js',
  'controllers/nbaController.js',
  'controllers/nflController.js',
  'controllers/nhlController.js',
  'controllers/subscriptionController.js',
  'controllers/userController.js'
];

for (const controller of controllers) {
  try {
    const content = readFileSync(controller, 'utf8');
    
    // Convert require to import
    let converted = content.replace(
      /const\s+(\{?[\w\s{},]+\}?)\s*=\s*require\(['"]([^'"]+)['"]\);/g,
      'import $1 from \'$2\';'
    );
    
    // Convert module.exports
    converted = converted.replace(
      /module\.exports\s*=\s*(\w+);/g,
      'export default $1;'
    );
    
    // Backup and write
    writeFileSync(controller + '.backup', content);
    writeFileSync(controller, converted);
    console.log(`✅ Converted ${controller}`);
  } catch (error) {
    console.log(`⚠️  Skipped ${controller}: ${error.message}`);
  }
}
