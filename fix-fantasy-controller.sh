#!/bin/bash
# fix-fantasy-controller.sh

echo "🔧 Fixing missing generateOptimalDraft export in fantasyDraftController.js..."
echo "=============================================================="

# Check if file exists
if [ ! -f "controllers/fantasyDraftController.js" ]; then
    echo "❌ File controllers/fantasyDraftController.js not found!"
    exit 1
fi

# First, let's see what's already there
echo "Current exports in fantasyDraftController.js:"
grep -E "export\s+(const|function)" controllers/fantasyDraftController.js | \
sed 's/export\s*//' | head -20

echo ""
echo "📝 Adding generateOptimalDraft function..."

# Find a good place to insert the new function (before the default export at the end)
INSERT_LINE=$(grep -n "export default {" controllers/fantasyDraftController.js | tail -1 | cut -d: -f1)
INSERT_LINE=$((INSERT_LINE - 1))

# Create the new function content
NEW_FUNCTION='
// Generate optimal draft
export const generateOptimalDraft = async (req, res) => {
  try {
    const {
      sport = "NBA",
      draftType = "snake",
      teams = 10,
      rounds = 15,
      strategy = "balanced",
      userPosition = 1,
      constraints = {}
    } = req.body;

    // Get top players
    const players = await Player.find({ 
      sport,
      isActive: true 
    })
    .sort({ fantasyScore: -1 })
    .limit(teams * rounds * 2)
    .lean();

    if (!players || players.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No players found for the specified sport"
      });
    }

    // Generate optimal draft based on strategy
    const optimalDraft = generateOptimalDraftStrategy(
      players,
      draftType,
      teams,
      rounds,
      strategy,
      userPosition,
      constraints
    );

    // Calculate draft grade and recommendations
    const analysis = analyzeOptimalDraft(optimalDraft, strategy);

    res.json({
      success: true,
      data: {
        draftType,
        teams,
        rounds,
        userPosition,
        strategy,
        optimalPicks: optimalDraft.userPicks,
        fullDraft: optimalDraft.allPicks,
        analysis,
        recommendations: getOptimalDraftRecommendations(optimalDraft, strategy),
        constraints: optimalDraft.constraints
      }
    });
  } catch (error) {
    console.error("Generate optimal draft error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate optimal draft", 
      error: error.message 
    });
  }
};

// Helper function for optimal draft strategy
const generateOptimalDraftStrategy = (players, draftType, teams, rounds, strategy, userPosition, constraints) => {
  // Clone players array
  const availablePlayers = [...players];
  const picks = [];
  const userPicks = [];
  
  // Position constraints
  const positionConstraints = constraints.positions || {
    PG: { min: 1, max: 3 },
    SG: { min: 1, max: 3 },
    SF: { min: 1, max: 3 },
    PF: { min: 1, max: 3 },
    C: { min: 1, max: 2 }
  };

  // Strategy implementations
  const strategyMap = {
    balanced: "Select balanced team across all positions",
    starsAndScrubs: "Focus on elite players early, fill with value later",
    puntCategories: "Sacrifice certain stats to dominate others",
    zeroRB: "Wait on running backs, load up on other positions",
    heroRB: "Get one elite RB early, then focus on other positions"
  };

  // Simulate draft rounds
  let currentPick = 1;
  const userPicksMade = [];

  for (let round = 1; round <= rounds; round++) {
    const isReverse = draftType === "snake" && round % 2 === 0;
    const roundOrder = isReverse ? 
      Array.from({ length: teams }, (_, i) => teams - i) : 
      Array.from({ length: teams }, (_, i) => i + 1);
    
    for (const team of roundOrder) {
      // Select best available player based on strategy and constraints
      const selectedPlayer = selectOptimalPlayer(
        availablePlayers,
        round,
        team === userPosition,
        strategy,
        positionConstraints,
        userPicksMade
      );

      if (selectedPlayer) {
        const pick = {
          round,
          overallPick: currentPick,
          team,
          player: selectedPlayer,
          isUserPick: team === userPosition,
          strategy: getPickStrategyForRound(round, strategy)
        };

        picks.push(pick);

        if (team === userPosition) {
          userPicks.push(pick);
          userPicksMade.push(selectedPlayer.position);
        }

        // Remove selected player
        const index = availablePlayers.findIndex(p => p._id === selectedPlayer._id);
        if (index > -1) {
          availablePlayers.splice(index, 1);
        }

        currentPick++;
      }
    }
  }

  return {
    draftType,
    teams,
    rounds,
    userPosition,
    strategy,
    userPicks,
    allPicks: picks,
    constraints: {
      positions: positionConstraints,
      ...constraints
    }
  };
};

// Select optimal player based on strategy
const selectOptimalPlayer = (players, round, isUserPick, strategy, constraints, userPicksMade) => {
  if (players.length === 0) return null;

  // Score each player
  const scoredPlayers = players.map(player => {
    let score = player.fantasyScore || 50;

    // Round adjustments
    if (round <= 3) {
      // Early rounds: prioritize stars
      score *= 1.3;
    } else if (round <= 8) {
      // Middle rounds: balance
      score *= 1.0;
    } else {
      // Late rounds: value and upside
      score *= 0.9;
      if (player.age < 25) score *= 1.2; // Upside for young players
    }

    // Position scarcity
    const positionScarcity = {
      "C": 1.3,   // Centers are scarce
      "PG": 1.1,  // Point guards are valuable
      "SG": 1.0,
      "SF": 1.0,
      "PF": 1.2   // Power forwards are somewhat scarce
    };
    
    const scarcityMultiplier = positionScarcity[player.position] || 1.0;
    score *= scarcityMultiplier;

    // Strategy-specific adjustments
    if (strategy === "starsAndScrubs" && round <= 4) {
      score *= 1.4; // Go big on stars early
    } else if (strategy === "zeroRB" && player.position === "RB") {
      score *= 0.5; // Devalue RBs for zeroRB strategy
    }

    // Check position constraints
    if (isUserPick) {
      const positionCount = userPicksMade.filter(p => p === player.position).length;
      const maxForPosition = constraints[player.position]?.max || 3;
      
      if (positionCount >= maxForPosition) {
        score *= 0.3; // Heavily penalize if we already have enough at this position
      }
    }

    return {
      ...player,
      optimalScore: score
    };
  });

  // Sort by optimal score and return best
  scoredPlayers.sort((a, b) => b.optimalScore - a.optimalScore);
  return scoredPlayers[0] || players[0];
};

