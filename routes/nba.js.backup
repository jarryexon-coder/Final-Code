const express = require('express');
const router = express.Router();
const nbaController = require('../controllers/nbaController');

// Cache middleware
const cacheMiddleware = (seconds) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
};

// ===== NBA GAMES ENDPOINTS =====
router.get('/games', cacheMiddleware(60), nbaController.getGames);
router.get('/games/today', cacheMiddleware(60), nbaController.getTodayGames);

// ===== NBA PLAYERS ENDPOINTS =====
router.get('/players', cacheMiddleware(300), nbaController.getPlayers);
router.get('/players/search', nbaController.searchPlayers);
router.get('/player/:playerName', nbaController.getPlayer);

// ===== BETTING ODDS ENDPOINTS =====
// Both routes point to the same controller for compatibility
router.get('/odds', cacheMiddleware(300), nbaController.getOdds);
router.get('/betting/odds', cacheMiddleware(300), nbaController.getOdds); // Added for frontend compatibility

// ===== FANTASY ADVICE ENDPOINT =====
router.get('/fantasy/advice', cacheMiddleware(600), nbaController.getFantasyAdvice);

module.exports = router;
