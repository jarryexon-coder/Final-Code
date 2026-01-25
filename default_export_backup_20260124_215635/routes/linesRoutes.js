import express from 'express';
import linesController from '../controllers/lines.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Line Discrepancies
router.get('/lines/discrepancies', auth, linesController.getLineDiscrepancies);
router.get('/lines/discrepancies/top', auth, linesController.getTopDiscrepancies);
router.get('/lines/discrepancies/:sport', auth, linesController.getSportDiscrepancies);

// Player Line Analysis
router.get('/lines/player/:playerId', auth, linesController.getPlayerLines);
router.get('/lines/player/:playerId/history', auth, linesController.getPlayerLineHistory);
router.get('/lines/player/:playerId/comparison', auth, linesController.getPlayerComparison);

// Custom Line Analysis
router.post('/lines/analyze', auth, linesController.analyzeCustomLines);
router.post('/lines/compare', auth, linesController.compareLines);
router.post('/lines/validate', auth, linesController.validateLine);

// Edge Calculation
router.get('/edge/calculate', auth, linesController.calculateEdge);
router.get('/edge/top-opportunities', auth, linesController.getTopEdgeOpportunities);
router.get('/edge/opportunities/:sport', auth, linesController.getSportEdgeOpportunities);

// Real-time Line Monitoring
router.get('/lines/monitor/:lineId', auth, linesController.monitorLine);
router.post('/lines/alert', auth, linesController.setLineAlert);
router.get('/lines/alerts', auth, linesController.getLineAlerts);

export default router;
