import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// User Management
router.get('/users', adminAuth, adminController.listUsers);
router.get('/users/:userId', adminAuth, adminController.getUserDetails);
router.get('/users/:userId/prizepicks', adminAuth, adminController.getUserPrizePicks);
router.post('/users/:userId/reset-limit', adminAuth, adminController.resetUserLimit);
router.put('/users/:userId/status', adminAuth, adminController.updateUserStatus);
router.delete('/users/:userId', adminAuth, adminController.deleteUser);

// Generation Management
router.post('/prizepicks/generate-batch', adminAuth, adminController.batchGenerateSelections);
router.get('/prizepicks/generation-stats', adminAuth, adminController.getGenerationStats);
router.delete('/prizepicks/:id', adminAuth, adminController.removeSelection);
router.post('/prizepicks/force-generate', adminAuth, adminController.forceGenerate);

// Analytics & Monitoring
router.get('/analytics/platform', adminAuth, adminController.getPlatformAnalytics);
router.get('/analytics/user-engagement', adminAuth, adminController.getUserEngagementMetrics);
router.get('/analytics/performance', adminAuth, adminController.getPerformanceAnalytics);
router.get('/analytics/revenue', adminAuth, adminController.getRevenueAnalytics);

// System Management
router.get('/system/status', adminAuth, adminController.getSystemStatus);
router.post('/system/maintenance', adminAuth, adminController.toggleMaintenance);
router.get('/system/logs', adminAuth, adminController.getSystemLogs);
router.post('/system/backup', adminAuth, adminController.createBackup);

// Content Management
router.post('/content/update', adminAuth, adminController.updateContent);
router.get('/content/audit', adminAuth, adminController.auditContent);

export default router;
