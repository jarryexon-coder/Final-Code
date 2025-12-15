import revenuecatService from '../services/revenuecatService.js';

// Verify subscription status
export const verifySubscription = async (req, res) => {
    try {
        const { userId, platform = 'ios' } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const result = await revenuecatService.verifySubscription(userId, platform);
        
        if (!result.success) {
            return res.status(500).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error in verifySubscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify subscription',
            error: error.message
        });
    }
};

// Handle RevenueCat webhook
export const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log('📥 RevenueCat Webhook Received:', event.type);
        
        // Process different webhook event types
        switch (event.type) {
            case 'INITIAL_PURCHASE':
                console.log('💰 Initial purchase for user:', event.app_user_id);
                // TODO: Update user status in your database
                break;
                
            case 'RENEWAL':
                console.log('🔄 Subscription renewed for user:', event.app_user_id);
                // TODO: Update subscription status
                break;
                
            case 'CANCELLATION':
                console.log('❌ Subscription cancelled for user:', event.app_user_id);
                // TODO: Handle cancellation
                break;
                
            case 'EXPIRATION':
                console.log('📉 Subscription expired for user:', event.app_user_id);
                // TODO: Handle expiration
                break;
                
            default:
                console.log('📝 Unhandled webhook event:', event.type);
        }
        
        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ received: false, error: error.message });
    }
};

// Grant promotional access
export const grantPromoAccess = async (req, res) => {
    try {
        const { userId, entitlementId, durationInDays, platform } = req.body;
        
        if (!userId || !entitlementId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and entitlement ID are required'
            });
        }
        
        const result = await revenuecatService.grantPromotionalEntitlement(
            userId, 
            entitlementId, 
            durationInDays || 7,
            platform || 'ios'
        );
        
        res.json(result);
    } catch (error) {
        console.error('Error in grantPromoAccess:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to grant promotional access',
            error: error.message
        });
    }
};
