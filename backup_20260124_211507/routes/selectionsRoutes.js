import express from 'express';
import * as selectionsController from '../controllers/selections.controller.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Selections Management
router.get('/selections', auth, selectionsController.getAllSelections);
router.get('/selections/today', auth, selectionsController.getTodaySelections);
router.get('/selections/:id', auth, selectionsController.getSelectionById);
router.post('/selections', auth, selectionsController.createSelection);
router.put('/selections/:id', auth, selectionsController.updateSelection);
router.delete('/selections/:id', auth, selectionsController.deleteSelection);

// Winners Management
router.get('/selections/:id/winners', auth, selectionsController.getWinnersForSelection);
router.post('/selections/:id/winners', auth, selectionsController.addWinnerToSelection);
router.put('/winners/:winnerId', auth, selectionsController.updateWinner);
router.delete('/winners/:winnerId', auth, selectionsController.removeWinner);

// Batch Operations
router.post('/selections/batch', auth, selectionsController.createBatchSelections);
router.put('/selections/:id/status', auth, selectionsController.updateSelectionStatus);
router.post('/selections/:id/duplicate', auth, selectionsController.duplicateSelection);

// Selection Tracking
router.post('/selections/:id/track', auth, selectionsController.trackSelection);
router.post('/selections/:id/untrack', auth, selectionsController.untrackSelection);
router.get('/tracked-selections', auth, selectionsController.getTrackedSelections);

export default router;
