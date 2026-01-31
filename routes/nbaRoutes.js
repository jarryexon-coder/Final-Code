import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router(); // MUST BE DECLARED BEFORE ANY ROUTE DEFINITIONS

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
 * /api/nba:
 *   get:
 *     summary: NBA API root endpoint
 *     description: Get information about available NBA API endpoints
 *     tags: [NBA]
 *     responses:
 *       200:
 *         description: NBA API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: NBA API is working
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/api/nba',
      games: '/api/nba/games',
      teams: '/api/nba/teams',
      stats: '/api/nba/stats',
      live_scores: '/api/nba/scores/live',
      player_stats: '/api/nba/players/stats'
    }
  });
});

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
  console.log('🏀 NBA /games endpoint called');
  
  try {
    // Try to fetch real data first
    const today = new Date().toISOString().split('T')[0];
    
    if (NBA_API_CONFIG.apiKey && NBA_API_CONFIG.apiKey !== 'your-api-key-here') {
      const response = await axios.get(
        `${NBA_API_CONFIG.baseURL}/scores/json/GamesByDate/${today}`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': NBA_API_CONFIG.apiKey }
        }
      );
      
      return res.json({
        success: true,
        source: 'sportsdata.io',
        count: response.data.length,
        games: response.data,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return mock data if API key not configured
      return res.json({
        success: true,
        message: 'NBA games endpoint is working',
        source: 'mock',
        timestamp: new Date().toISOString(),
        games: [
          {
            id: 1,
            homeTeam: 'Lakers',
            awayTeam: 'Warriors',
            date: today,
            time: '7:30 PM ET',
            status: 'Scheduled'
          },
          {
            id: 2,
            homeTeam: 'Celtics',
            awayTeam: 'Heat',
            date: today,
            time: '8:00 PM ET',
            status: 'Scheduled'
          }
        ],
        endpoints: {
          root: '/api/nba',
          games: '/api/nba/games',
          teams: '/api/nba/teams',
          stats: '/api/nba/stats',
          live_scores: '/api/nba/scores/live',
          player_stats: '/api/nba/players/stats'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching NBA games:', error.message);
    
    // Fallback response
    return res.json({
      success: true,
      message: 'NBA games endpoint is working (fallback mode)',
      timestamp: new Date().toISOString(),
      games: [],
      note: 'External API call failed, using fallback response'
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
    
    if (process.env.BALLDONTLIE_API_KEY) {
      const response = await axios.get('https://api.balldontlie.io/v1/teams', {
        params: { page },
        headers: {
          'Authorization': process.env.BALLDONTLIE_API_KEY
        }
      });
      
      return res.json({
        success: true,
        count: response.data.data.length,
        teams: response.data.data,
        meta: response.data.meta
      });
    } else {
      // Mock response if API key not available
      const mockTeams = [
        { id: 1, full_name: 'Los Angeles Lakers', abbreviation: 'LAL', city: 'Los Angeles', conference: 'West' },
        { id: 2, full_name: 'Golden State Warriors', abbreviation: 'GSW', city: 'San Francisco', conference: 'West' },
        { id: 3, full_name: 'Boston Celtics', abbreviation: 'BOS', city: 'Boston', conference: 'East' },
        { id: 4, full_name: 'Miami Heat', abbreviation: 'MIA', city: 'Miami', conference: 'East' }
      ];
      
      return res.json({
        success: true,
        count: mockTeams.length,
        teams: mockTeams,
        source: 'mock'
      });
    }
    
  } catch (error) {
    console.error('Error fetching teams:', error.response?.data || error.message);
    
    // Fallback mock response
    const mockTeams = [
      { id: 1, full_name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      { id: 2, full_name: 'Golden State Warriors', abbreviation: 'GSW' }
    ];
    
    res.json({
      success: true,
      count: mockTeams.length,
      teams: mockTeams,
      source: 'fallback',
      error: error.message
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
    
    if (process.env.BALLDONTLIE_API_KEY) {
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
      
      return res.json({
        success: true,
        count: response.data.data.length,
        stats: response.data.data,
        meta: response.data.meta
      });
    } else {
      // Mock response
      return res.json({
        success: true,
        message: 'Stats endpoint is working',
        count: 0,
        stats: [],
        source: 'mock',
        note: 'Set BALLDONTLIE_API_KEY environment variable for real data'
      });
    }
    
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
    if (NBA_API_CONFIG.apiKey && NBA_API_CONFIG.apiKey !== 'your-api-key-here') {
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
      
      return res.json({
        success: true,
        count: liveGames.length,
        games: liveGames
      });
    } else {
      // Mock live games
      return res.json({
        success: true,
        message: 'Live scores endpoint is working',
        count: 2,
        games: [
          {
            GameID: 1,
            Status: 'InProgress',
            AwayTeam: 'Warriors',
            HomeTeam: 'Lakers',
            AwayTeamScore: 85,
            HomeTeamScore: 82,
            Quarter: '4th',
            TimeRemaining: '2:30'
          },
          {
            GameID: 2,
            Status: 'Final',
            AwayTeam: 'Heat',
            HomeTeam: 'Celtics',
            AwayTeamScore: 98,
            HomeTeamScore: 102,
            Quarter: 'Final'
          }
        ],
        source: 'mock'
      });
    }
    
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
    
    if (NBA_API_CONFIG.apiKey && NBA_API_CONFIG.apiKey !== 'your-api-key-here') {
      const response = await axios.get(
        `${NBA_API_CONFIG.baseURL}/stats/json/PlayerGameStatsByDate/${date}/${playerId}`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': NBA_API_CONFIG.apiKey }
        }
      );
      
      return res.json({
        success: true,
        playerStats: response.data
      });
    } else {
      // Mock player stats
      return res.json({
        success: true,
        message: 'Player stats endpoint is working',
        playerId: playerId,
        date: date,
        playerStats: {
          PlayerID: parseInt(playerId),
          Name: 'LeBron James',
          Points: 28,
          Rebounds: 8,
          Assists: 10,
          Steals: 2,
          Blocks: 1,
          Turnovers: 3,
          Minutes: 36
        },
        source: 'mock'
      });
    }
    
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

// Helper function
const getSampleGames = async () => {
  return []; // Add your sample games logic here
};

export default router;
