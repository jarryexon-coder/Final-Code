import express from 'express';
import Player from '../models/Player.js';
import Stat from '../models/Stat.js';

const router = express.Router();

// Stat categories for each sport
const statCategories = {
  NBA: {
    scoring: ['points', 'pointsPerGame', 'fieldGoalPercentage', 'threePointPercentage'],
    playmaking: ['assists', 'assistsPerGame', 'turnovers', 'assistToTurnoverRatio'],
    rebounding: ['rebounds', 'reboundsPerGame', 'offensiveRebounds', 'defensiveRebounds'],
    defense: ['steals', 'blocks', 'defensiveRating'],
    advanced: ['playerEfficiencyRating', 'winShares', 'valueOverReplacementPlayer'],
    fantasy: ['fantasyPoints', 'fantasyPointsPerGame']
  },
  NFL: {
    passing: ['passingYards', 'passingTDs', 'interceptions', 'completionPercentage', 'passerRating'],
    rushing: ['rushingYards', 'rushingTDs', 'yardsPerCarry', 'rushingAttempts'],
    receiving: ['receivingYards', 'receivingTDs', 'receptions', 'yardsPerReception'],
    defense: ['tackles', 'sacks', 'interceptions', 'passesDefended'],
    fantasy: ['fantasyPoints', 'fantasyPointsPerGame']
  },
  NHL: {
    scoring: ['goals', 'assists', 'points', 'plusMinus', 'powerPlayGoals'],
    goaltending: ['savePercentage', 'goalsAgainstAverage', 'wins', 'shutouts'],
    fantasy: ['fantasyPoints', 'fantasyPointsPerGame']
  },
  MLB: {
    batting: ['battingAverage', 'homeRuns', 'rbi', 'runs', 'onBasePercentage', 'sluggingPercentage'],
    pitching: ['era', 'wins', 'strikeouts', 'whip', 'saves'],
    fantasy: ['fantasyPoints', 'fantasyPointsPerGame']
  }
};

/**
 * @swagger
 * /api/stats/categories/{sport}:
 *   get:
 *     summary: Get statistical categories for a sport
 *     description: Retrieve all available statistical categories organized by type for a specific sport
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to get categories for
 *     responses:
 *       200:
 *         description: Statistical categories for the sport
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 categories:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Sport not found or no stat categories defined
 *       500:
 *         description: Server error
 */
router.get('/categories/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    const categories = statCategories[sport.toUpperCase()];
    
    if (!categories) {
      return res.status(404).json({
        success: false,
        error: 'Sport not found or no stat categories defined'
      });
    }
    
    res.json({
      success: true,
      sport,
      categories,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching stat categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stat categories'
    });
  }
});

