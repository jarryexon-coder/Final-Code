import express from 'express';
import * as generationController from '../controllers/generation.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Generation Status & Information
router.get('/generate/status', auth, generationController.getGenerationStatus);
router.get('/generate/eligibility', auth, generationController.checkEligibility);

// Core Generation Endpoints
router.post('/generate/daily', auth, generationController.generateDailySelections);
router.post('/generate/custom', auth, generationController.generateCustomSelections);
router.post('/generate/simulation', auth, generationController.generateSimulation);

// Advanced Generation Options
router.post('/generate/quick', auth, generationController.quickGenerate);
router.post('/generate/advanced', auth, generationController.advancedGenerate);
router.post('/generate/ai', auth, generationController.aiGenerate);

// Generation History
router.get('/generate/history', auth, generationController.getGenerationHistory);
router.get('/generate/:id', auth, generationController.getGenerationById);

// Generation Settings
router.get('/generate/settings', auth, generationController.getGenerationSettings);
router.put('/generate/settings', auth, generationController.updateGenerationSettings);

export default router;
