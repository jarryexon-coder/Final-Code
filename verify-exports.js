// verify-exports.js
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Verifying exports for selections.controller.js\n');

// Functions that routes expect
const expectedFunctions = [
  'getAllSelections',
  'getTodaySelections',
  'getSelectionById',
  'createSelection',
  'updateSelection',
  'deleteSelection',
  'getWinnersForSelection',
  'addWinnerToSelection',
  'updateWinner',
  'removeWinner',
  'createBatchSelections',
  'updateSelectionStatus',
  'duplicateSelection',
  'trackSelection',
  'untrackSelection',
  'getTrackedSelections'
];

try {
  // Try to read the controller file
  const controllerContent = fs.readFileSync('controllers/selections.controller.js', 'utf8');
  
  console.log('📋 Functions expected by routes:');
  console.log('='.repeat(50));
  
  const missingFunctions = [];
  const foundFunctions = [];
  
  // Check each expected function
  for (const func of expectedFunctions) {
    // Look for export patterns
    const exportPatterns = [
      `export const ${func}`,
      `export async function ${func}`,
      `export function ${func}`,
      `export { ${func} }`,
      `export default {.*${func}`
    ];
    
    const found = exportPatterns.some(pattern => {
      const regex = new RegExp(pattern, 's');
      return regex.test(controllerContent);
    });
    
    if (found) {
      foundFunctions.push(func);
      console.log(`✅ ${func}`);
    } else {
      missingFunctions.push(func);
      console.log(`❌ ${func} - MISSING`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results:`);
  console.log(`   Found: ${foundFunctions.length}/${expectedFunctions.length}`);
  console.log(`   Missing: ${missingFunctions.length}/${expectedFunctions.length}`);
  
  if (missingFunctions.length > 0) {
    console.log('\n❌ Missing functions:');
    missingFunctions.forEach(func => console.log(`   - ${func}`));
    
    // Create a fix command
    console.log('\n💡 To fix with sed commands:');
    console.log('='.repeat(50));
    
    // Check if it's using export syntax or module.exports
    if (controllerContent.includes('export default') || controllerContent.includes('module.exports')) {
      console.log('The controller appears to use default/CommonJS exports.');
      console.log('Try changing the import in routes/selectionsRoutes.js to:');
      console.log('import selectionsController from \'../controllers/selections.controller.js\';');
    } else {
      console.log('The controller appears to use named exports (export const).');
      console.log('You need to add the missing functions.');
    }
  }
  
} catch (error) {
  console.error('❌ Error reading controller file:', error.message);
  console.log('\n💡 Alternative approach:');
  console.log('1. First, let\'s see what\'s actually in the file:');
  console.log('   cat controllers/selections.controller.js');
  console.log('\n2. Based on that, we can create a fix.');
}
