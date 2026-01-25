import express from 'express';
import historyController from '../controllers/history.controller.js'; // Use default import
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Daily History
router.get('/history/daily/:date', auth, historyController.getDailyHistory);
router.get('/history/daily', auth, historyController.getTodayHistory);

// Weekly Archive
router.get('/history/weekly/:week', auth, historyController.getWeeklyArchive);
router.get('/history/weekly', auth, historyController.getCurrentWeekArchive);

// Monthly Archive
router.get('/history/monthly/:month', auth, historyController.getMonthlyArchive);
router.get('/history/monthly', auth, historyController.getCurrentMonthArchive);

// Yearly Overview
router.get('/history/yearly/:year', auth, historyController.getYearlyOverview);

// Archive Operations
router.post('/history/archive', auth, historyController.archiveSelections);
router.get('/history/archived', auth, historyController.getArchivedSelections);
router.post('/history/restore', auth, historyController.restoreFromArchive);
router.delete('/history/cleanup', auth, historyController.cleanupOldData);

// Historical Analysis
router.get('/history/analysis/period', auth, historyController.analyzePeriod);
router.get('/history/analysis/trends', auth, historyController.getHistoricalTrends);
router.get('/history/analysis/comparison', auth, historyController.compareHistoricalPeriods);

export default router;
