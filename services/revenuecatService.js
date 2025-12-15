// Note: RevenueCat JS SDK is for web browsers, NOT Node.js!
// We need to use RevenueCat REST API for Node.js backend
// Let's create a service that uses the REST API directly

import axios from 'axios';
import REVENUECAT_CONFIG from '../config/revenuecat.js';

class RevenueCatService {
    constructor() {
        console.log('✅ RevenueCat REST API Service Initialized');
    }

    // Helper to get the correct API key based on platform
    getApiKey(platform = 'ios') {
        switch (platform.toLowerCase()) {
            case 'ios':
                return REVENUECAT_CONFIG.KEYS.IOS;
            case 'android':
                return REVENUECAT_CONFIG.KEYS.ANDROID;
            default:
                return REVENUECAT_CONFIG.KEYS.IOS;
        }
    }

    // Get subscriber information from RevenueCat REST API
    async getSubscriber(userId, platform = 'ios') {
        try {
            const apiKey = this.getApiKey(platform);
            const response = await axios.get(
                `https://api.revenuecat.com/v1/subscribers/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('RevenueCat API Error:', error.response?.data || error.message);
            
            // Return empty subscriber if not found (for development)
            if (error.response?.status === 404) {
                return {
                    entitlements: { active: {}, all: {} },
                    subscriptions: {},
                    non_subscriptions: [],
                    original_app_user_id: userId
                };
            }
            
            throw error;
        }
    }

    // Verify user's subscription status
    async verifySubscription(userId, platform = 'ios') {
        try {
            const subscriber = await this.getSubscriber(userId, platform);
            
            const activeEntitlements = Object.values(subscriber.entitlements?.active || {})
                .filter(entitlement => entitlement.is_active);
            
            const hasActiveSubscription = activeEntitlements.length > 0;
            
            return {
                success: true,
                data: {
                    hasActiveSubscription,
                    activeEntitlements,
                    subscriptions: subscriber.subscriptions || {},
                    nonSubscriptions: subscriber.non_subscriptions || [],
                    subscriberId: userId,
                    platform,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error verifying subscription:', error.message);
            return {
                success: false,
                error: error.message,
                data: {
                    hasActiveSubscription: false,
                    activeEntitlements: [],
                    subscriptions: {},
                    nonSubscriptions: [],
                    subscriberId: userId,
                    platform,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    // Grant promotional entitlement
    async grantPromotionalEntitlement(userId, entitlementId, durationInDays = 7, platform = 'ios') {
        try {
            const apiKey = this.getApiKey(platform);
            const response = await axios.post(
                `https://api.revenuecat.com/v1/subscribers/${userId}/entitlements/${entitlementId}/promotional`,
                { duration_in_days: durationInDays },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error granting entitlement:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    // Create non-subscription purchase
    async createNonSubscriptionPurchase(userId, productId, platform = 'ios') {
        try {
            const apiKey = this.getApiKey(platform);
            const response = await axios.post(
                'https://api.revenuecat.com/v1/receipts',
                {
                    app_user_id: userId,
                    product_id: productId,
                    platform: platform
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating purchase:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    // Update subscriber attributes
    async updateSubscriberAttributes(userId, attributes, platform = 'ios') {
        try {
            const apiKey = this.getApiKey(platform);
            const response = await axios.post(
                `https://api.revenuecat.com/v1/subscribers/${userId}/attributes`,
                attributes,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating attributes:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
const revenuecatService = new RevenueCatService();
export default revenuecatService;
