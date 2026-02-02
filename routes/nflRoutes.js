import express from 'express';
const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "nfl API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});
import axios from 'axios';

// Use API keys from environment
const NFL_API_KEY = process.env.NFL_API_KEY;
const RAPIDAPI_KEY_PLAYER_PRO = process.env.RAPIDAPI_KEY_PLAYER_PROPS; // For detailed stats

/**
 * @swagger
 * /api/nfl/games:
 *   get:
 *     summary: Get NFL games
 *     description: Retrieve list of NFL games with optional filters including upcoming, live, and completed games
 *     tags: [NFL]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: NFL season year (e.g., "2024" for 2024-2025 season)
 *       - in: query
 *         name: seasonType
 *         schema:
 *           type: string
 *           enum: [pre, reg, post]
 *           default: reg
 *         description: Season type - pre (preseason), reg (regular), post (postseason)
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: Week number (1-18 for regular season, 19-22 for playoffs)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: List of NFL games
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
 *                     $ref: '#/components/schemas/NFLGame'
 *       400:
 *         description: Missing or invalid API key
 *       500:
 *         description: Server error or NFL API unavailable
 */
router.get('/games', async (req, res) => {
  // Use NFL_API_KEY
  try {
    if (!NFL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'NFL API key not configured'
      });
    }

    const { season = '2024', seasonType = 'reg', week, limit = 20 } = req.query;
    
    // Build API parameters
    const params = {
      apiKey: NFL_API_KEY,
      season,
      seasonType
    };
    
    if (week) params.week = week;

    // Fetch games from NFL API
    const response = await axios.get('https://api.nfl.com/v1/games', {
      params,
      headers: {
        'Accept': 'application/json'
      }
    });

    const games = response.data.games || response.data;
    const limitedGames = Array.isArray(games) ? games.slice(0, parseInt(limit)) : games;

    res.json({
      success: true,
      count: Array.isArray(limitedGames) ? limitedGames.length : 1,
      games: limitedGames,
      season,
      seasonType
    });

  } catch (error) {
    console.error('NFL games API error:', error.message);
    
    // Fallback to mock data
    res.json({
      success: true,
      games: [
        { 
          id: 1, 
          gameId: 'mock_nfl_001',
          home: { team: 'KC', name: 'Chiefs', score: 27 }, 
          away: { team: 'BUF', name: 'Bills', score: 24 }, 
          time: '4:25 PM ET',
          status: 'final',
          week: 17,
          season: '2024'
        },
        { 
          id: 2, 
          gameId: 'mock_nfl_002',
          home: { team: 'SF', name: '49ers', score: 31 }, 
          away: { team: 'DAL', name: 'Cowboys', score: 28 }, 
          time: '8:20 PM ET',
          status: 'final',
          week: 17,
          season: '2024'
        }
      ],
      count: 2,
      message: 'Using fallback NFL games data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/games/{id}:
 *   get:
 *     summary: Get specific NFL game details
 *     description: Retrieve detailed information about a specific NFL game including scores, stats, and play-by-play
 *     tags: [NFL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: NFL Game ID
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 game:
 *                   $ref: '#/components/schemas/NFLGameDetail'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  // Use NFL_API_KEY
  try {
    if (!NFL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'NFL API key not configured'
      });
    }

    const gameId = req.params.id;
    
    // Fetch specific game details from NFL API
    const response = await axios.get(`https://api.nfl.com/v1/games/${gameId}`, {
      params: { apiKey: NFL_API_KEY },
      headers: { 'Accept': 'application/json' }
    });

    res.json({
      success: true,
      game: response.data
    });

  } catch (error) {
    console.error('NFL game detail API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      game: {
        gameId: req.params.id,
        homeTeam: {
          id: 'KC',
          name: 'Kansas City Chiefs',
          score: 27,
          stats: {
            totalYards: 389,
            passingYards: 287,
            rushingYards: 102,
            turnovers: 1
          }
        },
        awayTeam: {
          id: 'BUF',
          name: 'Buffalo Bills',
          score: 24,
          stats: {
            totalYards: 425,
            passingYards: 312,
            rushingYards: 113,
            turnovers: 2
          }
        },
        status: 'final',
        quarter: 'FINAL',
        time: '4:25 PM ET',
        date: '2024-12-29',
        venue: 'Arrowhead Stadium',
        attendance: '73486',
        weather: 'Clear, 42°F'
      },
      message: 'Using fallback game detail data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/players:
 *   get:
 *     summary: Get NFL players
 *     description: Retrieve list of NFL players with basic information and stats
 *     tags: [NFL]
 *     parameters:
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *         description: Filter by team abbreviation (e.g., KC, BUF, SF)
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *           enum: [QB, RB, WR, TE, OL, DL, LB, DB, K, P]
 *         description: Filter by player position
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of players to return
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search players by name
 *     responses:
 *       200:
 *         description: List of NFL players
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
 *                     $ref: '#/components/schemas/NFLPlayer'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  // NFL_API_KEY
  try {
    if (!NFL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'NFL API key not configured'
      });
    }

    const { team, position, limit = 50, search } = req.query;
    
    const params = { apiKey: NFL_API_KEY };
    if (team) params.team = team;
    if (position) params.position = position;
    if (search) params.search = search;

    // Fetch players from NFL API
    const response = await axios.get('https://api.nfl.com/v1/players', {
      params,
      headers: { 'Accept': 'application/json' }
    });

    const players = response.data.players || response.data;
    const limitedPlayers = Array.isArray(players) ? players.slice(0, parseInt(limit)) : players;

    res.json({
      success: true,
      count: Array.isArray(limitedPlayers) ? limitedPlayers.length : 1,
      players: limitedPlayers,
      filters: { team, position, search }
    });

  } catch (error) {
    console.error('NFL players API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      players: [
        { 
          id: 'mock_player_001',
          name: 'Patrick Mahomes', 
          team: 'KC', 
          position: 'QB',
          jerseyNumber: 15,
          height: "6'2\"",
          weight: 225,
          age: 28,
          college: 'Texas Tech',
          stats: { 
            passingYards: 4183, 
            passingTDs: 27,
            interceptions: 14,
            passerRating: 92.6 
          }
        },
        { 
          id: 'mock_player_002',
          name: 'Christian McCaffrey', 
          team: 'SF', 
          position: 'RB',
          jerseyNumber: 23,
          height: "5'11\"",
          weight: 205,
          age: 27,
          college: 'Stanford',
          stats: { 
            rushingYards: 1459, 
            rushingTDs: 14,
            receivingYards: 564,
            totalTDs: 21
          }
        },
        { 
          id: 'mock_player_003',
          name: 'Josh Allen', 
          team: 'BUF', 
          position: 'QB',
          jerseyNumber: 17,
          height: "6'5\"",
          weight: 237,
          age: 27,
          college: 'Wyoming',
          stats: { 
            passingYards: 4306, 
            passingTDs: 29,
            rushingYards: 524,
            totalTDs: 44
          }
        }
      ],
      count: 3,
      message: 'Using fallback players data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/teams:
 *   get:
 *     summary: Get NFL teams
 *     description: Retrieve list of all NFL teams with basic information and standings
 *     tags: [NFL]
 *     parameters:
 *       - in: query
 *         name: conference
 *         schema:
 *           type: string
 *           enum: [AFC, NFC]
 *         description: Filter by conference
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *           enum: [North, South, East, West]
 *         description: Filter by division
 *     responses:
 *       200:
 *         description: List of NFL teams
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
 *                     $ref: '#/components/schemas/NFLTeam'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  // Use NFL_API_KEY
  try {
    if (!NFL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'NFL API key not configured'
      });
    }

    const { conference, division } = req.query;
    
    const params = { apiKey: NFL_API_KEY };
    if (conference) params.conference = conference;
    if (division) params.division = division;

    // Fetch teams from NFL API
    const response = await axios.get('https://api.nfl.com/v1/teams', {
      params,
      headers: { 'Accept': 'application/json' }
    });

    res.json({
      success: true,
      count: Array.isArray(response.data) ? response.data.length : 1,
      teams: response.data,
      filters: { conference, division }
    });

  } catch (error) {
    console.error('NFL teams API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      teams: [
        { 
          id: 'KC',
          name: 'Kansas City Chiefs',
          city: 'Kansas City',
          state: 'MO',
          conference: 'AFC',
          division: 'West',
          wins: 11,
          losses: 6,
          ties: 0,
          stadium: 'Arrowhead Stadium',
          headCoach: 'Andy Reid',
          established: 1960
        },
        { 
          id: 'BUF',
          name: 'Buffalo Bills',
          city: 'Buffalo',
          state: 'NY',
          conference: 'AFC',
          division: 'East',
          wins: 10,
          losses: 7,
          ties: 0,
          stadium: 'Highmark Stadium',
          headCoach: 'Sean McDermott',
          established: 1960
        },
        { 
          id: 'SF',
          name: 'San Francisco 49ers',
          city: 'Santa Clara',
          state: 'CA',
          conference: 'NFC',
          division: 'West',
          wins: 12,
          losses: 5,
          ties: 0,
          stadium: 'Levi\'s Stadium',
          headCoach: 'Kyle Shanahan',
          established: 1946
        }
      ],
      count: 3,
      message: 'Using fallback teams data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/stats:
 *   get:
 *     summary: Get NFL statistics
 *     description: Retrieve NFL statistics including league leaders, team stats, and player rankings
 *     tags: [NFL]
 *     parameters:
 *       - in: query
 *         name: statType
 *         schema:
 *           type: string
 *           enum: [passing, rushing, receiving, defense, specialTeams]
 *           default: passing
 *         description: Type of statistics to retrieve
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           default: '2024'
 *         description: NFL season year
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of stats entries to return
 *     responses:
 *       200:
 *         description: NFL statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statType:
 *                   type: string
 *                 season:
 *                   type: string
 *                 stats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NFLStat'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  // Use NFL_API_KEY
  try {
    if (!NFL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'NFL API key not configured'
      });
    }

    const { statType = 'passing', season = '2024', limit = 20 } = req.query;
    
    // Fetch stats from NFL API
    const response = await axios.get(`https://api.nfl.com/v1/stats/${statType}`, {
      params: {
        apiKey: NFL_API_KEY,
        season,
        limit: parseInt(limit)
      },
      headers: { 'Accept': 'application/json' }
    });

    res.json({
      success: true,
      statType,
      season,
      stats: response.data,
      count: Array.isArray(response.data) ? response.data.length : 1
    });

  } catch (error) {
    console.error('NFL stats API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      statType: req.query.statType || 'passing',
      season: req.query.season || '2024',
      stats: [
        { 
          player: 'Patrick Mahomes', 
          team: 'KC', 
          passingYards: 4183,
          passingTDs: 27,
          interceptions: 14,
          completionPercentage: 66.8,
          passerRating: 92.6,
          rank: 1
        },
        { 
          player: 'Christian McCaffrey', 
          team: 'SF', 
          rushingYards: 1459,
          rushingTDs: 14,
          yardsPerAttempt: 5.4,
          receptions: 67,
          receivingYards: 564,
          totalTDs: 21,
          rank: 1
        },
        { 
          player: 'Tyreek Hill', 
          team: 'MIA', 
          receivingYards: 1799,
          receivingTDs: 13,
          receptions: 119,
          yardsPerReception: 15.1,
          rank: 1
        }
      ],
      count: 3,
      message: 'Using fallback stats data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/players/{id}/details:
 *   get:
 *     summary: Get detailed player information
 *     description: Retrieve comprehensive player details including career stats, contract info, and advanced metrics using RapidAPI
 *     tags: [NFL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID or name
 *     responses:
 *       200:
 *         description: Player details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 player:
 *                   $ref: '#/components/schemas/NFLPlayerDetail'
 *       400:
 *         description: Missing API key
 *       500:
 *         description: Server error
 */
router.get('/players/:id/details', async (req, res) => {
  // Use RAPIDAPI_KEY_PLAYER_PRO for advanced stats
  try {
    if (!RAPIDAPI_KEY_PLAYER_PRO) {
      return res.status(400).json({
        success: false,
        error: 'RapidAPI key for player stats not configured'
      });
    }

    const playerId = req.params.id;
    
    // Fetch detailed player stats from RapidAPI
    const response = await axios.get('https://advanced-player-stats.p.rapidapi.com/players/details', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PRO,
        'X-RapidAPI-Host': 'advanced-player-stats.p.rapidapi.com'
      },
      params: {
        playerId: playerId,
        season: '2024'
      }
    });

    res.json({
      success: true,
      player: response.data
    });

  } catch (error) {
    console.error('Player details API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      player: {
        id: req.params.id,
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'Kansas City Chiefs',
        number: 15,
        height: "6'2\"",
        weight: 225,
        age: 28,
        college: 'Texas Tech',
        draftYear: 2017,
        draftRound: 1,
        draftPick: 10,
        experience: '7 years',
        contract: {
          value: '$450M',
          years: 10,
          guaranteed: '$141M',
          averageAnnual: '$45M'
        },
        careerStats: {
          gamesPlayed: 107,
          passingYards: 28271,
          passingTDs: 219,
          interceptions: 63,
          completionPercentage: 66.3,
          passerRating: 103.5,
          rushingYards: 1734,
          rushingTDs: 13
        },
        awards: [
          '2× Super Bowl Champion',
          '2× Super Bowl MVP',
          '2× NFL MVP',
          '6× Pro Bowl',
          '2× First-team All-Pro'
        ],
        advancedMetrics: {
          passerRating: 103.5,
          QBR: 72.8,
          EPA: 245.6,
          CPOE: 3.2,
          sackPercentage: 4.1
        }
      },
      message: 'Using fallback player details data'
    });
  }
});

