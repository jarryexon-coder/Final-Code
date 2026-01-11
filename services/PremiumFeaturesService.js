/**
 * Premium Features Service
 * Manages premium access, feature gating, and premium analytics
 */

// Add at the top of the file
import mongoose from 'mongoose';

class PremiumFeaturesService {
  constructor() {
    this.premiumTiers = {
      'free': {
        maxSecretPhrases: 5,
        dailyParlayLimit: 3,
        advancedAnalytics: false,
        realTimeData: false,
        apiAccess: false,
        prioritySupport: false
      },
      'pro': {
        maxSecretPhrases: 20,
        dailyParlayLimit: 10,
        advancedAnalytics: true,
        realTimeData: true,
        apiAccess: false,
        prioritySupport: false,
        price: '$19.99/month'
      },
      'elite': {
        maxSecretPhrases: 'unlimited',
        dailyParlayLimit: 50,
        advancedAnalytics: true,
        realTimeData: true,
        apiAccess: true,
        prioritySupport: true,
        price: '$49.99/month'
      }
    };

    this.premiumFeatures = {
      'snake_draft': ['pro', 'elite'],
      'gpp_tournament': ['pro', 'elite'],
      'kalshi_bets': ['elite'],
      'advanced_analytics': ['pro', 'elite'],
      'live_betting': ['elite'],
      'arbitrage': ['elite'],
      'sharp_money': ['elite']
    };
  }

