const express = require('express');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nba-fantasy-secret-key';
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Add player to favorites
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { playerId, playerName, position, team } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    // Check if player already in favorites
    const existingFavorite = user.favoritePlayers.find(
      fav => fav.playerId === playerId
    );
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Player already in favorites'
      });
    }
    
    // Add to favorites
    user.favoritePlayers.push({
      playerId,
      playerName,
      position,
      team,
      addedAt: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Player added to favorites',
      favoritePlayers: user.favoritePlayers
    });
    
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add player to favorites'
    });
  }
});

// Remove player from favorites
router.delete('/remove/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const user = await User.findById(req.user.userId);
    
    user.favoritePlayers = user.favoritePlayers.filter(
      fav => fav.playerId !== playerId
    );
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Player removed from favorites',
      favoritePlayers: user.favoritePlayers
    });
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove player from favorites'
    });
  }
});

// Get user's favorite players
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('favoritePlayers');
    
    res.json({
      success: true,
      favoritePlayers: user.favoritePlayers
    });
    
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorite players'
    });
  }
});

module.exports = router;