// Get strategy for each pick
const getPickStrategyForRound = (round, overallStrategy) => {
  if (round <= 3) return "elite";
  if (round <= 8) return "core";
  if (round <= 12) return "value";
  return "depth";
};

// Analyze optimal draft
const analyzeOptimalDraft = (draft, strategy) => {
  const userTeam = draft.userPicks;
  const positions = {};
  let totalValue = 0;
  let eliteCount = 0;

  userTeam.forEach(pick => {
    const pos = pick.player.position;
    positions[pos] = (positions[pos] || 0) + 1;
    totalValue += pick.player.fantasyScore || 0;
    if (pick.round <= 3) eliteCount++;
  });

  // Calculate team strengths
  const strengths = [];
  if (eliteCount >= 2) strengths.push("Strong elite talent");
  if (Object.keys(positions).length >= 4) strengths.push("Good positional balance");
  if (userTeam.length >= 5) strengths.push("Solid depth");

  // Calculate weaknesses
  const weaknesses = [];
  const neededPositions = Object.keys(draft.constraints.positions || {}).filter(pos => {
    const min = draft.constraints.positions[pos].min || 1;
    return (positions[pos] || 0) < min;
  });
  
  if (neededPositions.length > 0) {
    weaknesses.push(`Need more: ${neededPositions.join(", ")}`);
  }

  // Calculate grade
  const avgValue = totalValue / userTeam.length;
  let grade = "B";
  if (avgValue > 75) grade = "A";
  if (avgValue > 85) grade = "A+";
  if (avgValue < 60) grade = "C";
  if (avgValue < 50) grade = "D";

  return {
    positions,
    totalValue,
    averageValue: avgValue.toFixed(1),
    eliteCount,
    grade,
    strengths,
    weaknesses,
    strategyMatch: calculateStrategyMatch(userTeam, strategy)
  };
};

// Calculate how well the team matches the strategy
const calculateStrategyMatch = (team, strategy) => {
  let matchScore = 0;
  const maxScore = team.length * 10;

  team.forEach(pick => {
    if (strategy === "balanced") {
      // Balanced strategy values all positions
      matchScore += 8;
    } else if (strategy === "starsAndScrubs") {
      // Stars and scrubs values early picks highly
      if (pick.round <= 4) matchScore += 10;
      else matchScore += 6;
    } else if (strategy === "zeroRB") {
      // Zero RB devalues RBs
      if (pick.player.position !== "RB") matchScore += 9;
      else if (pick.round > 8) matchScore += 7;
      else matchScore += 3;
    }
  });

  const percentage = (matchScore / maxScore) * 100;
  
  if (percentage >= 80) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 60) return "Fair";
  return "Poor";
};

// Get recommendations for optimal draft
const getOptimalDraftRecommendations = (draft, strategy) => {
  const recommendations = [];
  const userTeam = draft.userPicks;

  // Check position needs
  const positionCounts = {};
  userTeam.forEach(pick => {
    positionCounts[pick.player.position] = (positionCounts[pick.player.position] || 0) + 1;
  });

  const constraints = draft.constraints.positions || {};
  Object.keys(constraints).forEach(pos => {
    const min = constraints[pos].min || 1;
    if ((positionCounts[pos] || 0) < min) {
      recommendations.push({
        type: "position",
        priority: "high",
        message: `Add ${pos} in upcoming rounds (need ${min - (positionCounts[pos] || 0)} more)`
      });
    }
  });

  // Strategy-specific recommendations
  if (strategy === "starsAndScrubs" && userTeam.filter(p => p.round <= 4).length < 2) {
    recommendations.push({
      type: "strategy",
      priority: "high",
      message: "Stars & Scrubs strategy requires more elite players early"
    });
  }

  // Value recommendations
  const lateRoundValue = userTeam.filter(p => p.round > 8 && (p.player.fantasyScore || 0) > 65);
  if (lateRoundValue.length < 2 && userTeam.length < 10) {
    recommendations.push({
      type: "value",
      priority: "medium",
      message: "Look for value picks in rounds 9-12"
    });
  }

  return recommendations;
};
'

# Insert the new function before the default export
sed -i "${INSERT_LINE}a\\${NEW_FUNCTION}" controllers/fantasyDraftController.js

echo "✅ Added generateOptimalDraft function to fantasyDraftController.js"
echo ""
echo "🔄 Updating default export to include generateOptimalDraft..."

# Add generateOptimalDraft to the default export
sed -i 's/export default {/export default {\n  getDraftSettings,\n  createDraft,\n  joinDraft,\n  getDraftStatus,\n  makePick,\n  undoPick,\n  getAvailablePlayers,\n  getDraftResults,\n  getDraftHistory,\n  getMockDrafts,\n  simulateDraft,\n  generateOptimalDraft,/' controllers/fantasyDraftController.js

echo "✅ Updated default export to include generateOptimalDraft"
echo ""
echo "🎉 Fix complete! The generateOptimalDraft function is now available for import."
