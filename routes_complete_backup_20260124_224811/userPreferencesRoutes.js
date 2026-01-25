// userPreferencesRoutes.js - Simple working version
import express from 'express';
const router = express.Router();

// Simple endpoints
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Get user preferences' });
});

router.put('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Update user preferences',
        data: req.body 
    });
});

router.get('/notifications', (req, res) => {
    res.json({ success: true, message: 'Get notification settings' });
});

router.put('/notifications', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Update notification settings',
        data: req.body 
    });
});

export default router;
