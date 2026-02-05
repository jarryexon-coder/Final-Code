import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router(); // MUST BE DECLARED BEFORE ANY ROUTE DEFINITIONS

// Cache implementation
const cache = new Map();

// NBA API Configuration
const NBA_API_CONFIG = {
  // Updated base URL to NBA Data API
  baseURL: 'http://data.nba.net/data/10s/prod/v1',
  currentYear: new Date().getFullYear(),
  endpoints: {
    teams: '/{year}/teams.json',
    players: '/{year}/players.json',
    gamesByDate: '/{date}/scoreboard.json',
    schedule: '/{year}/schedule.json',
    standings: '/{year}/standings.json'
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
    
    // Using NBA Data API for games by date
    const response = await axios.get(
      `http://data.nba.net/data/10s/prod/v1/${today}/scoreboard.json`
    );
    
    if (response.data && response.data.games) {
      return res.json({
        success: true,
        source: 'nba.net',
        count: response.data.games.length,
        games: response.data.games.map(game => ({
          id: game.gameId,
          homeTeam: game.hTeam.teamName || game.hTeam.triCode,
          awayTeam: game.vTeam.teamName || game.vTeam.triCode,
          date: today,
          status: game.statusNum === 1 ? 'Scheduled' : 
                  game.statusNum === 2 ? 'InProgress' : 'Final',
          homeScore: game.hTeam.score,
          awayScore: game.vTeam.score,
          period: game.period.current,
          time: game.clock || game.startTimeEastern
        })),
        timestamp: new Date().toISOString()
      });
    } else {
      // Return mock data if API returns empty
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
        ]
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
 *     description: Retrieve NBA teams data using NBA Data API
 *     tags: [NBA]
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
    const year = NBA_API_CONFIG.currentYear;
    
    const response = await axios.get(
      `http://data.nba.net/data/10s/prod/v1/${year}/teams.json`
    );
    
    if (response.data && response.data.league && response.data.league.standard) {
      const teams = response.data.league.standard.filter(team => team.isNBAFranchise);
      
      return res.json({
        success: true,
        count: teams.length,
        teams: teams.map(team => ({
          id: team.teamId,
          full_name: team.fullName,
          abbreviation: team.tricode,
          city: team.city,
          conference: team.confName,
          division: team.divName,
          logo: `https://cdn.nba.com/logos/nba/${team.teamId}/primary/L/logo.svg`
        })),
        source: 'nba.net'
      });
    } else {
      // Mock response if API data structure is unexpected
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
 *     description: Retrieve NBA statistics using NBA Data API
 *     tags: [NBA]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: NBA season year
 *       - in: query
 *         name: gameDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by game date (YYYY-MM-DD)
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
    const { season = 2024, gameDate } = req.query;
    
    // For the stats endpoint, we'll use the scoreboard data which includes game stats
    const date = gameDate || new Date().toISOString().split('T')[0];
    
    const response = await axios.get(
      `http://data.nba.net/data/10s/prod/v1/${date}/scoreboard.json`
    );
    
    if (response.data && response.data.games) {
      // Extract stats from games
      const gameStats = response.data.games.map(game => ({
        gameId: game.gameId,
        homeTeam: {
          teamId: game.hTeam.teamId,
          name: game.hTeam.teamName || game.hTeam.triCode,
          score: game.hTeam.score,
          stats: game.hTeam.linescores
        },
        awayTeam: {
          teamId: game.vTeam.teamId,
          name: game.vTeam.teamName || game.vTeam.triCode,
          score: game.vTeam.score,
          stats: game.vTeam.linescores
        },
        status: game.statusNum,
        period: game.period.current,
        clock: game.clock
      }));
      
      return res.json({
        success: true,
        count: gameStats.length,
        stats: gameStats,
        date: date,
        source: 'nba.net'
      });
    } else {
      // Mock response
      return res.json({
        success: true,
        message: 'Stats endpoint is working',
        count: 0,
        stats: [],
        source: 'mock'
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
 *     description: Retrieve live NBA games using NBA Data API
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
      `http://data.nba.net/data/10s/prod/v1/${today}/scoreboard.json`
    );
    
    if (response.data && response.data.games) {
      // Filter for live games (statusNum 2 = in progress)
      const liveGames = response.data.games.filter(game => game.statusNum === 2);
      
      const formattedGames = liveGames.map(game => ({
        GameID: game.gameId,
        Status: 'InProgress',
        AwayTeam: game.vTeam.teamName || game.vTeam.triCode,
        HomeTeam: game.hTeam.teamName || game.hTeam.triCode,
        AwayTeamScore: game.vTeam.score,
        HomeTeamScore: game.hTeam.score,
        Quarter: `Q${game.period.current}`,
        TimeRemaining: game.clock || '0:00'
      }));
      
      return res.json({
        success: true,
        count: formattedGames.length,
        games: formattedGames,
        source: 'nba.net'
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
 *     description: Retrieve specific player game statistics using NBA Data API
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
    
    // Note: NBA Data API doesn't have a direct endpoint for player stats by date
    // We'll return player information instead
    const year = NBA_API_CONFIG.currentYear;
    const playersResponse = await axios.get(
      `http://data.nba.net/data/10s/prod/v1/${year}/players.json`
    );
    
    if (playersResponse.data && playersResponse.data.league && playersResponse.data.league.standard) {
      const player = playersResponse.data.league.standard.find(p => p.personId === playerId);
      
      if (player) {
        return res.json({
          success: true,
          playerId: playerId,
          playerInfo: {
            PlayerID: player.personId,
            Name: `${player.firstName} ${player.lastName}`,
            Team: player.teamId,
            Position: player.pos,
            Height: player.heightFeet ? `${player.heightFeet}'${player.heightInches}"` : null,
            Weight: player.weightPounds,
            JerseyNumber: player.jersey,
            College: player.collegeName
          },
          source: 'nba.net',
          note: 'Full game stats not available via this API endpoint'
        });
      }
    }
    
    // Mock player stats if not found
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
    
    // 1. Fetch today's games from NBA Data API
    const gamesResponse = await axios.get(
      `http://data.nba.net/data/10s/prod/v1/${today}/scoreboard.json`
    );
    
    let games = [];
    if (gamesResponse.data && gamesResponse.data.games) {
      games = gamesResponse.data.games.map(game => ({
        GameID: game.gameId,
        HomeTeam: game.hTeam.triCode,
        AwayTeam: game.vTeam.triCode,
        HomeScore: game.hTeam.score,
        AwayScore: game.vTeam.score,
        Status: game.statusNum === 1 ? 'Scheduled' : 
                game.statusNum === 2 ? 'InProgress' : 'Final',
        Period: game.period.current,
        Clock: game.clock,
        StartTime: game.startTimeUTC,
        Arena: game.arena.name
      }));
    }
    
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
