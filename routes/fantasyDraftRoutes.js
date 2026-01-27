import express from 'express';
import fantasyDraftController from '../controllers/fantasyDraftController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import DraftRecommendation from '../models/DraftRecommendation.js';
import realDataService from '../services/realDataService.js';

const router = express.Router();

// Rate limiting for draft endpoints
const draftLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    error: 'Too many draft requests. Please try again later.'
  }
});

// GET snake draft endpoint (existing from File 2)
router.get('/snake', draftLimiter, async (req, res) => {
  await fantasyDraftController.generateSnakeDraft(req, res);
});

// POST snake draft endpoint with optimization algorithm (from File 1)
router.post('/snake', authenticateToken, draftLimiter, async (req, res) => {
  try {
    const { position, sport, platform, teams, rounds } = req.body;
    
    // Get real projections
    const projections = await realDataService.getFantasyProjections(sport);
    
    // Run real optimization algorithm
    const optimalPicks = await optimizeSnakeDraft({
      draftPosition: position,
      projections,
      platform,
      teamCount: teams,
      rounds
    });
    
    res.json({
      success: true,
      draftPosition: position,
      sport,
      platform,
      totalTeams: teams,
      totalRounds: rounds,
      picks: optimalPicks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Snake draft error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Turn draft endpoint
router.get('/turn', draftLimiter, async (req, res) => {
  await fantasyDraftController.generateTurnDraft(req, res);
});

// Get saved drafts (authenticated)
router.get('/saved', authenticateToken, async (req, res) => {
  req.query.userId = req.user._id;
  await fantasyDraftController.getSavedDrafts(req, res);
});

// Simulate draft
router.post('/simulate', authenticateToken, draftLimiter, async (req, res) => {
  await fantasyDraftController.simulateDraft(req, res);
});

// Save draft results
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { draftData, name = 'My Draft' } = req.body;
    
    if (!draftData) {
      return res.status(400).json({
        success: false,
        error: 'Draft data is required'
      });
    }

    const savedDraft = new DraftRecommendation({
      userId: req.user._id,
      name,
      ...draftData,
      savedAt: new Date()
    });

    await savedDraft.save();

    res.json({
      success: true,
      data: savedDraft,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft'
    });
  }
});

// Share draft results
router.post('/share/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const draft = await DraftRecommendation.findById(draftId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    // Generate shareable link or text
    const shareData = {
      draftId: draft._id,
      type: draft.type,
      sport: draft.sport,
      draftPosition: draft.draftPosition,
      platform: draft.platform,
      picks: draft.picks.slice(0, 3),
      shareUrl: `${process.env.FRONTEND_URL}/draft/${draft._id}`,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: shareData,
      shareText: generateShareText(draft)
    });
  } catch (error) {
    console.error('Share draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share draft'
    });
  }
});

// Draft optimization algorithm (from File 1)
async function optimizeSnakeDraft(params) {
  const { draftPosition, projections, platform, teamCount, rounds } = params;
  
  // Calculate optimal picks based on:
  // 1. Value over replacement (VOR)
  // 2. Positional scarcity
  // 3. Stacking opportunities
  // 4. Risk adjustment
  
  const picks = [];
  const myPicks = calculateMyPickNumbers(draftPosition, teamCount, rounds);
  
  for (const pickNumber of myPicks) {
    const round = Math.ceil(pickNumber / teamCount);
    const pickInRound = ((pickNumber - 1) % teamCount) + 1;
    
    // Get best available player for this pick
    const bestPlayer = findBestAvailablePlayer({
      takenPlayers: picks.map(p => p.player?.id || p.playerId),
      projections,
      round,
      pickInRound,
      platform
    });
    
    picks.push({
      round,
      pick: pickNumber,
      player: bestPlayer,
      reason: generatePickReason(bestPlayer, round, platform)
    });
  }
  
  return picks;
}

// Helper functions from File 1
function calculateMyPickNumbers(draftPosition, teamCount, rounds) {
  const picks = [];
  for (let round = 1; round <= rounds; round++) {
    let pickNumber;
    if (round % 2 === 1) {
      // Odd round: normal order
      pickNumber = (round - 1) * teamCount + draftPosition;
    } else {
      // Even round: reverse order
      pickNumber = (round - 1) * teamCount + (teamCount - draftPosition + 1);
    }
    picks.push(pickNumber);
  }
  return picks;
}

function findBestAvailablePlayer({ takenPlayers, projections, round, pickInRound, platform }) {
  // Filter out taken players
  const availablePlayers = projections.filter(player => 
    !takenPlayers.includes(player.id)
  );
  
  // Sort by projection value (adjusted for round and position scarcity)
  const sortedPlayers = availablePlayers.sort((a, b) => {
    const valueA = calculatePlayerValue(a, round, platform);
    const valueB = calculatePlayerValue(b, round, platform);
    return valueB - valueA;
  });
  
  return sortedPlayers.length > 0 ? sortedPlayers[0] : null;
}

function calculatePlayerValue(player, round, platform) {
  // Base value from projections
  let value = player.projectedPoints || 0;
  
  // Positional scarcity adjustment
  const positionScarcity = {
    'QB': 1.0,
    'RB': 1.2,
    'WR': 1.1,
    'TE': 1.3,
    'DEF': 0.8,
    'K': 0.7
  };
  
  if (player.position && positionScarcity[player.position]) {
    value *= positionScarcity[player.position];
  }
  
  // Round-based adjustment (earlier rounds value upside)
  if (round <= 3) {
    value *= player.ceiling / player.floor || 1.1;
  } else if (round >= 10) {
    value *= player.floor / player.ceiling || 0.9;
  }
  
  // Platform-specific scoring adjustments
  if (platform === 'PPR') {
    value *= player.receptions ? 1.15 : 1.0;
  } else if (platform === 'Half-PPR') {
    value *= player.receptions ? 1.07 : 1.0;
  }
  
  return value;
}

function generatePickReason(player, round, platform) {
  const reasons = [
    `Best available player in round ${round}`,
    `Strong ${player.position} value at this spot`,
    `High floor/ceiling combination`,
    `Fits your draft strategy`,
    `Addresses positional need`,
    `Consistent performer in ${platform} format`
  ];
  
  // Default reason
  let reason = reasons[0];
  
  if (round <= 3 && player.tier === 1) {
    reason = `Elite ${player.position} - cornerstone pick`;
  } else if (round >= 8 && player.sleeper) {
    reason = `Sleeper pick with high upside`;
  } else if (player.position === 'TE' && round <= 6) {
    reason = `Premium TE - positional advantage`;
  } else if (player.position === 'RB' && round <= 5) {
    reason = `Workhorse RB - secure volume`;
  }
  
  return reason;
}

function generateShareText(draft) {
  return `${draft.type === 'snake' ? 'Snake' : 'Turn'} Draft Results
Pick #${draft.draftPosition} • ${draft.sport} • ${draft.platform}

Top Picks:
${draft.picks.slice(0, 3).map((pick, i) => 
  `${i + 1}. ${pick.player?.name || pick.playerId?.name || 'Unknown'} - ${pick.player?.position || ''}`
).join('\n')}

Generated by Fantasy Team PRO • ${new Date(draft.savedAt).toLocaleDateString()}`;
}

export default router;
