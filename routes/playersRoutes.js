import express from 'express';
import { Player } from '../models/index.js';
import Pagination from '../utils/pagination.js';

const router = express.Router();

// GET /api/players with advanced pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'fantasyPoints',
      order = 'desc',
      search,
      sport,
      position,
      team,
      positions,
      teams,
      minAge,
      maxAge,
      minFantasyPoints,
      maxFantasyPoints,
      minSalary,
      maxSalary,
      isPremium,
      status
    } = req.query;

    // Build filter query
    const filters = {
      ...(search && { search }),
      ...(sport && { sport }),
      ...(position && position !== 'all' && { position }),
      ...(team && team !== 'all' && { team }),
      ...(positions && { positions: positions.split(',') }),
      ...(teams && { teams: teams.split(',') }),
      ...(minAge && { minAge: parseInt(minAge) }),
      ...(maxAge && { maxAge: parseInt(maxAge) }),
      ...(minFantasyPoints && { minFantasyPoints: parseInt(minFantasyPoints) }),
      ...(maxFantasyPoints && { maxFantasyPoints: parseInt(maxFantasyPoints) }),
      ...(minSalary && { minSalary: parseFloat(minSalary.replace(/[^0-9.]/g, '')) }),
      ...(maxSalary && { maxSalary: parseFloat(maxSalary.replace(/[^0-9.]/g, '')) }),
      ...(isPremium && { isPremium }),
      ...(status && { status })
    };

    const query = Pagination.buildFilterQuery(filters);
    const sort = Pagination.buildSort(sortBy, order);

    // Create pagination instance
    const pagination = new Pagination(Player, query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: 'teamId'
    });

    // Get paginated results
    const result = await pagination.paginate();

    // Add filter metadata
    const filterMetadata = {
      appliedFilters: Object.keys(filters).length > 0 ? filters : 'none',
      availableFilters: {
        sports: await Player.distinct('sport'),
        positions: await Player.distinct('position'),
        teams: await Player.distinct('team'),
        ageRange: {
          min: await Player.findOne().sort({ age: 1 }).select('age').lean(),
          max: await Player.findOne().sort({ age: -1 }).select('age').lean()
        },
        fantasyPointsRange: {
          min: await Player.findOne().sort({ fantasyPoints: 1 }).select('fantasyPoints').lean(),
          max: await Player.findOne().sort({ fantasyPoints: -1 }).select('fantasyPoints').lean()
        }
      }
    };

    res.json({
      success: true,
      ...result,
      filters: filterMetadata
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// GET /api/players/filters - Get available filter options
router.get('/filters', async (req, res) => {
  try {
    const { sport } = req.query;
    
    const filterQuery = sport ? { sport } : {};
    
    const [
      sports,
      positions,
      teams,
      ageStats,
      fantasyStats
    ] = await Promise.all([
      Player.distinct('sport'),
      Player.distinct('position', filterQuery),
      Player.distinct('team', filterQuery),
      Player.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: null,
            minAge: { $min: '$age' },
            maxAge: { $max: '$age' },
            avgAge: { $avg: '$age' }
          }
        }
      ]),
      Player.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: null,
            minFantasy: { $min: '$fantasyPoints' },
            maxFantasy: { $max: '$fantasyPoints' },
            avgFantasy: { $avg: '$fantasyPoints' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      filters: {
        sports,
        positions,
        teams,
        ageRange: ageStats[0] || { minAge: 0, maxAge: 0, avgAge: 0 },
        fantasyRange: fantasyStats[0] || { minFantasy: 0, maxFantasy: 0, avgFantasy: 0 }
      }
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filter options'
    });
  }
});

export default router;
