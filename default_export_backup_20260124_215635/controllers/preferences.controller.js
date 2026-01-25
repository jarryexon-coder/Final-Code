// controllers/preferences.controller.js - COMPLETE VERSION
import User from '../models/user.js';
import UserPreferences from '../models/UserPreferences.js';
import { redisClient } from '../config/redis.js';

// Get user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    // Check cache first
    const cacheKey = `preferences:${userId}`;
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached)
        });
      }
    }

    // Get user preferences or create default
    let preferences = await UserPreferences.findOne({ userId })
      .populate('userId', 'username email name')
      .lean();

    if (!preferences) {
      // Create default preferences
      preferences = new UserPreferences({
        userId,
        notifications: getDefaultNotificationSettings(),
        privacy: getDefaultPrivacySettings(),
        theme: getDefaultThemeSettings(),
        display: getDefaultDisplaySettings(),
        betting: getDefaultBettingSettings()
      });
      await preferences.save();
      
      // Populate after save
      preferences = await UserPreferences.findOne({ userId })
        .populate('userId', 'username email name')
        .lean();
    }

    // Cache the preferences
    if (redisClient) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(preferences)); // 1 hour cache
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user preferences', error: error.message });
  }
};

// Update preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { category, updates } = req.body;

    // Validate category
    const validCategories = ['notifications', 'privacy', 'theme', 'display', 'betting', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Find or create preferences
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        notifications: getDefaultNotificationSettings(),
        privacy: getDefaultPrivacySettings(),
        theme: getDefaultThemeSettings(),
        display: getDefaultDisplaySettings(),
        betting: getDefaultBettingSettings()
      });
    }

    // Update the specific category
    if (category === 'general') {
      // General updates go to root
      Object.keys(updates).forEach(key => {
        if (key in preferences) {
          preferences[key] = updates[key];
        }
      });
    } else {
      // Category-specific updates
      if (!preferences[category]) {
        preferences[category] = {};
      }
      Object.keys(updates).forEach(key => {
        preferences[category][key] = updates[key];
      });
    }

    preferences.updatedAt = new Date();
    await preferences.save();

    // Clear cache
    if (redisClient) {
      await redisClient.del(`preferences:${userId}`);
    }

    // Populate for response
    const populatedPreferences = await UserPreferences.findOne({ userId })
      .populate('userId', 'username email');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: populatedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences', error: error.message });
  }
};

// Reset preferences
export const resetPreferences = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { category = 'all' } = req.body;

    let preferences = await UserPreferences.findOne({ userId });
    
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'No preferences found to reset'
      });
    }

    if (category === 'all') {
      // Reset all preferences to defaults
      preferences.notifications = getDefaultNotificationSettings();
      preferences.privacy = getDefaultPrivacySettings();
      preferences.theme = getDefaultThemeSettings();
      preferences.display = getDefaultDisplaySettings();
      preferences.betting = getDefaultBettingSettings();
    } else {
      // Reset specific category
      switch (category) {
        case 'notifications':
          preferences.notifications = getDefaultNotificationSettings();
          break;
        case 'privacy':
          preferences.privacy = getDefaultPrivacySettings();
          break;
        case 'theme':
          preferences.theme = getDefaultThemeSettings();
          break;
        case 'display':
          preferences.display = getDefaultDisplaySettings();
          break;
        case 'betting':
          preferences.betting = getDefaultBettingSettings();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid category. Must be: notifications, privacy, theme, display, betting, or all`
          });
      }
    }

    preferences.updatedAt = new Date();
    await preferences.save();

    // Clear cache
    if (redisClient) {
      await redisClient.del(`preferences:${userId}`);
    }

    res.json({
      success: true,
      message: `Preferences${category === 'all' ? '' : ' category: ' + category} reset to defaults`,
      data: {
        category,
        resetAt: new Date()
      }
    });
  } catch (error) {
    console.error('Reset preferences error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset preferences', error: error.message });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const preferences = await UserPreferences.findOne({ userId })
      .select('notifications userId')
      .populate('userId', 'username email')
      .lean();

    if (!preferences) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          userId,
          notifications: getDefaultNotificationSettings(),
          message: 'Using default notification settings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userId: preferences.userId,
        notifications: preferences.notifications || getDefaultNotificationSettings()
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification settings', error: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const updates = req.body;

    // Validate notification types
    const validTypes = [
      'email', 'push', 'inApp', 'sms',
      'selectionAlerts', 'priceAlerts', 'systemAlerts',
      'promotional', 'security', 'social'
    ];

    Object.keys(updates).forEach(key => {
      if (!validTypes.includes(key) && !key.includes('.')) {
        return res.status(400).json({
          success: false,
          message: `Invalid notification type: ${key}`
        });
      }
    });

    // Find or create preferences
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        notifications: getDefaultNotificationSettings()
      });
    }

    // Update notification settings
    if (!preferences.notifications) {
      preferences.notifications = getDefaultNotificationSettings();
    }

    // Apply updates (supports dot notation for nested properties)
    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        // Handle nested properties
        const parts = key.split('.');
        let target = preferences.notifications;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]]) {
            target[parts[i]] = {};
          }
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = updates[key];
      } else {
        preferences.notifications[key] = updates[key];
      }
    });

    preferences.updatedAt = new Date();
    await preferences.save();

    // Clear cache
    if (redisClient) {
      await redisClient.del(`preferences:${userId}`);
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        userId,
        notifications: preferences.notifications
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification settings', error: error.message });
  }
};

// Get privacy settings
export const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const preferences = await UserPreferences.findOne({ userId })
      .select('privacy userId')
      .populate('userId', 'username email')
      .lean();

    if (!preferences) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          userId,
          privacy: getDefaultPrivacySettings(),
          message: 'Using default privacy settings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userId: preferences.userId,
        privacy: preferences.privacy || getDefaultPrivacySettings()
      }
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get privacy settings', error: error.message });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const updates = req.body;

    // Validate privacy settings
    const validSettings = [
      'profileVisibility', 'activityVisibility', 'selectionVisibility',
      'dataSharing', 'thirdPartySharing', 'dataRetention',
      'locationSharing', 'contactVisibility', 'searchVisibility'
    ];

    Object.keys(updates).forEach(key => {
      if (!validSettings.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Invalid privacy setting: ${key}`
        });
      }
    });

    // Find or create preferences
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        privacy: getDefaultPrivacySettings()
      });
    }

    // Update privacy settings
    if (!preferences.privacy) {
      preferences.privacy = getDefaultPrivacySettings();
    }

    Object.keys(updates).forEach(key => {
      preferences.privacy[key] = updates[key];
    });

    preferences.updatedAt = new Date();
    await preferences.save();

    // Clear cache
    if (redisClient) {
      await redisClient.del(`preferences:${userId}`);
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        userId,
        privacy: preferences.privacy
      }
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update privacy settings', error: error.message });
  }
};

