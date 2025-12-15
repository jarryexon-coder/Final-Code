import express from 'express';
import { 
    verifySubscription, 
    handleWebhook, 
    grantPromoAccess 
} from '../controllers/revenuecatController.js';

const router = express.Router();

// Public webhook endpoint (RevenueCat will POST here)
router.post('/webhook', handleWebhook);

// Protected routes (you'll add auth middleware later)
router.post('/verify', verifySubscription);
router.post('/promo', grantPromoAccess);

export default router;