  /**
   * Check if user can access a feature
   */
  async canAccessFeature(userId, featureKey) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, using default access');
        return {
          canAccess: false,
          reason: 'Database not available',
          requiredTier: this.getRequiredTier(featureKey),
          userTier: 'free'
        };
      }
      
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ userId });
      
      if (!user) {
        return {
          canAccess: false,
          reason: 'User not found',
          requiredTier: this.getRequiredTier(featureKey),
          userTier: 'free'
        };
      }

      const userTier = user.subscription?.tier || 'free';
      const requiredTiers = this.premiumFeatures[featureKey] || ['free'];
      
      const hasAccess = requiredTiers.includes(userTier);
      
      return {
        canAccess: hasAccess,
        userTier,
        requiredTier: requiredTiers[0],
        upgradeRequired: !hasAccess,
        upgradeTo: requiredTiers[0],
        upgradePrice: this.premiumTiers[requiredTiers[0]]?.price || 'N/A'
      };
      
    } catch (error) {
      console.error('❌ Error checking feature access:', error);
      return {
        canAccess: false,
        reason: 'System error',
        requiredTier: this.getRequiredTier(featureKey),
        userTier: 'free'
      };
    }
  }

  /**
   * Check secret phrase premium access
   */
  async checkSecretPhraseAccess(userId, phraseKey) {
    const phrase = await this.getPhraseConfig(phraseKey);
    
    if (!phrase) {
      return { canAccess: true, reason: 'Phrase not found' };
    }

    if (!phrase.requiresPremium) {
      return { canAccess: true };
    }

    return await this.canAccessFeature(userId, phrase.category);
  }

  /**
   * Get user's premium status
   */
  async getUserPremiumStatus(userId) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, returning free tier config');
        return this.getTierConfig('free');
      }
      
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ userId });
      
      if (!user) {
        return this.getTierConfig('free');
      }

      const tier = user.subscription?.tier || 'free';
      const config = this.getTierConfig(tier);
      
      return {
        ...config,
        userId,
        subscriptionActive: user.subscription?.status === 'active',
        renewalDate: user.subscription?.renewalDate,
        paymentMethod: user.subscription?.paymentMethod,
        usageStats: await this.getUserUsageStats(userId)
      };
      
    } catch (error) {
      console.error('❌ Error getting premium status:', error);
      return this.getTierConfig('free');
    }
  }

  /**
   * Get available upgrades for user
   */
  async getAvailableUpgrades(userId) {
    const currentTier = (await this.getUserPremiumStatus(userId)).tier;
    
    if (currentTier === 'elite') {
      return { available: false, message: 'Already on highest tier' };
    }

    const upgrades = [];
    
    if (currentTier === 'free') {
      upgrades.push({
        tier: 'pro',
        price: '$19.99/month',
        features: this.getUpgradeFeatures('free', 'pro'),
        savings: 'Save 20% with annual plan'
      });
      
      upgrades.push({
        tier: 'elite',
        price: '$49.99/month',
        features: this.getUpgradeFeatures('free', 'elite'),
        savings: 'Save 25% with annual plan'
      });
    }
    
    if (currentTier === 'pro') {
      upgrades.push({
        tier: 'elite',
        price: '$49.99/month',
        features: this.getUpgradeFeatures('pro', 'elite'),
        upgradePrice: '$30/month additional',
        savings: 'Save 20% with annual plan'
      });
    }

    return {
      available: upgrades.length > 0,
      currentTier,
      upgrades,
      recommendation: this.getUpgradeRecommendation(userId)
    };
  }

  /**
   * Process upgrade
   */
  async processUpgrade(userId, targetTier, paymentMethod) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, cannot process upgrade');
        return { success: false, message: 'Database not available' };
      }
      
      const currentStatus = await this.getUserPremiumStatus(userId);
      
      if (currentStatus.tier === targetTier) {
        return { success: false, message: 'Already on this tier' };
      }

      const targetConfig = this.premiumTiers[targetTier];
      if (!targetConfig) {
        return { success: false, message: 'Invalid tier' };
      }

      // Here you would integrate with payment processor (Stripe, RevenueCat, etc.)
      // For now, we'll simulate success
      
      const db = mongoose.connection.db;
      const result = await db.collection('users').updateOne(
        { userId },
        {
          $set: {
            'subscription.tier': targetTier,
            'subscription.status': 'active',
            'subscription.paymentMethod': paymentMethod,
            'subscription.updatedAt': new Date(),
            'subscription.renewalDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          $push: {
            'subscription.history': {
              from: currentStatus.tier,
              to: targetTier,
              date: new Date(),
              price: targetConfig.price
            }
          }
        },
        { upsert: true }
      );

      // Log the upgrade
      await this.logPremiumEvent(userId, 'upgrade', {
        fromTier: currentStatus.tier,
        toTier: targetTier,
        price: targetConfig.price
      });

      return {
        success: true,
        newTier: targetTier,
        features: this.getTierConfig(targetTier),
        receipt: {
          transactionId: `PREMIUM_${Date.now()}`,
          amount: targetConfig.price,
          date: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Error processing upgrade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId, featureKey, metadata = {}) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, skipping usage tracking');
        return { success: false, error: 'Database not available' };
      }
      
      const db = mongoose.connection.db;
      const event = {
        userId,
        featureKey,
        timestamp: new Date(),
        metadata,
        accessLevel: (await this.canAccessFeature(userId, featureKey)).userTier
      };

      await db.collection('premium_usage').insertOne(event);
      
      // Update user's usage stats
      await db.collection('users').updateOne(
        { userId },
        {
          $inc: { [`usage.${featureKey}.count`]: 1 },
          $set: { [`usage.${featureKey}.lastUsed`]: new Date() },
          $setOnInsert: { userId }
        },
        { upsert: true }
      );

      return { success: true, eventId: event._id };
      
    } catch (error) {
      console.error('❌ Error tracking feature usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get premium analytics for dashboard
   */
  async getPremiumAnalytics(timeRange = '30d') {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, returning empty analytics');
        return { 
          success: true, 
          analytics: {}, 
          timeRange, 
          generatedAt: new Date().toISOString() 
        };
      }
      
      const db = mongoose.connection.db;
      const startDate = this.getStartDate(timeRange);

      const analytics = await db.collection('premium_usage').aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $facet: {
            usageByTier: [
              {
                $group: {
                  _id: '$accessLevel',
                  count: { $sum: 1 },
                  uniqueUsers: { $addToSet: '$userId' }
                }
              }
            ],
            usageByFeature: [
              {
                $group: {
                  _id: '$featureKey',
                  count: { $sum: 1 },
                  uniqueUsers: { $addToSet: '$userId' }
                }
              },
              { $sort: { count: -1 } }
            ],
            dailyUsage: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            revenueStats: [
              {
                $lookup: {
                  from: 'subscriptions',
                  localField: 'userId',
                  foreignField: 'userId',
                  as: 'subscription'
                }
              },
              {
                $unwind: '$subscription'
              },
              {
                $group: {
                  _id: null,
                  totalRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ['$subscription.tier', 'pro'] }, 19.99,
                        { $cond: [
                          { $eq: ['$subscription.tier', 'elite'] }, 49.99,
                          0
                        ]}
                      ]
                    }
                  },
                  proSubscribers: {
                    $sum: { $cond: [{ $eq: ['$subscription.tier', 'pro'] }, 1, 0] }
                  },
                  eliteSubscribers: {
                    $sum: { $cond: [{ $eq: ['$subscription.tier', 'elite'] }, 1, 0] }
                  }
                }
              }
            ]
          }
        }
      ]).toArray();

      return {
        success: true,
        analytics: analytics[0] || {},
        timeRange,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting premium analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  getRequiredTier(featureKey) {
    const tiers = this.premiumFeatures[featureKey];
    return tiers ? tiers[0] : 'free';
  }

  getTierConfig(tier) {
    const config = this.premiumTiers[tier];
    if (!config) return this.premiumTiers.free;
    
    return {
      tier,
      ...config,
      features: this.getTierFeatures(tier)
    };
  }

  getTierFeatures(tier) {
    const features = [];
    
    Object.entries(this.premiumFeatures).forEach(([feature, requiredTiers]) => {
      if (requiredTiers.includes(tier)) {
        features.push(feature);
      }
    });
    
    return features;
  }

  getUpgradeFeatures(fromTier, toTier) {
    const currentFeatures = new Set(this.getTierFeatures(fromTier));
    const newFeatures = new Set(this.getTierFeatures(toTier));
    
    return Array.from(newFeatures).filter(feature => !currentFeatures.has(feature));
  }

  async getPhraseConfig(phraseKey) {
    // This would normally fetch from your phrases database
    // For now, return mock data
    const phrases = {
      '26snake_anchor': { category: 'snake_draft', requiresPremium: true },
      '26gpp_leverage': { category: 'gpp_tournament', requiresPremium: true },
      '26kalshi_inefficiency': { category: 'kalshi_bets', requiresPremium: true },
      'arbitrage': { category: 'advanced_analytics', requiresPremium: true }
    };
    
    return phrases[phraseKey] || { requiresPremium: false };
  }

  async getUserUsageStats(userId) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, returning default usage stats');
        return {
          totalFeaturesUsed: 0,
          mostUsedFeature: null,
          lastUsed: null,
          dailyAverage: 0
        };
      }
      
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ userId });
      
      if (!user || !user.usage) {
        return {
          totalFeaturesUsed: 0,
          mostUsedFeature: null,
          lastUsed: null,
          dailyAverage: 0
        };
      }

      const usage = user.usage;
      const features = Object.keys(usage);
      
      return {
        totalFeaturesUsed: features.length,
        mostUsedFeature: features.sort((a, b) => usage[b].count - usage[a].count)[0],
        lastUsed: features.reduce((latest, feature) => {
          const featureDate = new Date(usage[feature].lastUsed);
          return featureDate > latest ? featureDate : latest;
        }, new Date(0)),
        dailyAverage: features.reduce((sum, feature) => sum + usage[feature].count, 0) / 30,
        featureBreakdown: usage
      };
      
    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      return null;
    }
  }

  getUpgradeRecommendation(userId) {
    // Simple recommendation logic
    // In production, analyze user behavior
    return {
      recommendedTier: 'pro',
      reason: 'Based on your usage patterns, Pro tier would unlock 5+ additional features',
      estimatedValue: '$45/month in additional value'
    };
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch(timeRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }

  async logPremiumEvent(userId, eventType, metadata) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, skipping premium event logging');
        return { success: false, error: 'Database not available' };
      }
      
      const db = mongoose.connection.db;
      const event = {
        userId,
        eventType,
        timestamp: new Date(),
        metadata
      };

      await db.collection('premium_events').insertOne(event);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error logging premium event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate subscription status
   */
  async validateSubscription(userId) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, assuming free tier');
        return { valid: false, tier: 'free', reason: 'Database not available' };
      }
      
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ userId });
      
      if (!user || !user.subscription) {
        return { valid: false, tier: 'free', reason: 'No subscription found' };
      }

      const sub = user.subscription;
      const now = new Date();
      const renewalDate = new Date(sub.renewalDate);
      
      if (renewalDate < now) {
        // Subscription expired
        await db.collection('users').updateOne(
          { userId },
          { $set: { 'subscription.status': 'expired', 'subscription.tier': 'free' } }
        );
        
        return { valid: false, tier: 'free', reason: 'Subscription expired' };
      }

      return {
        valid: true,
        tier: sub.tier,
        status: sub.status,
        daysRemaining: Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24)),
        features: this.getTierFeatures(sub.tier)
      };
      
    } catch (error) {
      console.error('❌ Error validating subscription:', error);
      return { valid: false, tier: 'free', reason: 'Validation error' };
    }
  }

  /**
   * Get feature usage limits
   */
  async getUsageLimits(userId, featureKey) {
    const tier = (await this.getUserPremiumStatus(userId)).tier;
    const config = this.premiumTiers[tier];
    
    if (featureKey === 'secret_phrases') {
      return {
        max: config.maxSecretPhrases,
        current: await this.getCurrentUsage(userId, 'secret_phrases'),
        remaining: config.maxSecretPhrases === 'unlimited' ? Infinity : 
                  config.maxSecretPhrases - await this.getCurrentUsage(userId, 'secret_phrases')
      };
    }
    
    if (featureKey === 'daily_parlays') {
      return {
        max: config.dailyParlayLimit,
        current: await this.getCurrentUsage(userId, 'daily_parlays'),
        remaining: config.dailyParlayLimit - await this.getCurrentUsage(userId, 'daily_parlays')
      };
    }
    
    return { max: Infinity, current: 0, remaining: Infinity };
  }

  async getCurrentUsage(userId, featureKey) {
    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database not connected, assuming zero usage');
        return 0;
      }
      
      const db = mongoose.connection.db;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const count = await db.collection('premium_usage').countDocuments({
        userId,
        featureKey,
        timestamp: { $gte: startOfDay }
      });
      
      return count;
    } catch (error) {
      return 0;
    }
  }
}

export default new PremiumFeaturesService();

