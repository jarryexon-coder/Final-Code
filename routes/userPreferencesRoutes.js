// userPreferencesRoutes.js - User preferences and notification settings
import express from 'express';
const router = express.Router();

/**
 * @swagger
 * /api/user-preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Retrieve current user preferences including display settings, favorite teams, and default views
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 preferences:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', (req, res) => {
  // Mock implementation - Replace with your actual logic
  res.json({ 
    success: true, 
    message: 'Get user preferences',
    preferences: {
      userId: req.user?.id || 'demo-user',
      displaySettings: {
        theme: 'dark',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        notificationsEnabled: true
      },
      sportsPreferences: {
        favoriteSports: ['NBA', 'NFL'],
        favoriteTeams: ['LAL', 'KC'],
        defaultLeague: 'NBA'
      },
      dataPreferences: {
        defaultOddsFormat: 'american',
        showAdvancedStats: true,
        autoRefresh: true,
        refreshInterval: 30
      }
    }
  });
});

/**
 * @swagger
 * /api/user-preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences including display settings, favorite teams, and sports preferences
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferencesInput'
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedPreferences:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.put('/', (req, res) => {
  // Mock implementation - Replace with your actual logic
  const updatedPreferences = {
    userId: req.user?.id || 'demo-user',
    ...req.body,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({ 
    success: true, 
    message: 'Update user preferences',
    data: req.body,
    updatedPreferences
  });
});

/**
 * @swagger
 * /api/user-preferences/notifications:
 *   get:
 *     summary: Get notification settings
 *     description: Retrieve user's notification preferences including email, push, and SMS settings
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notifications:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.get('/notifications', (req, res) => {
  // Mock implementation - Replace with your actual logic
  res.json({ 
    success: true, 
    message: 'Get notification settings',
    notifications: {
      userId: req.user?.id || 'demo-user',
      emailNotifications: {
        enabled: true,
        gameAlerts: true,
        scoreUpdates: true,
        newsDigest: true,
        marketingEmails: false
      },
      pushNotifications: {
        enabled: true,
        favoriteTeams: true,
        breakingNews: true,
        betAlerts: true,
        gameStart: true
      },
      smsNotifications: {
        enabled: false,
        gameResults: false,
        urgentAlerts: true
      },
      notificationSchedule: {
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
          timezone: 'America/New_York'
        },
        dailyDigest: '08:00'
      },
      notificationChannels: {
        favorites: ['push', 'email'],
        priorityOrder: ['push', 'sms', 'email']
      }
    }
  });
});

/**
 * @swagger
 * /api/user-preferences/notifications:
 *   put:
 *     summary: Update notification settings
 *     description: Update user's notification preferences for email, push, SMS, and scheduling
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationSettingsInput'
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedNotifications:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.put('/notifications', (req, res) => {
  // Mock implementation - Replace with your actual logic
  const updatedNotifications = {
    userId: req.user?.id || 'demo-user',
    ...req.body,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({ 
    success: true, 
    message: 'Update notification settings',
    data: req.body,
    updatedNotifications
  });
});

/**
 * @swagger
 * /api/user-preferences/favorites:
 *   get:
 *     summary: Get user favorites
 *     description: Retrieve user's favorite teams, players, and leagues
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 favorites:
 *                   $ref: '#/components/schemas/UserFavorites'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.get('/favorites', (req, res) => {
  // New endpoint for favorites
  res.json({
    success: true,
    favorites: {
      userId: req.user?.id || 'demo-user',
      teams: [
        { id: 'LAL', name: 'Los Angeles Lakers', sport: 'NBA' },
        { id: 'KC', name: 'Kansas City Chiefs', sport: 'NFL' }
      ],
      players: [
        { id: 'lebron-james', name: 'LeBron James', team: 'LAL', sport: 'NBA' },
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'KC', sport: 'NFL' }
      ],
      leagues: ['NBA', 'NFL', 'NHL'],
      lastUpdated: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/user-preferences/theme:
 *   get:
 *     summary: Get theme preferences
 *     description: Retrieve user's UI theme and display preferences
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theme preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 theme:
 *                   $ref: '#/components/schemas/ThemePreferences'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
router.get('/theme', (req, res) => {
  // New endpoint for theme preferences
  res.json({
    success: true,
    theme: {
      userId: req.user?.id || 'demo-user',
      mode: 'dark',
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      fontSize: 'medium',
      compactMode: false,
      animationsEnabled: true,
      customCSS: null,
      lastUpdated: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreferences:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         displaySettings:
 *           $ref: '#/components/schemas/DisplaySettings'
 *         sportsPreferences:
 *           $ref: '#/components/schemas/SportsPreferences'
 *         dataPreferences:
 *           $ref: '#/components/schemas/DataPreferences'
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     
 *     UserPreferencesInput:
 *       type: object
 *       properties:
 *         displaySettings:
 *           $ref: '#/components/schemas/DisplaySettings'
 *         sportsPreferences:
 *           $ref: '#/components/schemas/SportsPreferences'
 *         dataPreferences:
 *           $ref: '#/components/schemas/DataPreferences'
 *     
 *     DisplaySettings:
 *       type: object
 *       properties:
 *         theme:
 *           type: string
 *           enum: [light, dark, auto]
 *           default: dark
 *         timezone:
 *           type: string
 *           default: America/New_York
 *         dateFormat:
 *           type: string
 *           enum: [MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD]
 *           default: MM/DD/YYYY
 *         notificationsEnabled:
 *           type: boolean
 *           default: true
 *     
 *     SportsPreferences:
 *       type: object
 *       properties:
 *         favoriteSports:
 *           type: array
 *           items:
 *             type: string
 *           example: [NBA, NFL]
 *         favoriteTeams:
 *           type: array
 *           items:
 *             type: string
 *           example: [LAL, KC]
 *         defaultLeague:
 *           type: string
 *           example: NBA
 *     
 *     DataPreferences:
 *       type: object
 *       properties:
 *         defaultOddsFormat:
 *           type: string
 *           enum: [american, decimal, fractional]
 *           default: american
 *         showAdvancedStats:
 *           type: boolean
 *           default: true
 *         autoRefresh:
 *           type: boolean
 *           default: true
 *         refreshInterval:
 *           type: integer
 *           minimum: 10
 *           maximum: 300
 *           default: 30
 *     
 *     NotificationSettings:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         emailNotifications:
 *           $ref: '#/components/schemas/EmailNotifications'
 *         pushNotifications:
 *           $ref: '#/components/schemas/PushNotifications'
 *         smsNotifications:
 *           $ref: '#/components/schemas/SmsNotifications'
 *         notificationSchedule:
 *           $ref: '#/components/schemas/NotificationSchedule'
 *         notificationChannels:
 *           $ref: '#/components/schemas/NotificationChannels'
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     
 *     NotificationSettingsInput:
 *       type: object
 *       properties:
 *         emailNotifications:
 *           $ref: '#/components/schemas/EmailNotifications'
 *         pushNotifications:
 *           $ref: '#/components/schemas/PushNotifications'
 *         smsNotifications:
 *           $ref: '#/components/schemas/SmsNotifications'
 *         notificationSchedule:
 *           $ref: '#/components/schemas/NotificationSchedule'
 *         notificationChannels:
 *           $ref: '#/components/schemas/NotificationChannels'
 *     
 *     EmailNotifications:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *           default: true
 *         gameAlerts:
 *           type: boolean
 *           default: true
 *         scoreUpdates:
 *           type: boolean
 *           default: true
 *         newsDigest:
 *           type: boolean
 *           default: true
 *         marketingEmails:
 *           type: boolean
 *           default: false
 *     
 *     PushNotifications:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *           default: true
 *         favoriteTeams:
 *           type: boolean
 *           default: true
 *         breakingNews:
 *           type: boolean
 *           default: true
 *         betAlerts:
 *           type: boolean
 *           default: true
 *         gameStart:
 *           type: boolean
 *           default: true
 *     
 *     SmsNotifications:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *           default: false
 *         gameResults:
 *           type: boolean
 *           default: false
 *         urgentAlerts:
 *           type: boolean
 *           default: true
 *     
 *     NotificationSchedule:
 *       type: object
 *       properties:
 *         quietHours:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               default: true
 *             start:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               example: '22:00'
 *             end:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               example: '07:00'
 *             timezone:
 *               type: string
 *               example: America/New_York
 *         dailyDigest:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example: '08:00'
 *     
 *     NotificationChannels:
 *       type: object
 *       properties:
 *         favorites:
 *           type: array
 *           items:
 *             type: string
 *             enum: [push, sms, email]
 *           example: [push, email]
 *         priorityOrder:
 *           type: array
 *           items:
 *             type: string
 *             enum: [push, sms, email]
 *           example: [push, sms, email]
 *     
 *     UserFavorites:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         teams:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               sport:
 *                 type: string
 *         players:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               team:
 *                 type: string
 *               sport:
 *                 type: string
 *         leagues:
 *           type: array
 *           items:
 *             type: string
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     
 *     ThemePreferences:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         mode:
 *           type: string
 *           enum: [light, dark, auto]
 *         primaryColor:
 *           type: string
 *           pattern: '^#[0-9a-fA-F]{6}$'
 *         secondaryColor:
 *           type: string
 *           pattern: '^#[0-9a-fA-F]{6}$'
 *         fontSize:
 *           type: string
 *           enum: [small, medium, large]
 *         compactMode:
 *           type: boolean
 *         animationsEnabled:
 *           type: boolean
 *         customCSS:
 *           type: string
 *           nullable: true
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;
