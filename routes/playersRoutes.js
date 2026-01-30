import express from 'express';
import { Player } from '../models/index.js';
import Pagination from '../utils/pagination.js';
import axios from 'axios';

const router = express.Router();

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get players with advanced filtering
 *     description: Retrieve list of players with comprehensive filtering, sorting, and pagination options
 *     tags: [Players]
 *     parameters:
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
 *         description: Number of players per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fantasyPoints, age, salary, points, rebounds, assists]
 *           default: fantasyPoints
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search players by name
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *         description: Filter by team
 *       - in: query
 *         name: positions
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by multiple positions (comma-separated)
 *       - in: query
 *         name: teams
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by multiple teams (comma-separated)
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *         description: Minimum age filter
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Maximum age filter
 *       - in: query
 *         name: minFantasyPoints
 *         schema:
 *           type: integer
 *         description: Minimum fantasy points filter
 *       - in: query
 *         name: maxFantasyPoints
 *         schema:
 *           type: integer
 *         description: Maximum fantasy points filter
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: number
 *         description: Minimum salary filter
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: number
 *         description: Maximum salary filter
 *       - in: query
 *         name: isPremium
 *         schema:
 *           type: boolean
 *         description: Filter by premium status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, injured, inactive]
 *         description: Filter by player status
 *     responses:
 *       200:
 *         description: Paginated list of players with filter metadata
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
 *                     $ref: '#/components/schemas/Player'
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
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *                   properties:
 *                     appliedFilters:
 *                       type: object
 *                     availableFilters:
 *                       type: object
 *                       properties:
 *                         sports:
 *                           type: array
 *                           items:
 *                             type: string
 *                         positions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         teams:
 *                           type: array
 *                           items:
 *                             type: string
 *                         ageRange:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: integer
 *                             max:
 *                               type: integer
 *                         fantasyPointsRange:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: number
 *                             max:
 *                               type: number
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/players/{id}/details:
 *   get:
 *     summary: Get detailed player information
 *     description: Retrieve comprehensive player details including advanced stats using RAPIDAPI_KEY_PLAYER_PRO
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: Season year for stats
 *       - in: query
 *         name: includeAdvanced
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include advanced statistics
 *     responses:
 *       200:
 *         description: Detailed player information with stats
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
 *                     playerInfo:
 *                       type: object
 *                     seasonStats:
 *                       type: object
 *                     advancedStats:
 *                       type: object
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error or external API error
 */
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const { season = 2024, includeAdvanced = true } = req.query;

    // Fetch detailed player information from external API
    const response = await axios.get('https://api-nba-v1.p.rapidapi.com/players/statistics', {
      params: {
        id,
        season
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PLAYER_PRO,
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    });

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found or no data available'
      });
    }

    const playerData = response.data[0];
    
    // Fetch advanced stats if requested
    let advancedStats = null;
    if (includeAdvanced) {
      try {
        const advancedResponse = await axios.get('https://api-nba-v1.p.rapidapi.com/players/playerId/' + id, {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PLAYER_PRO,
            'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
          }
        });
        
        if (advancedResponse.data) {
          advancedStats = advancedResponse.data;
        }
      } catch (advancedError) {
        console.warn('Could not fetch advanced stats:', advancedError.message);
        // Continue without advanced stats
      }
    }

    // Also get player info from local database
    const localPlayer = await Player.findOne({ externalId: id }).lean();

    const result = {
      playerInfo: localPlayer || {
        id: playerData.player.id,
        name: `${playerData.player.firstname} ${playerData.player.lastname}`,
        team: playerData.team?.name,
        position: playerData.player.leagues?.standard?.pos
      },
      seasonStats: {
        games: playerData.games,
        points: playerData.points,
        rebounds: playerData.totReb,
        assists: playerData.assists,
        steals: playerData.steals,
        blocks: playerData.blocks,
        turnovers: playerData.turnovers,
        minutes: playerData.min,
        fieldGoalPct: playerData.fgp,
        threePointPct: playerData.tpp,
        freeThrowPct: playerData.ftp
      }
    };

    if (advancedStats) {
      result.advancedStats = {
        playerEfficiencyRating: advancedStats.efficiency,
        trueShootingPercentage: advancedStats.trueShootingPercentage,
        usageRate: advancedStats.usageRate,
        winShares: advancedStats.winShares,
        boxPlusMinus: advancedStats.boxPlusMinus,
        valueOverReplacement: advancedStats.valueOverReplacement
      };
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching player details:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Player not found in external API'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch player details'
    });
  }
});

