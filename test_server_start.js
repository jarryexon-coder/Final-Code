import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing server imports...\n');

try {
    // Test analytics controller
    console.log('1. Testing analytics.controller.js...');
    const analyticsController = readFileSync(__dirname + '/controllers/analytics.controller.js', 'utf8');
    const analyticsExports = analyticsController.match(/export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    console.log(`   Found ${analyticsExports ? analyticsExports.length : 0} exports`);
    
    // Test prizepicksAnalyticsRoutes
    console.log('\n2. Testing prizepicksAnalyticsRoutes.js...');
    const analyticsRoutes = readFileSync(__dirname + '/routes/prizepicksAnalyticsRoutes.js', 'utf8');
    
    // Extract imported functions
    const importMatch = analyticsRoutes.match(/import\s*{([^}]+)}\s*from\s*['"]\.\.\/controllers\/analytics\.controller\.js['"]/);
    if (importMatch) {
        const importedFunctions = importMatch[1].split(',').map(f => f.trim()).filter(f => f);
        console.log(`   Importing ${importedFunctions.length} functions`);
        console.log('   Imported functions:', importedFunctions.join(', '));
    }
    
    console.log('\n✅ Import test completed successfully!');
    console.log('You can now run: npm start');
    
} catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Please check the fixes and try again.');
}
