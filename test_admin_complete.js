// Test admin controller imports
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing admin.controller.js imports...\n');

try {
    // Test 1: Import all named exports
    console.log('1. Testing named exports...');
    const adminModule = await import(__dirname + '/controllers/admin.controller.js');
    
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
    
    let allNamedExportsFound = true;
    for (const func of requiredFunctions) {
        if (adminModule[func] && typeof adminModule[func] === 'function') {
            console.log(`✅ ${func}: Named export available`);
        } else {
            console.log(`❌ ${func}: Named export MISSING`);
            allNamedExportsFound = false;
        }
    }
    
    // Test 2: Import default export
    console.log('\n2. Testing default export...');
    if (adminModule.default) {
        console.log(`✅ Default export available`);
        
        let allDefaultExportsFound = true;
        for (const func of requiredFunctions) {
            if (adminModule.default[func] && typeof adminModule.default[func] === 'function') {
                console.log(`✅ ${func}: In default export`);
            } else {
                console.log(`❌ ${func}: NOT in default export`);
                allDefaultExportsFound = false;
            }
        }
        
        if (!allDefaultExportsFound) {
            console.log('\n⚠️  Some functions missing from default export');
        }
    } else {
        console.log('❌ No default export found');
    }
    
    // Test 3: Simulate what adminRoutes.js does
    console.log('\n3. Simulating adminRoutes.js import...');
    const starImport = await import(__dirname + '/controllers/admin.controller.js');
    
    // Check if we can call the functions
    console.log('   Testing function calls...');
    const mockReq = { query: {}, params: {}, body: {} };
    const mockRes = {
        json: (data) => {
            console.log('   ✅ Function returns data:', typeof data);
            return data;
        },
        status: () => mockRes
    };
    
    try {
        // Test one function
        if (starImport.listUsers) {
            const result = await starImport.listUsers(mockReq, mockRes);
            console.log('   ✅ listUsers function works');
        }
    } catch (error) {
        console.log('   ❌ Function call error:', error.message);
    }
    
    if (allNamedExportsFound) {
        console.log('\n🎉 ALL NAMED EXPORTS FOUND! adminRoutes.js should work.');
        console.log('   adminRoutes.js uses: import * as adminController from ...');
        console.log('   This imports all named exports.');
    } else {
        console.log('\n⚠️  Some named exports are missing');
    }
    
} catch (error) {
    console.log('❌ Import error:', error.message);
    console.log(error.stack);
}