/**
 * @swagger
 * /api/players/{id}/gamelog:
 *   get:
 *     summary: Get player game log
 *     description: Retrieve player's game-by-game statistics using RAPIDAPI_KEY_PLAYER_PRO
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: Season year
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for game log (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for game log (YYYY-MM-DD)
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
 *         description: Number of games per page
 *     responses:
 *       200:
 *         description: Player game log with statistics
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
 *                     playerInfo:
 *                       type: object
 *                     games:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           opponent:
 *                             type: string
 *                           result:
 *                             type: string
 *                           minutes:
 *                             type: string
 *                           points:
 *                             type: integer
 *                           rebounds:
 *                             type: integer
 *                           assists:
 *                             type: integer
 *                           steals:
 *                             type: integer
 *                           blocks:
 *                             type: integer
 *                           turnovers:
 *                             type: integer
 *                           fieldGoalMade:
 *                             type: integer
 *                           fieldGoalAttempted:
 *                             type: integer
 *                           threePointMade:
 *                             type: integer
 *                           threePointAttempted:
 *                             type: integer
 *                           freeThrowMade:
 *                             type: integer
 *                           freeThrowAttempted:
 *                             type: integer
 *                     averages:
 *                       type: object
 *                       properties:
 *                         points:
 *                           type: number
 *                         rebounds:
 *                           type: number
 *                         assists:
 *                           type: number
 *                         steals:
 *                           type: number
 *                         blocks:
 *                           type: number
 *                         fieldGoalPct:
 *                           type: number
 *                         threePointPct:
 *                           type: number
 *                         freeThrowPct:
 *                           type: number
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error or external API error
 */
router.get('/:id/gamelog', async (req, res) => {
  try {
    const { id } = req.params;
    const { season = 2024, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Fetch player game log from external API
    const response = await axios.get('https://api-nba-v1.p.rapidapi.com/games', {
      params: {
        player: id,
        season,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PLAYER_PRO,
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    });

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No game log found for this player'
      });
    }

    // Process and paginate game log
    const allGames = response.data;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedGames = allGames.slice(startIndex, endIndex);

    // Calculate averages
    const averages = {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      fieldGoalPct: 0,
      threePointPct: 0,
      freeThrowPct: 0
    };

    const formattedGames = paginatedGames.map(game => {
      // Update averages
      averages.points += game.points || 0;
      averages.rebounds += game.totReb || 0;
      averages.assists += game.assists || 0;
      averages.steals += game.steals || 0;
      averages.blocks += game.blocks || 0;
      
      const fgm = game.fgm || 0;
      const fga = game.fga || 1; // Avoid division by zero
      const tpm = game.tpm || 0;
      const tpa = game.tpa || 1;
      const ftm = game.ftm || 0;
      const fta = game.fta || 1;
      
      averages.fieldGoalPct += (fgm / fga) * 100;
      averages.threePointPct += (tpm / tpa) * 100;
      averages.freeThrowPct += (ftm / fta) * 100;

      return {
        date: game.date?.start,
        opponent: game.teams?.visitors?.name || 'Unknown',
        result: game.scores?.visitors?.points ? 
          `${game.teams?.home?.name} ${game.scores?.home?.points} - ${game.scores?.visitors?.points}` : 'TBD',
        minutes: game.min || '0:00',
        points: game.points || 0,
        rebounds: game.totReb || 0,
        assists: game.assists || 0,
        steals: game.steals || 0,
        blocks: game.blocks || 0,
        turnovers: game.turnovers || 0,
        fieldGoalMade: fgm,
        fieldGoalAttempted: fga,
        threePointMade: tpm,
        threePointAttempted: tpa,
        freeThrowMade: ftm,
        freeThrowAttempted: fta,
        plusMinus: game.plusMinus || 0
      };
    });

    // Calculate final averages
    const gameCount = Math.max(formattedGames.length, 1);
    Object.keys(averages).forEach(key => {
      averages[key] = parseFloat((averages[key] / gameCount).toFixed(1));
    });

    // Get player info from local database
    const localPlayer = await Player.findOne({ externalId: id }).lean();

    res.json({
      success: true,
      data: {
        playerInfo: localPlayer || {
          id,
          name: formattedGames[0]?.playerName || 'Unknown Player'
        },
        games: formattedGames,
        averages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allGames.length,
          pages: Math.ceil(allGames.length / parseInt(limit)),
          hasNext: endIndex < allGames.length,
          hasPrev: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching player game log:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Player game log not found'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch player game log'
    });
  }
});

/**
 * @swagger
 * /api/players/filters:
 *   get:
 *     summary: Get available player filter options
 *     description: Retrieve distinct values for filtering players
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter options by sport
 *     responses:
 *       200:
 *         description: Available filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 filters:
 *                   type: object
 *                   properties:
 *                     sports:
 *                       type: array
 *                       items:
 *                         type: string
 *                     positions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     teams:
 *                       type: array
 *                       items:
 *                         type: string
 *                     ageRange:
 *                       type: object
 *                       properties:
 *                         minAge:
 *                           type: integer
 *                         maxAge:
 *                           type: integer
 *                         avgAge:
 *                           type: number
 *                     fantasyRange:
 *                       type: object
 *                       properties:
 *                         minFantasy:
 *                           type: number
 *                         maxFantasy:
 *                           type: number
 *                         avgFantasy:
 *                           type: number
 *       500:
 *         description: Server error
 */
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
