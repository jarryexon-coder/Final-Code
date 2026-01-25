import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// GET /api/prizepicks/daily-limits
router.get('/daily-limits', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if daily reset is needed (reset at 9 AM UTC)
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    const shouldReset = now.getUTCHours() >= 9 && 
                      (now.getUTCDate() !== lastReset.getUTCDate() || 
                       now.getUTCMonth() !== lastReset.getUTCMonth() ||
                       now.getUTCFullYear() !== lastReset.getUTCFullYear());
    
    if (shouldReset) {
      user.selectionsUsed = 0;
      user.lastReset = now;
      await user.save();
    }
    
    const selectionsLeft = Math.max(0, user.dailySelections - user.selectionsUsed);
    const resetTime = new Date(now);
    resetTime.setUTCHours(9, 0, 0, 0);
    if (now.getUTCHours() >= 9) {
      resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    }
    
    res.json({
      success: true,
      limits: {
        selectionsLeft,
        selectionsUsed: user.selectionsUsed,
        dailySelections: user.dailySelections,
        resetsAt: resetTime.toISOString(),
        todaySelections: user.selectionsUsed,
        winnersToday: 0 // You'll need to track this separately
      }
    });
    
  } catch (error) {
    console.error('Daily limits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily limits'
    });
  }
});

// POST /api/prizepicks/reset-daily-limit (admin only)
router.post('/reset-daily-limit', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.body;
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }
    
    targetUser.selectionsUsed = 0;
    targetUser.lastReset = new Date();
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'Daily limit reset successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        selectionsUsed: targetUser.selectionsUsed,
        lastReset: targetUser.lastReset
      }
    });
    
  } catch (error) {
    console.error('Reset limit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset daily limit'
    });
  }
});

export default router;
