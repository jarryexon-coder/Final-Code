import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Selection from '../models/Selection.js';

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
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// GET /api/prizepicks/selections
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sport } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { userId: req.userId };
    if (status && status !== 'all') filter.status = status;
    if (sport && sport !== 'all') filter.sport = sport;
    
    const [selections, total] = await Promise.all([
      Selection.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Selection.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      selections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get selections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get selections'
    });
  }
});

// GET /api/prizepicks/selections/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selections = await Selection.find({
      userId: req.userId,
      createdAt: { $gte: today }
    })
    .sort({ createdAt: -1 })
    .lean();
    
    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      selections,
      count: selections.length,
      totalWinners: selections.reduce((sum, sel) => sum + (sel.winners?.length || 0), 0)
    });
    
  } catch (error) {
    console.error('Get today selections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get today selections'
    });
  }
});

// GET /api/prizepicks/selections/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const selection = await Selection.findOne({
      _id: req.params.id,
      userId: req.userId
    })
    .populate('winners.playerId', 'name team position')
    .lean();
    
    if (!selection) {
      return res.status(404).json({
        success: false,
        error: 'Selection not found'
      });
    }
    
    res.json({
      success: true,
      selection
    });
    
  } catch (error) {
    console.error('Get selection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get selection'
    });
  }
});

// POST /api/prizepicks/selections
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, sport, winners, totalOdds, stake, notes } = req.body;
    
    if (!winners || winners.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Must provide exactly 3 winners'
      });
    }
    
    const selection = await Selection.create({
      userId: req.userId,
      type: type || 'parlay',
      sport: sport || 'NBA',
      winners,
      totalOdds,
      stake: stake || 10,
      potentialPayout: calculatePayout(stake || 10, totalOdds || '+400'),
      notes,
      status: 'active'
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalSelections: 1, totalStake: stake || 10 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Selection created successfully',
      selection
    });
    
  } catch (error) {
    console.error('Create selection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create selection'
    });
  }
});

function calculatePayout(stake, odds) {
  if (odds.startsWith('+')) {
    const multiplier = parseInt(odds.slice(1)) / 100;
    return stake * multiplier + stake;
  } else if (odds.startsWith('-')) {
    const multiplier = 100 / parseInt(odds.slice(1));
    return stake * multiplier + stake;
  }
  return stake;
}

export default router;