/**
 * @swagger
 * /api/nfl/players/{id}/gamelog:
 *   get:
 *     summary: Get player game log
 *     description: Retrieve detailed game-by-game statistics for a specific player
 *     tags: [NFL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID or name
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           default: '2024'
 *         description: NFL season year
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 16
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: Player game log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 playerId:
 *                   type: string
 *                 season:
 *                   type: string
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NFLGameLog'
 *       500:
 *         description: Server error
 */
router.get('/players/:id/gamelog', async (req, res) => {
  // Use RAPIDAPI_KEY_PLAYER_PRO for game logs
  try {
    if (!RAPIDAPI_KEY_PLAYER_PRO) {
      return res.status(400).json({
        success: false,
        error: 'RapidAPI key for player stats not configured'
      });
    }

    const playerId = req.params.id;
    const { season = '2024', limit = 16 } = req.query;
    
    // Fetch player game log from RapidAPI
    const response = await axios.get('https://advanced-player-stats.p.rapidapi.com/players/gamelog', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PRO,
        'X-RapidAPI-Host': 'advanced-player-stats.p.rapidapi.com'
      },
      params: {
        playerId: playerId,
        season: season,
        limit: parseInt(limit)
      }
    });

    res.json({
      success: true,
      playerId,
      season,
      games: response.data.games || response.data,
      count: Array.isArray(response.data) ? response.data.length : 
             (response.data.games ? response.data.games.length : 1)
    });

  } catch (error) {
    console.error('Player gamelog API error:', error.message);
    
    // Fallback mock data
    res.json({
      success: true,
      playerId: req.params.id,
      playerName: 'Patrick Mahomes',
      season: req.query.season || '2024',
      games: [
        {
          gameId: 'mock_game_001',
          week: 1,
          date: '2024-09-08',
          opponent: 'Detroit Lions',
          result: 'W',
          score: 'KC 34 - DET 21',
          stats: {
            passingAttempts: 39,
            passingCompletions: 27,
            passingYards: 326,
            passingTDs: 2,
            interceptions: 0,
            passerRating: 108.4,
            sacks: 2,
            rushingYards: 24,
            rushingTDs: 0
          },
          homeAway: 'home'
        },
        {
          gameId: 'mock_game_002',
          week: 2,
          date: '2024-09-15',
          opponent: 'Baltimore Ravens',
          result: 'L',
          score: 'KC 27 - BAL 31',
          stats: {
            passingAttempts: 42,
            passingCompletions: 29,
            passingYards: 298,
            passingTDs: 1,
            interceptions: 1,
            passerRating: 89.2,
            sacks: 3,
            rushingYards: 41,
            rushingTDs: 1
          },
          homeAway: 'away'
        }
      ],
      count: 2,
      message: 'Using fallback gamelog data'
    });
  }
});

