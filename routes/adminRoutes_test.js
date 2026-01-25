// adminRoutes_test.js - SAFE WORKING VERSION
import express from 'express';
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'adminRoutes_test.js is working',
        timestamp: new Date().toISOString()
    });
});

export default router;
