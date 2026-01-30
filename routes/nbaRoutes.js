import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

// Cache implementation
const cache = new Map();

// NBA API Configuration
const NBA_API_CONFIG = {
  baseURL: 'https://api.sportsdata.io/v3/nba',
  apiKey: process.env.SPORTSDATA_API_KEY || 'your-api-key-here',
  endpoints: {
    games: '/scores/json/GamesByDate/{date}',
    players: '/scores/json/Players',
    teams: '/scores/json/teams',
    standings: '/scores/json/Standings/{season}'
  }
};

/**
 * @swagger
 * /api/nba/games:
 *   get:
 *     summary: Get NBA games
 *     description: Retrieve list of NBA games from cache, database, or external API
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for external API pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: List of NBA games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 source:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    const { date, page = 0, limit = 20 } = req.query;
    
    // If date is provided, fetch from external API
    if (date) {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', limit);
      params.append('dates[]', date);
      
      const response = await axios.get('https://api.balldontlie.io/v1/games', {
        params,
        headers: {
          'Authorization': process.env.BALLDONTLIE_API_KEY
        }
      });
      
      return res.json({
        success: true,
        source: 'external_api',
        count: response.data.data.length,
        games: response.data.data,
        meta: response.data.meta
      });
    }
    
    // Try cache first
    const cachedGames = cache.get('nba_games');
    if (cachedGames) {
      return res.json({
        success: true,
        source: 'cache',
        count: cachedGames.length,
        games: cachedGames.slice(0, limit)
      });
    }
    
    // Otherwise query database
    const collection = mongoose.connection.db.collection('nba_games');
    const games = await collection.find({})
      .sort({ DateTime: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      success: true,
      source: 'database',
      count: games.length,
      games: games
    });
    
  } catch (error) {
    console.error('Error fetching games:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch games'
    });
  }
});

/**
 * @swagger
 * /api/nba/games/{id}:
 *   get:
 *     summary: Get NBA game by ID
 *     description: Retrieve specific NBA game details using BALLDONTLIE_API_KEY
 *     tags: [NBA]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID
 *     responses:
 *       200:
 *         description: NBA game details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`https://api.balldontlie.io/v1/games/${id}`, {
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Error fetching game:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch game'
    });
  }
});

/**
 * @swagger
 * /api/nba/players:
 *   get:
 *     summary: Get NBA players
 *     description: Retrieve NBA players data using BALLDONTLIE_API_KEY
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search players by name
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: integer
 *         description: Filter by team ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of players per page
 *     responses:
 *       200:
 *         description: List of NBA players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    const { search, team_id, page = 0, limit = 25 } = req.query;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (team_id) params.append('team_ids[]', team_id);
    params.append('page', page);
    params.append('per_page', limit);
    
    const response = await axios.get('https://api.balldontlie.io/v1/players', {
      params,
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      count: response.data.data.length,
      players: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching players:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch players'
    });
  }
});

/**
 * @swagger
 * /api/nba/teams:
 *   get:
 *     summary: Get NBA teams
 *     description: Retrieve NBA teams data using BALLDONTLIE_API_KEY
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of NBA teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    const { page = 0 } = req.query;
    
    const response = await axios.get('https://api.balldontlie.io/v1/teams', {
      params: { page },
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      count: response.data.data.length,
      teams: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching teams:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch teams'
    });
  }
});

/**
 * @swagger
 * /api/nba/stats:
 *   get:
 *     summary: Get NBA statistics
 *     description: Retrieve NBA statistics using BALLDONTLIE_API_KEY
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: NBA season year
 *       - in: query
 *         name: player_ids
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: Filter by player IDs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: NBA statistics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 stats:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    const { season = 2024, player_ids, page = 0 } = req.query;
    
    const params = new URLSearchParams();
    params.append('season', season);
    params.append('page', page);
    
    if (player_ids) {
      const ids = Array.isArray(player_ids) ? player_ids : [player_ids];
      ids.forEach(id => params.append('player_ids[]', id));
    }
    
    const response = await axios.get('https://api.balldontlie.io/v1/stats', {
      params,
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      count: response.data.data.length,
      stats: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch stats'
    });
  }
});

/**
 * @swagger
 * /api/nba/scores/live:
 *   get:
 *     summary: Get live NBA scores
 *     description: Retrieve live NBA games using SPORTSDATA_API_KEY
 *     tags: [NBA]
 *     responses:
 *       200:
 *         description: Live NBA games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/scores/live', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      `${NBA_API_CONFIG.baseURL}/scores/json/GamesByDate/${today}`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': NBA_API_CONFIG.apiKey }
      }
    );
    
    const liveGames = response.data.filter(game => 
      game.Status === 'InProgress' || game.Status === 'Final'
    );
    
    res.json({
      success: true,
      count: liveGames.length,
      games: liveGames
    });
    
  } catch (error) {
    console.error('Error fetching live scores:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/nba/players/stats:
 *   get:
 *     summary: Get player statistics
 *     description: Retrieve specific player game statistics using SPORTSDATA_API_KEY
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Game date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Player game statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 playerStats:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/players/stats', async (req, res) => {
  try {
    const { playerId, date } = req.query;
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'playerId parameter is required'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'date parameter is required'
      });
    }
    
    const response = await axios.get(
      `${NBA_API_CONFIG.baseURL}/stats/json/PlayerGameStatsByDate/${date}/${playerId}`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': NBA_API_CONFIG.apiKey }
      }
    );
    
    res.json({
      success: true,
      playerStats: response.data
    });
    
  } catch (error) {
    console.error('Error fetching player stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real NBA data fetching
export const fetchNBAData = async () => {
  console.log('🏀 Fetching real NBA data...');
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 1. Fetch today's games
    const gamesResponse = await axios.get(
      NBA_API_CONFIG.endpoints.games.replace('{date}', today),
      {
        baseURL: NBA_API_CONFIG.baseURL,
        headers: { 'Ocp-Apim-Subscription-Key': NBA_API_CONFIG.apiKey }
      }
    );
    
    const games = gamesResponse.data || [];
    
    // 2. Save to MongoDB
    if (games.length > 0) {
      const collection = mongoose.connection.db.collection('nba_games');
      
      // Update or insert each game
      for (const game of games) {
        await collection.updateOne(
          { GameID: game.GameID },
          { $set: { ...game, lastUpdated: new Date() } },
          { upsert: true }
        );
      }
      
      console.log(`✅ Saved ${games.length} NBA games to database`);
    }
    
    // 3. Cache in memory for quick access
    cache.set('nba_games', games, 300); // 5 minute cache
    
    return {
      success: true,
      gamesCount: games.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ NBA data fetch error:', error.message);
    
    // Fallback to sample data
    const sampleGames = await getSampleGames();
    return {
      success: false,
      error: error.message,
      gamesCount: sampleGames.length,
      usingSampleData: true
    };
  }
};

// Helper function (assuming this exists elsewhere)
const getSampleGames = async () => {
  return []; // Add your sample games logic here
};

export default router;
