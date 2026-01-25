import express from 'express';
import {
  trackSelection,
  trackSimulation,
  trackGeneration,
  getDailyPerformance,
  getWeeklyPerformance,
  getMonthlyPerformance,
  getAllTimePerformance,
  getSelectionSuccessRate,
  getSelectionsByType,
  getSelectionsBySport,
  getSelectionsByConfidence,
  getUserAnalytics,
  getUserComparison,
  getUserStreaks,
  getSimulationResults,
  getSimulationHistory,
  getSimulationAccuracy,
  getEdgeAnalysis,
  getBumpRiskStats,
  getLineDiscrepancyAnalysis,
  exportAnalytics
} from '../controllers/analytics.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Analytics tracking
router.post('/track/selection', auth, trackSelection);
router.post('/track/simulation', auth, trackSimulation);
router.post('/track/generation', auth, trackGeneration);

// Analytics retrieval
router.get('/performance/daily', auth, getDailyPerformance);
router.get('/performance/weekly', auth, getWeeklyPerformance);
router.get('/performance/monthly', auth, getMonthlyPerformance);
router.get('/performance/all-time', auth, getAllTimePerformance);

// Selection analytics
router.get('/selections/success-rate', auth, getSelectionSuccessRate);
router.get('/selections/by-type', auth, getSelectionsByType);
router.get('/selections/by-sport', auth, getSelectionsBySport);
router.get('/selections/by-confidence', auth, getSelectionsByConfidence);

// User analytics
router.get('/user/stats', auth, getUserAnalytics);
router.get('/user/comparison', auth, getUserComparison);
router.get('/user/streaks', auth, getUserStreaks);

// Simulation analytics
router.get('/simulation/results', auth, getSimulationResults);
router.get('/simulation/history', auth, getSimulationHistory);
router.get('/simulation/accuracy', auth, getSimulationAccuracy);

// Edge & Bump Risk analytics
router.get('/edge/analysis', auth, getEdgeAnalysis);
router.get('/bump-risk/stats', auth, getBumpRiskStats);
router.get('/line-discrepancy', auth, getLineDiscrepancyAnalysis);

// Export & reporting
router.post('/export', auth, exportAnalytics);

// NOTE: The following routes reference functions that don't exist in analytics.controller.js
// You'll need to either implement them or remove these routes:
// router.get('/generation/stats', auth, analyticsController.getGenerationStats);
// router.get('/generation/success', auth, analyticsController.getGenerationSuccess);
// router.get('/generation/patterns', auth, analyticsController.getGenerationPatterns);
// router.get('/payouts/summary', auth, analyticsController.getPayoutSummary);
// router.get('/payouts/by-multiplier', auth, analyticsController.getPayoutsByMultiplier);
// router.get('/payouts/optimal', auth, analyticsController.getOptimalPayouts);
// router.get('/trends/daily', auth, analyticsController.getDailyTrends);
// router.get('/trends/weekly', auth, analyticsController.getWeeklyTrends);
// router.get('/trends/monthly', auth, analyticsController.getMonthlyTrends);
// router.get('/models/performance', auth, analyticsController.getModelPerformance);
// router.get('/models/accuracy', auth, analyticsController.getModelAccuracy);
// router.get('/models/comparison', auth, analyticsController.getModelComparison);
// router.get('/report/daily', auth, analyticsController.getDailyReport);
// router.get('/report/weekly', auth, analyticsController.getWeeklyReport);
// router.get('/report/monthly', auth, analyticsController.getMonthlyReport);
// router.get('/realtime/active', auth, analyticsController.getRealTimeAnalytics);
// router.post('/realtime/event', auth, analyticsController.logRealTimeEvent);

export default router;
