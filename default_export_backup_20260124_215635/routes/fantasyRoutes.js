// src/routes/fantasyRoutes.js
import express from 'express';
import { getSnakeDraft, getTurnDraft, generateOptimalDraft } from '../controllers/fantasyDraftController.js';

const router = express.Router();

// NEW ROUTES
router.get('/snake/:position', getSnakeDraft);
router.get('/turn/:position', getTurnDraft);
router.post('/optimal-draft', generateOptimalDraft);

export default router;
