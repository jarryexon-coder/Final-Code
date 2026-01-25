import express from 'express';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

const router = express.Router();

// GET /api/teams - List all teams
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

// GET /api/teams/:sport - Get teams by sport
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

// GET /api/teams/:sport/:id - Get team by ID
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
