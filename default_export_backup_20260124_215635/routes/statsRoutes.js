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

// GET /api/stats/categories/:sport - Get stat categories
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

// GET /api/stats/leaders/:sport - Get stat leaders
router.get('/leaders/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      category = 'scoring',
      stat,
      limit = 10 
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
      .select('name team position age stats fantasyPoints')
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
      age: player.age || 'N/A'
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
