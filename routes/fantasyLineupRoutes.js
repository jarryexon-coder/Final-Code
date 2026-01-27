import express from 'express';
import fantasyLineupController from '../controllers/fantasyLineupController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting
const lineupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    error: 'Too many lineup requests. Please try again later.'
  }
});

// Generate optimal lineup
router.post('/generate', authenticateToken, lineupLimiter, async (req, res) => {
  await fantasyLineupController.generateOptimalLineup(req, res);
});

// Analyze existing lineup
router.post('/analyze', authenticateToken, async (req, res) => {
  await fantasyLineupController.analyzeLineup(req, res);
});

// Get user's saved lineups
router.get('/saved', authenticateToken, async (req, res) => {
  await fantasyLineupController.getSavedLineups(req, res);
});

// Export lineup
router.get('/export/:lineupId/:format', authenticateToken, async (req, res) => {
  await fantasyLineupController.exportLineup(req, res);
});

// Delete lineup
router.delete('/:lineupId', authenticateToken, async (req, res) => {
  try {
    const { lineupId } = req.params;
    const lineup = await FantasyLineup.findById(lineupId);
    
    if (!lineup) {
      return res.status(404).json({
        success: false,
        error: 'Lineup not found'
      });
    }

    // Check ownership
    if (lineup.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lineup'
      });
    }

    await lineup.deleteOne();

    res.json({
      success: true,
      message: 'Lineup deleted successfully'
    });
  } catch (error) {
    console.error('Delete lineup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lineup'
    });
  }
});

// Duplicate lineup
router.post('/duplicate/:lineupId', authenticateToken, async (req, res) => {
  try {
    const { lineupId } = req.params;
    const lineup = await FantasyLineup.findById(lineupId);
    
    if (!lineup) {
      return res.status(404).json({
        success: false,
        error: 'Lineup not found'
      });
    }

    // Create copy
    const newLineup = new FantasyLineup({
      ...lineup.toObject(),
      _id: undefined,
      name: `${lineup.name} (Copy)`,
      userId: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newLineup.save();

    res.json({
      success: true,
      data: newLineup,
      message: 'Lineup duplicated successfully'
    });
  } catch (error) {
    console.error('Duplicate lineup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate lineup'
    });
  }
});

export default router;
