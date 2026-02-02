// sportsDataRoutes.js - SAFE WORKING VERSION
import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "sportsData API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'sportsDataRoutes.js is working',
        timestamp: new Date().toISOString()
    });
});

export default router;