// Original gameSummary endpoint kept for backward compatibility
router.get('/gameSummary', async (req, res) => {
  const { gameId } = req.query;
  
  res.json({
    success: true,
    summary: {
      gameId: gameId || 'mock_nfl_game_001',
      homeTeam: 'NFL Home Team',
      awayTeam: 'NFL Away Team',
      status: 'scheduled',
      // NFL-specific fields
    },
    message: 'Stub endpoint'
  });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     NFLGame:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         gameId:
 *           type: string
 *         home:
 *           $ref: '#/components/schemas/NFLTeamScore'
 *         away:
 *           $ref: '#/components/schemas/NFLTeamScore'
 *         time:
 *           type: string
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, final, postponed, cancelled]
 *         week:
 *           type: integer
 *         season:
 *           type: string
 *         venue:
 *           type: string
 *     
 *     NFLTeamScore:
 *       type: object
 *       properties:
 *         team:
 *           type: string
 *         name:
 *           type: string
 *         score:
 *           type: integer
 *     
 *     NFLGameDetail:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         homeTeam:
 *           $ref: '#/components/schemas/NFLTeamDetail'
 *         awayTeam:
 *           $ref: '#/components/schemas/NFLTeamDetail'
 *         status:
 *           type: string
 *         quarter:
 *           type: string
 *         time:
 *           type: string
 *         date:
 *           type: string
 *         venue:
 *           type: string
 *         attendance:
 *           type: string
 *         weather:
 *           type: string
 *         stats:
 *           type: object
 *     
 *     NFLTeamDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         score:
 *           type: integer
 *         stats:
 *           type: object
 *     
 *     NFLPlayer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         team:
 *           type: string
 *         position:
 *           type: string
 *         jerseyNumber:
 *           type: integer
 *         height:
 *           type: string
 *         weight:
 *           type: integer
 *         age:
 *           type: integer
 *         college:
 *           type: string
 *         stats:
 *           type: object
 *     
 *     NFLPlayerDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         position:
 *           type: string
 *         team:
 *           type: string
 *         number:
 *           type: integer
 *         height:
 *           type: string
 *         weight:
 *           type: integer
 *         age:
 *           type: integer
 *         college:
 *           type: string
 *         draftYear:
 *           type: integer
 *         experience:
 *           type: string
 *         contract:
 *           type: object
 *         careerStats:
 *           type: object
 *         awards:
 *           type: array
 *           items:
 *             type: string
 *         advancedMetrics:
 *           type: object
 *     
 *     NFLTeam:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         conference:
 *           type: string
 *         division:
 *           type: string
 *         wins:
 *           type: integer
 *         losses:
 *           type: integer
 *         ties:
 *           type: integer
 *         stadium:
 *           type: string
 *         headCoach:
 *           type: string
 *         established:
 *           type: integer
 *     
 *     NFLStat:
 *       type: object
 *       properties:
 *         player:
 *           type: string
 *         team:
 *           type: string
 *         statCategory:
 *           type: string
 *         value:
 *           oneOf:
 *             - type: integer
 *             - type: number
 *             - type: string
 *         rank:
 *           type: integer
 *     
 *     NFLGameLog:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         week:
 *           type: integer
 *         date:
 *           type: string
 *         opponent:
 *           type: string
 *         result:
 *           type: string
 *           enum: [W, L, T]
 *         score:
 *           type: string
 *         stats:
 *           type: object
 *         homeAway:
 *           type: string
 *           enum: [home, away, neutral]
 */

export default router;
