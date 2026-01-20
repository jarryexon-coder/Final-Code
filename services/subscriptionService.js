// services/subscriptionService.js
const TIER_FEATURES = {
  free: {
    screens: ['LiveGamesScreen', 'NFLAnalyticsScreen', 'NewsDeskScreen'],
    limits: { predictions: 3, analytics: 10 }
  },
  superstats: {
    screens: ['FantasyScreen-enhanced-v2', 'PlayerStatsScreen-enhanced', 
              'SportsNewsHub-enhanced', 'NHLScreen-enhanced', 'GameDetailsScreen'],
    limits: { predictions: 20, analytics: 50 }
  },
  aigenerators: {
    screens: ['AIParlayBuilder', 'ExpertPicksGenerator', 'GamePredictions', 
              'RandomizedPredictions', ...TIER_FEATURES.superstats.screens],
    limits: { predictions: 100, analytics: 200 }
  }
};

class SubscriptionService {
  async checkScreenAccess(userId, screenName) {
    const entitlements = await revenuecatService.getEntitlements(userId);
    
    // Check access based on screen
    if (TIER_FEATURES.free.screens.includes(screenName)) {
      return true; // Free for everyone
    }
    
    if (TIER_FEATURES.superstats.screens.includes(screenName)) {
      return entitlements.includes('superstats_access') || 
             entitlements.includes('aigenerators_access');
    }
    
    if (TIER_FEATURES.aigenerators.screens.includes(screenName)) {
      return entitlements.includes('aigenerators_access');
    }
    
    return false;
  }
}
