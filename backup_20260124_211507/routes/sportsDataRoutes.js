import express from 'express';
import sportsDataController from '../controllers/sportsData.controller.js'; // Default import
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Player Data
router.get('/sports/nba/players', auth, (req, res) => {
  req.query.sport = 'NBA';
  return sportsDataController.getPlayers(req, res);
});
router.get('/sports/nfl/players', auth, (req, res) => {
  req.query.sport = 'NFL';
  return sportsDataController.getPlayers(req, res);
});
router.get('/sports/mlb/players', auth, (req, res) => {
  req.query.sport = 'MLB';
  return sportsDataController.getPlayers(req, res);
});
router.get('/sports/:sport/players', auth, sportsDataController.getPlayers);

// Team Data
router.get('/sports/:sport/teams', auth, sportsDataController.getTeams);
router.get('/sports/:sport/team/:teamId', auth, sportsDataController.getTeamDetails);

// Game Data
router.get('/sports/:sport/games', auth, sportsDataController.getGames);
router.get('/sports/:sport/games/today', auth, (req, res) => {
  req.query.date = new Date().toISOString().split('T')[0];
  return sportsDataController.getGames(req, res);
});
router.get('/sports/:sport/game/:gameId', auth, sportsDataController.getGameDetails);

// Injury Reports
router.get('/sports/:sport/injuries', auth, sportsDataController.getInjuryReports);
router.get('/sports/:sport/injuries/team/:teamId', auth, (req, res) => {
  req.query.team = req.params.teamId;
  return sportsDataController.getInjuryReports(req, res);
});

// Statistics
router.get('/stats/:sport', auth, sportsDataController.getStandings);
router.get('/stats/player/:playerId', auth, (req, res) => {
  req.query.playerId = req.params.playerId;
  req.query.sport = req.query.sport || 'NBA';
  return sportsDataController.getPlayerStats(req, res);
});
router.get('/stats/team/:teamId', auth, (req, res) => {
  req.query.teamId = req.params.teamId;
  req.query.sport = req.query.sport || 'NBA';
  return sportsDataController.getTeamStats(req, res);
});

// Additional routes
router.get('/sports/:sport/scores/live', auth, sportsDataController.getLiveScores);
router.get('/sports/:sport/schedule', auth, sportsDataController.getSchedule);
router.get('/sports/:sport/news', auth, sportsDataController.getSportsNews);
router.get('/sports/:sport/odds', auth, sportsDataController.getBettingOdds);
router.get('/sports/search', auth, sportsDataController.searchSportsData);
router.get('/sports/:sport/roster', auth, sportsDataController.getTeamRoster);
router.get('/sports/:sport/player/game-log', auth, sportsDataController.getPlayerGameLog);
router.get('/sports/:sport/team/game-log', auth, sportsDataController.getTeamGameLog);
router.get('/sports/:sport/leaders', auth, sportsDataController.getLeagueLeaders);
router.get('/admin/cache/clear', auth, sportsDataController.clearCache);

// Placeholder routes (optional - can be removed)
router.get('/markets/player-props', auth, (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Player props endpoint not yet implemented' 
  });
});
router.get('/markets/game-lines', auth, (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Game lines endpoint not yet implemented' 
  });
});
router.get('/markets/trends', auth, (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Market trends endpoint not yet implemented' 
  });
});
router.get('/markets/volume', auth, (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Market volume endpoint not yet implemented' 
  });
});

export default router;
