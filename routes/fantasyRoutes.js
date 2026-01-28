import express from 'express';
import fantasyController from '../controllers/fantasyController.js';
import Player from '../models/Player.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fantasy API is working',
    endpoints: ['/players', '/players/:playerId', '/ai-advice'],
    timestamp: new Date().toISOString()
  });
});


// Get fantasy players with filtering
router.get('/players', async (req, res) => {
  try {
    const { 
      sport = 'NBA',
      position,
      team,
      search,
      minSalary,
      maxSalary,
      minProjection,
      limit = 50,
      sortBy = 'valueScore',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { sport, active: true };
    
    if (position && position !== 'ALL') {
      if (position.includes(',')) {
        filter.position = { $in: position.split(',') };
      } else {
        filter.position = position;
      }
    }
    
    if (team && team !== 'all') {
      filter.team = team;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { team: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minSalary) {
      filter.fanDuelSalary = { ...filter.fanDuelSalary, $gte: parseInt(minSalary) };
    }
    
    if (maxSalary) {
      filter.fanDuelSalary = { ...filter.fanDuelSalary, $lte: parseInt(maxSalary) };
    }
    
    if (minProjection) {
      filter.projection = { $gte: parseFloat(minProjection) };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const players = await Player.find(filter)
      .sort(sort)
      .limit(parseInt(limit));

    // Calculate additional metrics
    const enhancedPlayers = players.map(player => ({
      ...player.toObject(),
      fanDuelSalary: player.fanDuelSalary || calculateFanDuelSalary(player),
      draftKingsSalary: player.draftKingsSalary || calculateDraftKingsSalary(player),
      valueScore: player.valueScore || calculateValueScore(player),
      fantasyScore: player.fantasyScore || calculateFantasyScore(player),
      trend: determineTrend(player)
    }));

    res.json({
      success: true,
      data: enhancedPlayers,
      count: enhancedPlayers.length,
      filters: {
        sport,
        position,
        team,
        search
      }
    });
  } catch (error) {
    console.error('Get fantasy players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fantasy players'
    });
  }
});

// Get player details
router.get('/players/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const player = await Player.findById(playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Get similar players
    const similarPlayers = await Player.find({
      sport: player.sport,
      position: player.position,
      _id: { $ne: player._id },
      projection: { $gte: player.projection * 0.8 }
    }).limit(5);

    res.json({
      success: true,
      data: {
        player,
        similarPlayers,
        analytics: {
          valueAnalysis: analyzePlayerValue(player),
          riskAssessment: assessPlayerRisk(player),
          matchupAnalysis: analyzeMatchup(player),
          ownershipTrend: getOwnershipTrend(player)
        }
      }
    });
  } catch (error) {
    console.error('Get player details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player details'
    });
  }
});

// Get AI fantasy advice
router.get('/ai-advice', authenticateToken, async (req, res) => {
  try {
    const { prompt, sport = 'NBA', platform = 'FanDuel' } = req.query;
    
    let advice = {};
    
    // Parse prompt for specific queries
    if (prompt.toLowerCase().includes('best value')) {
      advice = await getBestValuePicks(sport, platform);
    } else if (prompt.toLowerCase().includes('sleepers')) {
      advice = await getSleepers(sport, platform);
    } else if (prompt.toLowerCase().includes('draft')) {
      advice = await getDraftAdvice(prompt, sport, platform);
    } else if (prompt.toLowerCase().includes('stack')) {
      advice = await getStackingAdvice(sport, platform);
    } else {
      // General advice
      advice = await getGeneralAdvice(sport, platform);
    }

    res.json({
      success: true,
      data: {
        prompt,
        sport,
        platform,
        advice,
        generatedAt: new Date().toISOString(),
        confidence: 0.85
      }
    });
  } catch (error) {
    console.error('AI advice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI advice'
    });
  }
});

// Helper functions
function calculateFanDuelSalary(player) {
  // Implement salary calculation logic
  const base = player.projection * 400;
  return Math.round(base / 100) * 100;
}

function calculateValueScore(player) {
  const salary = player.fanDuelSalary || 5000;
  const projection = player.projection || 20;
  const valueRatio = projection / (salary / 1000);
  
  // Normalize to 0-10 scale
  return Math.min(valueRatio * 10, 10).toFixed(1);
}

export default router;
