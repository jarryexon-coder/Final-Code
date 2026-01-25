import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// In-memory notification store (in production, use database)
const notificationsStore = new Map();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50 } = req.query;
    
    let notifications = notificationsStore.get(req.userId) || [];
    
    // Filter if only unread
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Apply limit
    notifications = notifications.slice(0, parseInt(limit));
    
    // Count unread
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: notifications.length,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { notificationIds, markAll = false } = req.body;
    
    let notifications = notificationsStore.get(req.userId) || [];
    
    if (markAll) {
      // Mark all as read
      notifications = notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: new Date().toISOString()
      }));
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      notifications = notifications.map(notification => {
        if (notificationIds.includes(notification.id)) {
          return {
            ...notification,
            read: true,
            readAt: new Date().toISOString()
          };
        }
        return notification;
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide notificationIds array or set markAll to true'
      });
    }
    
    notificationsStore.set(req.userId, notifications);
    
    res.json({
      success: true,
      message: markAll ? 'All notifications marked as read' : 'Notifications marked as read',
      updatedCount: markAll ? notifications.length : notificationIds.length
    });
    
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let notifications = notificationsStore.get(req.userId) || [];
    const initialLength = notifications.length;
    
    notifications = notifications.filter(notification => notification.id !== id);
    
    notificationsStore.set(req.userId, notifications);
    
    res.json({
      success: true,
      message: 'Notification deleted',
      deleted: initialLength > notifications.length
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// POST /api/notifications/preferences
router.post('/preferences', authenticate, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.preferences
    });
    
  } catch (error) {
    console.error('Preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// GET /api/notifications/test
router.get('/test', authenticate, async (req, res) => {
  try {
    // Generate test notifications
    const testNotifications = [
      {
        id: `test_${Date.now()}_1`,
        type: 'bump_alert',
        title: 'Bump Risk Alert',
        message: 'LeBron James points line moved from 25.5 to 26.5',
        data: {
          player: 'LeBron James',
          market: 'points',
          oldLine: 25.5,
          newLine: 26.5,
          movement: '+1.0'
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: `test_${Date.now()}_2`,
        type: 'line_movement',
        title: 'Line Movement',
        message: 'Stephen Curry assists line trending down',
        data: {
          player: 'Stephen Curry',
          market: 'assists',
          trend: 'down',
          change: -0.5
        },
        priority: 'medium',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: `test_${Date.now()}_3`,
        type: 'daily_reset',
        title: 'Daily Reset',
        message: 'Your 2 daily selections have been reset',
        data: {
          selectionsAvailable: 2,
          resetTime: new Date().toISOString()
        },
        priority: 'low',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
    
    // Store test notifications
    const currentNotifications = notificationsStore.get(req.userId) || [];
    notificationsStore.set(req.userId, [...testNotifications, ...currentNotifications]);
    
    res.json({
      success: true,
      message: 'Test notifications created',
      notifications: testNotifications
    });
    
  } catch (error) {
    console.error('Test notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test notifications'
    });
  }
});

// WebSocket endpoint for getting connection token
router.get('/ws/token', authenticate, async (req, res) => {
  try {
    // Generate a short-lived token for WebSocket authentication
    const wsToken = jwt.sign(
      { userId: req.userId, type: 'websocket' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token: wsToken,
      expiresIn: '1 hour',
      websocketUrl: `ws://${req.headers.host}?token=${wsToken}`
    });
    
  } catch (error) {
    console.error('WebSocket token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WebSocket token'
    });
  }
});

// Helper function to create notification
export function createNotification(userId, notification) {
  const defaultNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'medium'
  };
  
  const fullNotification = { ...defaultNotification, ...notification };
  
  const userNotifications = notificationsStore.get(userId) || [];
  userNotifications.unshift(fullNotification); // Add to beginning
  notificationsStore.set(userId, userNotifications.slice(0, 100)); // Keep last 100
  
  return fullNotification;
}

// Helper function to get notification types
export function getNotificationTypes() {
  return {
    bump_alert: {
      name: 'Bump Alert',
      description: 'Notifications when lines move significantly',
      defaultEnabled: true,
      priority: 'high'
    },
    line_movement: {
      name: 'Line Movement',
      description: 'General line movement notifications',
      defaultEnabled: true,
      priority: 'medium'
    },
    daily_reset: {
      name: 'Daily Reset',
      description: 'Notification when daily selections reset',
      defaultEnabled: true,
      priority: 'low'
    },
    selection_result: {
      name: 'Selection Result',
      description: 'Notifications when selection results are available',
      defaultEnabled: true,
      priority: 'medium'
    },
    system: {
      name: 'System',
      description: 'System notifications and updates',
      defaultEnabled: true,
      priority: 'low'
    },
    promotional: {
      name: 'Promotional',
      description: 'Promotional offers and updates',
      defaultEnabled: false,
      priority: 'low'
    }
  };
}

export default router;
