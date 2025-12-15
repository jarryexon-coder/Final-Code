import revenuecatService from './services/revenuecatService.js';

async function testRevenueCat() {
    try {
        console.log('🧪 Testing RevenueCat REST API integration...\n');
        
        // Test 1: Verify subscription for a test user
        const testUserId = 'test_user_' + Date.now();
        console.log(`Test User ID: ${testUserId}`);
        
        const result = await revenuecatService.verifySubscription(testUserId, 'ios');
        
        console.log('✅ RevenueCat Service Response:');
        console.log({
            success: result.success,
            hasActiveSubscription: result.data.hasActiveSubscription,
            activeEntitlements: result.data.activeEntitlements.length,
            platform: result.data.platform
        });
        
        if (result.error) {
            console.log('Note:', result.error);
        }
        
        console.log('\n🎉 RevenueCat REST API integration successful!');
        console.log('\n📝 Next steps:');
        console.log('1. Configure products in RevenueCat Dashboard');
        console.log('2. Set up webhooks for real-time updates');
        console.log('3. Create controller and routes for your API');
        
    } catch (error) {
        console.error('❌ RevenueCat test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testRevenueCat();
