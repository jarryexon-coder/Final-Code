// Test script for default exports
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing default exports...\n');

// Test sportsData.controller.js
try {
    console.log('1. Testing sportsData.controller.js...');
    const sportsDataController = await import(__dirname + '/controllers/sportsData.controller.js');
    
    if (sportsDataController.default) {
        console.log('✅ Has default export');
        
        // Check if it has expected methods
        const expectedMethods = ['getLiveGames', 'getGameDetails', 'getPlayerStats'];
        let hasMethods = true;
        
        expectedMethods.forEach(method => {
            if (typeof sportsDataController.default[method] === 'function') {
                console.log(`   ✅ Has method: ${method}`);
            } else {
                console.log(`   ❌ Missing method: ${method}`);
                hasMethods = false;
            }
        });
        
        if (hasMethods) {
            console.log('✅ All expected methods found');
        }
    } else {
        console.log('❌ No default export found');
    }
} catch (error) {
    console.log('❌ Error importing sportsData.controller.js:', error.message);
}

// Test other controllers that might have issues
const controllersToTest = [
    'analytics.controller.js',
    'fantasyDraftController.js',
    'lines.controller.js',
    'preferences.controller.js'
];

console.log('\n2. Testing other controllers...');
for (const controller of controllersToTest) {
    try {
        const module = await import(__dirname + '/controllers/' + controller);
        if (module.default) {
            console.log(`✅ ${controller}: Has default export`);
        } else {
            console.log(`❌ ${controller}: No default export`);
        }
    } catch (error) {
        console.log(`❌ ${controller}: Error - ${error.message}`);
    }
}

console.log('\n🎉 Test complete!');
