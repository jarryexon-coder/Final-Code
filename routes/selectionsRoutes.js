// selectionsRoutes.js - SAFE WORKING VERSION
import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "selections API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'selectionsRoutes.js is working',
        timestamp: new Date().toISOString()
    });
});

export default router;
