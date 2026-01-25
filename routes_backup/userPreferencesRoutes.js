import express from 'express';
import * as preferencesController from '../controllers/preferences.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// PrizePicks Preferences
router.get('/preferences/prizepicks', auth, preferencesController.getPrizePicksPreferences);
router.put('/preferences/prizepicks', auth, preferencesController.updatePrizePicksPreferences);

// Daily Reminders
router.get('/settings/daily-reminder', auth, preferencesController.getDailyReminderSettings);
router.put('/settings/daily-reminder', auth, preferencesController.updateDailyReminderSettings);

// Data Management
router.post('/settings/export-data', auth, preferencesController.exportUserData);
router.delete('/settings/delete-data', auth, preferencesController.deleteUserData);
router.get('/settings/data-usage', auth, preferencesController.getDataUsage);

// Privacy Settings
router.get('/settings/privacy', auth, preferencesController.getPrivacySettings);
router.put('/settings/privacy', auth, preferencesController.updatePrivacySettings);

// Notification Settings
router.get('/settings/notifications', auth, preferencesController.getNotificationSettings);
router.put('/settings/notifications', auth, preferencesController.updateNotificationSettings);

// Display Preferences
router.get('/settings/display', auth, preferencesController.getDisplayPreferences);
router.put('/settings/display', auth, preferencesController.updateDisplayPreferences);

export default router;