// Get theme settings
export const getThemeSettings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const preferences = await UserPreferences.findOne({ userId })
      .select('theme userId')
      .populate('userId', 'username email')
      .lean();

    if (!preferences) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          userId,
          theme: getDefaultThemeSettings(),
          message: 'Using default theme settings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userId: preferences.userId,
        theme: preferences.theme || getDefaultThemeSettings()
      }
    });
  } catch (error) {
    console.error('Get theme settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get theme settings', error: error.message });
  }
};

// Helper functions for default settings
const getDefaultNotificationSettings = () => {
  return {
    email: {
      enabled: true,
      frequency: 'daily',
      types: {
        selectionAlerts: true,
        priceAlerts: false,
        systemAlerts: true,
        promotional: false,
        security: true
      }
    },
    push: {
      enabled: true,
      types: {
        selectionAlerts: true,
        priceAlerts: true,
        systemAlerts: true,
        social: false
      }
    },
    inApp: {
      enabled: true,
      types: {
        all: true
      }
    },
    sms: {
      enabled: false,
      types: {
        urgentAlerts: true,
        security: true
      }
    },
    sound: {
      enabled: true,
      volume: 80
    },
    doNotDisturb: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  };
};

const getDefaultPrivacySettings = () => {
  return {
    profileVisibility: 'friends', // public, friends, private
    activityVisibility: 'friends',
    selectionVisibility: 'private',
    dataSharing: {
      analytics: true,
      improveService: true,
      marketing: false
    },
    thirdPartySharing: false,
    dataRetention: '30days', // 30days, 90days, 1year, forever
    locationSharing: false,
    contactVisibility: 'friends',
    searchVisibility: true
  };
};

const getDefaultThemeSettings = () => {
  return {
    mode: 'system', // light, dark, system
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontSize: 'medium', // small, medium, large
    density: 'comfortable', // compact, comfortable, spacious
    animations: true,
    reduceMotion: false,
    highContrast: false
  };
};

const getDefaultDisplaySettings = () => {
  return {
    defaultView: 'dashboard', // dashboard, selections, analytics, etc.
    cardsPerRow: 3,
    showImages: true,
    imageQuality: 'auto', // low, medium, high, auto
    autoPlayVideos: false,
    showTrending: true,
    showRecommendations: true,
    language: 'en',
    timezone: 'auto',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h' // 12h or 24h
  };
};

const getDefaultBettingSettings = () => {
  return {
    defaultUnits: 1,
    maxUnitsPerDay: 10,
    maxRiskPerDay: 100,
    autoCashOut: {
      enabled: false,
      percentage: 80
    },
    bankrollManagement: {
      method: 'fixed', // fixed, percentage, kelly
      percentage: 2
    },
    preferredSports: ['NBA', 'NFL'],
    excludedSports: [],
    oddsFormat: 'american', // american, decimal, fractional
    defaultSort: 'value', // value, confidence, odds
    showAdvancedStats: true,
    showTrendLines: true
  };
};

// Default export
export default {
  getUserPreferences,
  updatePreferences,
  resetPreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  getThemeSettings
};
