import express from 'express';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import axios from 'axios';

const router = express.Router();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams with filters
 *     description: Retrieve list of teams with optional filtering by sport, conference, division, and search
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport type (e.g., 'nba', 'nfl')
 *       - in: query
 *         name: conference
 *         schema:
 *           type: string
 *         description: Filter by conference
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by team name, city, conference, or division
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of teams per page
 *     responses:
 *       200:
 *         description: List of teams with pagination and filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     sports:
 *                       type: array
 *                       items:
 *                         type: string
 *                     conferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                     divisions:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const {
      sport,
      conference,
      division,
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (sport) filter.sport = sport;
    if (conference && conference !== 'all') filter.conference = conference;
    if (division && division !== 'all') filter.division = division;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { conference: { $regex: search, $options: 'i' } },
        { division: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [teams, total] = await Promise.all([
      Team.find(filter)
        .sort({ 'record.winPercentage': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Team.countDocuments(filter)
    ]);
    
    // Get unique filter options
    const sports = await Team.distinct('sport');
    const conferences = sport ? await Team.distinct('conference', { sport }) : [];
    const divisions = sport && conference ? 
      await Team.distinct('division', { sport, conference }) : [];
    
    res.json({
      success: true,
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        sports,
        conferences,
        divisions
      }
    });
    
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

/**
 * @swagger
 * /api/teams/games:
 *   get:
 *     summary: Get team games
 *     description: Retrieve games data from external API using BALLDONTLIE_API_KEY
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: team_ids
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: Filter by team IDs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for external API pagination
 *     responses:
 *       200:
 *         description: List of games from external API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error or external API error
 */
router.get('/games', async (req, res) => {
  try {
    const { date, team_ids, page = 0 } = req.query;
    
    const params = new URLSearchParams();
    if (date) params.append('dates[]', date);
    if (team_ids) {
      const ids = Array.isArray(team_ids) ? team_ids : [team_ids];
      ids.forEach(id => params.append('team_ids[]', id));
    }
    params.append('page', page);
    
    const response = await axios.get('https://api.balldontlie.io/v1/games', {
      params,
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching games:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch games from external API'
    });
  }
});

/**
 * @swagger
 * /api/teams/games/{id}:
 *   get:
 *     summary: Get specific game by ID
 *     description: Retrieve a single game by ID using BALLDONTLIE_API_KEY
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details from external API
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
 *         description: Server error or external API error
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
      error: error.response?.data?.error || 'Failed to fetch game from external API'
    });
  }
});

/**
 * @swagger
 * /api/teams/players:
 *   get:
 *     summary: Get players data
 *     description: Retrieve players from external API using BALLDONTLIE_API_KEY
 *     tags: [Teams]
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
 *         description: Page number for external API pagination
 *     responses:
 *       200:
 *         description: List of players from external API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error or external API error
 */
router.get('/players', async (req, res) => {
  try {
    const { search, team_id, page = 0 } = req.query;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (team_id) params.append('team_ids[]', team_id);
    params.append('page', page);
    
    const response = await axios.get('https://api.balldontlie.io/v1/players', {
      params,
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching players:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch players from external API'
    });
  }
});

/**
 * @swagger
 * /api/teams/external:
 *   get:
 *     summary: Get teams from external API
 *     description: Retrieve teams data from external API using BALLDONTLIE_API_KEY
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for external API pagination
 *     responses:
 *       200:
 *         description: List of teams from external API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error or external API error
 */
router.get('/external', async (req, res) => {
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
      data: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching external teams:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch teams from external API'
    });
  }
});

/**
 * @swagger
 * /api/teams/stats:
 *   get:
 *     summary: Get team statistics
 *     description: Retrieve team stats from external API using BALLDONTLIE_API_KEY
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: team_ids
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: Filter by team IDs
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: NBA season year
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number for external API pagination
 *     responses:
 *       200:
 *         description: Team statistics from external API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error or external API error
 */
router.get('/stats', async (req, res) => {
  try {
    const { team_ids, season = 2024, page = 0 } = req.query;
    
    const params = new URLSearchParams();
    params.append('season', season);
    params.append('page', page);
    
    if (team_ids) {
      const ids = Array.isArray(team_ids) ? team_ids : [team_ids];
      ids.forEach(id => params.append('team_ids[]', id));
    }
    
    const response = await axios.get('https://api.balldontlie.io/v1/teams', {
      params,
      headers: {
        'Authorization': process.env.BALLDONTLIE_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data.data,
      meta: response.data.meta
    });
    
  } catch (error) {
    console.error('Error fetching team stats:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch team stats from external API'
    });
  }
});

/**
 * @swagger
 * /api/teams/{sport}:
 *   get:
 *     summary: Get teams by sport
 *     description: Retrieve teams filtered by specific sport
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport type (e.g., 'nba', 'nfl')
 *       - in: query
 *         name: conference
 *         schema:
 *           type: string
 *         description: Filter by conference
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of teams per page
 *     responses:
 *       200:
 *         description: List of teams for specific sport
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     conferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                     divisions:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      conference, 
      division,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { sport };
    
    if (conference && conference !== 'all') filter.conference = conference;
    if (division && division !== 'all') filter.division = division;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [teams, total] = await Promise.all([
      Team.find(filter)
        .sort({ 'record.winPercentage': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Team.countDocuments(filter)
    ]);
    
    // Get sport-specific filter options
    const conferences = await Team.distinct('conference', { sport });
    const divisions = conference ? 
      await Team.distinct('division', { sport, conference }) : [];
    
    res.json({
      success: true,
      sport,
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        conferences,
        divisions
      }
    });
    
  } catch (error) {
    console.error('Error fetching teams by sport:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

/**
 * @swagger
 * /api/teams/{sport}/{id}:
 *   get:
 *     summary: Get team by ID and sport
 *     description: Retrieve specific team details with key players and division standings
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport type (e.g., 'nba', 'nfl')
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details with key players and division standings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                     keyPlayers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Player'
 *                     divisionStandings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           record:
 *                             type: object
 *                           city:
 *                             type: string
 *                           stadium:
 *                             type: string
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/:sport/:id', async (req, res) => {
  try {
    const { sport, id } = req.params;
    
    const team = await Team.findOne({ 
      _id: id, 
      sport 
    }).lean();
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Get key players
    const keyPlayers = await Player.find({
      sport,
      team: team.name
    })
    .sort({ fantasyPoints: -1 })
    .limit(5)
    .select('name position fantasyPoints stats')
    .lean();
    
    // Get division standings
    const divisionTeams = await Team.find({
      sport,
      division: team.division
    })
    .sort({ 'record.winPercentage': -1 })
    .select('name record city stadium')
    .lean();
    
    res.json({
      success: true,
      data: {
        team,
        keyPlayers,
        divisionStandings: divisionTeams.map((t, index) => ({
          ...t,
          rank: index + 1
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team'
    });
  }
});

export default router;