/**
 * @swagger
 * /api/stats/leaders/{sport}:
 *   get:
 *     summary: Get statistical leaders for a sport
 *     description: Retrieve top statistical performers in a specific category for a sport
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to analyze
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           default: 'scoring'
 *         description: Statistical category (e.g., scoring, rebounding, passing)
 *       - in: query
 *         name: stat
 *         schema:
 *           type: string
 *         description: Specific statistic within the category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of leaders to return
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Season filter (format: YYYY-YY)
 *       - in: query
 *         name: min_games
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Minimum games played filter
 *     responses:
 *       200:
 *         description: Statistical leaders for the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sport:
 *                   type: string
 *                 category:
 *                   type: string
 *                 stat:
 *                   type: string
 *                 leaders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StatLeader'
 *                 leagueAverage:
 *                   type: number
 *                 sampleSize:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/leaders/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      category = 'scoring',
      stat,
      limit = 10,
      season,
      min_games
    } = req.query;
    
    // Determine which stat to use for the category
    let statToUse = stat;
    
    if (!statToUse && statCategories[sport.toUpperCase()]?.[category]) {
      statToUse = statCategories[sport.toUpperCase()][category][0];
    }
    
    if (!statToUse) {
      return res.status(400).json({
        success: false,
        error: 'Stat parameter is required or category not found'
      });
    }
    
    // Build query based on sport and stat
    const query = { sport: sport.toUpperCase() };
    
    // Add season filter if provided
    if (season) {
      query.season = season;
    }
    
    // Add min games filter if provided
    if (min_games) {
      query.gamesPlayed = { $gte: parseInt(min_games) };
    }
    
    // For certain stats, we need to handle position filters
    if (sport.toUpperCase() === 'NFL') {
      if (statToUse.includes('passing')) {
        query.position = 'QB';
      } else if (statToUse.includes('rushing')) {
        query.position = 'RB';
      } else if (statToUse.includes('receiving')) {
        query.position = { $in: ['WR', 'TE'] };
      }
    }
    
    // Get players and sort by the stat
    let players = await Player.find(query)
      .select('name team position age stats fantasyPoints gamesPlayed season')
      .lean();
    
    // Sort players based on the stat
    players.sort((a, b) => {
      let aValue = getStatValue(a, statToUse);
      let bValue = getStatValue(b, statToUse);
      
      const lowerIsBetter = ['era', 'whip', 'goalsAgainstAverage', 'interceptions', 'turnovers'];
      if (lowerIsBetter.includes(statToUse)) {
        return aValue - bValue;
      }
      
      return bValue - aValue;
    });
    
    // Take top players
    const leaders = players.slice(0, parseInt(limit)).map((player, index) => ({
      rank: index + 1,
      playerId: player._id,
      playerName: player.name,
      playerTeam: player.team,
      playerPosition: player.position,
      value: getStatValue(player, statToUse),
      fantasyPoints: player.fantasyPoints || 0,
      age: player.age || 'N/A',
      gamesPlayed: player.gamesPlayed || 0,
      season: player.season || 'Current'
    }));
    
    // Calculate league averages
    const leagueAverage = players.length > 0 ? 
      players.reduce((sum, player) => sum + getStatValue(player, statToUse), 0) / players.length : 0;
    
    res.json({
      success: true,
      sport,
      category,
      stat: statToUse,
      leaders,
      leagueAverage: parseFloat(leagueAverage.toFixed(2)),
      sampleSize: players.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching stat leaders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stat leaders'
    });
  }
});

/**
 * @swagger
 * /api/stats/games:
 *   get:
 *     summary: Get games with statistical data
 *     description: Retrieve games with comprehensive statistical information
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter games
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: include_advanced_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include advanced statistical metrics
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: Games with statistical data
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
 *                     $ref: '#/components/schemas/GameStats'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, date, team_id, include_advanced_stats, limit } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await StatsService.getGamesWithStats(sport, date, team_id, include_advanced_stats, limit);
    
    res.json({
      success: true,
      message: 'Games endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching games with stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/stats/games/{id}:
 *   get:
 *     summary: Get specific game statistics
 *     description: Retrieve detailed statistical data for a specific game
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: include_player_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include detailed player statistics
 *       - in: query
 *         name: include_team_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include team-level statistics
 *       - in: query
 *         name: stat_detail_level
 *         schema:
 *           type: string
 *           default: 'basic'
 *           enum: [basic, advanced, comprehensive]
 *         description: Level of statistical detail to include
 *     responses:
 *       200:
 *         description: Detailed game statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameDetailStats'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_player_stats, include_team_stats, stat_detail_level } = req.query;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/stats/players:
 *   get:
 *     summary: Get player statistics
 *     description: Retrieve comprehensive statistical data for players
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter players
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by player position
 *       - in: query
 *         name: min_games
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Minimum games played filter
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'traditional'
 *           enum: [traditional, advanced, fantasy, all]
 *         description: Type of statistics to include
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of players to return
 *     responses:
 *       200:
 *         description: Player statistics data
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
 *                     $ref: '#/components/schemas/PlayerStats'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, team_id, position, min_games, stat_type, limit } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching player statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/stats/teams:
 *   get:
 *     summary: Get team statistics
 *     description: Retrieve comprehensive statistical data for teams
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to filter teams
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
 *         name: stat_type
 *         schema:
 *           type: string
 *           default: 'traditional'
 *           enum: [traditional, advanced, efficiency, all]
 *         description: Type of statistics to include
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: 'winPercentage'
 *         description: Field to sort results by
 *     responses:
 *       200:
 *         description: Team statistics data
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
 *                     $ref: '#/components/schemas/TeamStats'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, conference, division, stat_type, sort_by } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching team statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/stats/stats:
 *   get:
 *     summary: Get comprehensive statistical data
 *     description: Retrieve aggregated statistical data across various dimensions
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [NBA, NFL, NHL, MLB]
 *         description: Sport to get stats for
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Season filter (format: YYYY-YY)
 *       - in: query
 *         name: stat_category
 *         schema:
 *           type: string
 *           default: 'all'
 *           enum: [all, offense, defense, efficiency, pace, shooting]
 *         description: Statistical category to retrieve
 *       - in: query
 *         name: aggregate_by
 *         schema:
 *           type: string
 *           default: 'team'
 *           enum: [team, player, game, league]
 *         description: How to aggregate the statistics
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 'regular'
 *           enum: [regular, postseason, all]
 *         description: Period of games to include
 *     responses:
 *       200:
 *         description: Comprehensive statistical data
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
 *                     $ref: '#/components/schemas/ComprehensiveStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, season, stat_category, aggregate_by, period } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching comprehensive stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to get stat value from player object
function getStatValue(player, stat) {
  if (!player || !stat) return 0;
  
  // Check in stats object first
  if (player.stats && player.stats[stat] !== undefined) {
    return parseFloat(player.stats[stat]) || 0;
  }
  
  // Check in advancedStats
  if (player.advancedStats && player.advancedStats[stat] !== undefined) {
    const value = player.advancedStats[stat];
    if (typeof value === 'string' && value.includes('%')) {
      return parseFloat(value.replace('%', '')) || 0;
    }
    return parseFloat(value) || 0;
  }
  
  // Check direct properties
  if (player[stat] !== undefined) {
    return parseFloat(player[stat]) || 0;
  }
  
  return 0;
}

export default router;
