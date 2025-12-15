// RevenueCat Configuration - ES Module
const REVENUECAT_CONFIG = {
    // Platform API Keys
    KEYS: {
        IOS: process.env.REVENUECAT_IOS_KEY || 'appl_eDwUHlFEtBYuVyjQVzJaNpYuDAR',
        ANDROID: process.env.REVENUECAT_ANDROID_KEY || 'goog_cURaZuoYPhEGjHovjWYEvaSOxsh',
        TEST: process.env.REVENUECAT_TEST_KEY || 'test_RsKFWVnZAjRYVpCMfrTYlUMwpiy'
    },
    
    // Environment settings
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    
    // Platform identifiers
    PLATFORMS: {
        IOS: 'ios',
        ANDROID: 'android',
        STRIPE: 'stripe'
    },
    
    // Product IDs (configure these in RevenueCat dashboard)
    PRODUCTS: {
        PREMIUM_MONTHLY: 'premium_monthly',
        PRO_MONTHLY: 'pro_monthly',
        PREMIUM_YEARLY: 'premium_yearly',
        PRO_YEARLY: 'pro_yearly',
        LIFETIME_ACCESS: 'lifetime_access'
    },
    
    // Entitlement IDs (configure these in RevenueCat dashboard)
    ENTITLEMENTS: {
        PREMIUM: 'premium',
        PRO: 'pro',
        ALL_ACCESS: 'all_access'
    }
};

export default REVENUECAT_CONFIG;
