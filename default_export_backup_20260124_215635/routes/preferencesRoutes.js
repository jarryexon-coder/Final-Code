// routes/preferencesRoutes.js
import express from 'express';
import * as preferencesController from '../controllers/preferences.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user preferences
router.get('/:userId', preferencesController.getUserPreferences);

// Update all preferences
router.put('/:userId', preferencesController.updateUserPreferences);

// Update favorite teams for a specific sport
router.put('/:userId/favorite-teams/:sport', preferencesController.updateFavoriteTeams);

// Update favorite players for a specific sport
router.put('/:userId/favorite-players/:sport', preferencesController.updateFavoritePlayers);

// Update notification preferences
router.put('/:userId/notifications', preferencesController.updateNotificationPreferences);

// Update app settings
router.put('/:userId/app-settings', preferencesController.updateAppSettings);

// Update bet preferences
router.put('/:userId/bet-preferences', preferencesController.updateBetPreferences);

// Get personalized recommendations
router.get('/:userId/recommendations', preferencesController.getPersonalizedRecommendations);

// Reset to defaults
router.delete('/:userId/reset', preferencesController.resetPreferences);

// Import preferences
router.post('/:userId/import', preferencesController.importPreferences);

export default router;
