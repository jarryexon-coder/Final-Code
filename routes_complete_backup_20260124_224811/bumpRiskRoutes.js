import express from 'express';
import * as bumpRiskController from '../controllers/bumpRisk.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Active Bump Risks
router.get('/bump-risk/active', auth, bumpRiskController.getActiveBumpRisks);
router.get('/bump-risk/pending', auth, bumpRiskController.getPendingBumpRisks);
router.get('/bump-risk/resolved', auth, bumpRiskController.getResolvedBumpRisks);

// Bump Risk Monitoring
router.post('/bump-risk/monitor', auth, bumpRiskController.startMonitoring);
router.put('/bump-risk/:id', auth, bumpRiskController.updateBumpRiskStatus);
router.delete('/bump-risk/:id', auth, bumpRiskController.stopMonitoring);

// Bump Risk History
router.get('/bump-risk/history', auth, bumpRiskController.getBumpRiskHistory);
router.get('/bump-risk/:id/history', auth, bumpRiskController.getBumpRiskDetailHistory);

// Bump Risk Analysis
router.post('/bump-risk/analyze', auth, bumpRiskController.analyzeBumpRisk);
router.get('/bump-risk/stats', auth, bumpRiskController.getBumpRiskStats);
router.get('/bump-risk/trends', auth, bumpRiskController.getBumpRiskTrends);

// Bump Risk Alerts
router.post('/bump-risk/alerts/settings', auth, bumpRiskController.updateAlertSettings);
router.get('/bump-risk/alerts', auth, bumpRiskController.getBumpRiskAlerts);

export default router;
