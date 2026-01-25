// Test admin controller imports
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing admin controller imports...\n');

try {
    const adminModule = await import(__dirname + '/controllers/admin.controller.js');
    
    console.log('✅ Successfully imported admin.controller.js');
    
    const requiredFunctions = [
        'listUsers',
        'getUserDetails', 
        'getUserPrizePicks',
        'resetUserLimit',
        'updateUserStatus',
        'deleteUser',
        'batchGenerateSelections',
        'getGenerationStats',
        'removeSelection',
        'forceGenerate'
    ];
    
    console.log('\nChecking required functions:');
    let allFound = true;
    
    for (const func of requiredFunctions) {
        if (adminModule[func]) {
            console.log(`✅ ${func}: Available (${typeof adminModule[func]})`);
        } else {
            console.log(`❌ ${func}: NOT AVAILABLE`);
            allFound = false;
        }
    }
    
    console.log('\nChecking default export:');
    if (adminModule.default) {
        console.log(`✅ Default export available with ${Object.keys(adminModule.default).length} functions`);
        
        // Check if all required functions are in default export
        console.log('\nFunctions in default export:');
        for (const func of requiredFunctions) {
            if (adminModule.default[func]) {
                console.log(`✅ ${func} in default export`);
            } else {
                console.log(`❌ ${func} NOT in default export`);
            }
        }
    } else {
        console.log('❌ No default export');
    }
    
    if (allFound) {
        console.log('\n🎉 All required functions are available!');
    } else {
        console.log('\n⚠️  Some functions are missing');
    }
    
} catch (error) {
    console.log('❌ Error importing admin.controller.js:', error.message);
    console.log(error.stack);
}
