// config/utils/fantasyCalculations.js

// Calculate player value based on various factors
export const calculatePlayerValue = (player, platform = 'FanDuel') => {
  if (!player) return 1.0;
  
  let value = 1.0;
  
  // Base value from fantasy score
  const baseFantasyScore = player.fantasyScore || 50;
  value += (baseFantasyScore - 50) / 100; // Normalize around 1.0
  
  // Adjust for salary efficiency
  const salary = player[`${platform.toLowerCase()}Salary`] || 5000;
  const expectedPoints = player.projectedPoints || baseFantasyScore / 10;
  
  if (salary > 0 && expectedPoints > 0) {
    const pointsPerThousand = (expectedPoints / salary) * 1000;
    value += (pointsPerThousand - 3.0) / 10; // Normalize around 3.0 points per $1000
  }
  
  // Adjust for consistency
  if (player.consistency) {
    value += (player.consistency - 50) / 200; // Normalize around 50%
  }
  
  // Adjust for injury status
  if (player.injuryStatus === 'OUT') {
    value *= 0.1; // Drastically reduce value for injured players
  } else if (player.injuryStatus === 'GTD') {
    value *= 0.7; // Reduce value for game-time decisions
  } else if (player.injuryStatus === 'ACTIVE') {
    value *= 1.1; // Slight boost for confirmed active
  }
  
  // Adjust for matchup
  if (player.opponent) {
    const matchupScore = calculateMatchupScore(player.opponent, player.position);
    value += (matchupScore - 0.5); // Normalize around 0.5
  }
  
  // Adjust for home/away
  if (player.homeAway === 'home') {
    value *= 1.05; // Slight home advantage
  }
  
  // Adjust for recent performance trend
  if (player.trend === 'up') {
    value *= 1.1;
  } else if (player.trend === 'down') {
    value *= 0.9;
  }
  
  // Ensure minimum value
  value = Math.max(0.5, value);
  
  return parseFloat(value.toFixed(2));
};

// Calculate matchup score against opponent
export const calculateMatchupScore = (opponent, position) => {
  // This should be based on actual defensive ratings
  // For now, using a simple lookup table
  const defensiveRankings = {
    // NBA teams defensive efficiency (example values)
    'BOS': { PG: 0.3, SG: 0.3, SF: 0.3, PF: 0.4, C: 0.4 },
    'MIL': { PG: 0.4, SG: 0.4, SF: 0.3, PF: 0.3, C: 0.2 },
    'GSW': { PG: 0.5, SG: 0.5, SF: 0.4, PF: 0.4, C: 0.5 },
    'LAL': { PG: 0.6, SG: 0.6, SF: 0.5, PF: 0.4, C: 0.3 },
    'SAS': { PG: 0.7, SG: 0.7, SF: 0.6, PF: 0.6, C: 0.7 }, // Good matchup
    'DET': { PG: 0.8, SG: 0.8, SF: 0.7, PF: 0.7, C: 0.8 }, // Great matchup
    // Add more teams as needed
  };
  
  const teamRanking = defensiveRankings[opponent];
  if (!teamRanking) return 0.5; // Default neutral matchup
  
  return teamRanking[position] || 0.5;
};

// Get draft strategy tips
export const getDraftStrategyTips = (draftType, draftPosition, totalTeams) => {
  const tips = [];
  
  if (draftType === 'snake') {
    if (draftPosition <= Math.ceil(totalTeams / 3)) {
      // Early pick
      tips.push('Secure an elite player with your first pick');
      tips.push('Focus on scarcity positions in early rounds');
      tips.push('Don\'t reach for positions too early');
    } else if (draftPosition <= Math.ceil(totalTeams * 2 / 3)) {
      // Middle pick
      tips.push('Take best player available');
      tips.push('Look for value picks that fall');
      tips.push('Start building a balanced roster');
    } else {
      // Late pick
      tips.push('Consider picking two elite players back-to-back');
      tips.push('You can afford to reach for positions of need');
      tips.push('Target high-upside players in later rounds');
    }
  } else if (draftType === 'auction') {
    tips.push('Nominate players you don\'t want early to drain budgets');
    tips.push('Set strict price limits for each player');
    tips.push('Save 10-15% of budget for late-round value picks');
    tips.push('Don\'t get into bidding wars for overvalued players');
  }
  
  // General tips
  tips.push('Monitor injury reports throughout the draft');
  tips.push('Have a backup plan for each pick');
  tips.push('Consider stacking teammates in good matchups');
  tips.push('Don\'t draft too many players from the same team');
  
  return tips;
};

// Calculate optimal lineup based on constraints
export const calculateOptimalLineup = (players, constraints) => {
  const {
    salaryCap = 60000,
    platform = 'FanDuel',
    sport = 'NBA',
    rosterRequirements = {}
  } = constraints;
  
  // Default roster requirements for NBA
  const defaultRequirements = {
    PG: 1,
    SG: 1,
    SF: 1,
    PF: 1,
    C: 1,
    G: 1,
    F: 1,
    Util: 1
  };
  
  const requirements = { ...defaultRequirements, ...rosterRequirements };
  
  // Filter eligible players
  const eligiblePlayers = players.filter(player => {
    // Check salary
    const salary = player[`${platform.toLowerCase()}Salary`] || 0;
    if (salary <= 0 || salary > 15000) return false;
    
    // Check injury status
    if (player.injuryStatus === 'OUT') return false;
    
    // Check sport
    if (player.sport !== sport) return false;
    
    return true;
  });
  
  // Sort by value
  eligiblePlayers.sort((a, b) => {
    const valueA = calculatePlayerValue(a, platform);
    const valueB = calculatePlayerValue(b, platform);
    return valueB - valueA;
  });
  
  // Simple greedy algorithm for lineup construction
  const lineup = [];
  let totalSalary = 0;
  const positionCount = {};
  
  // Initialize position counts
  Object.keys(requirements).forEach(pos => {
    positionCount[pos] = 0;
  });
  
  for (const player of eligiblePlayers) {
    // Check if we can add this player
    const salary = player[`${platform.toLowerCase()}Salary`] || 0;
    const positions = player.position?.split('/') || [player.position];
    
    // Check if any position is still needed and salary fits
    let positionFits = false;
    for (const pos of positions) {
      if (positionCount[pos] < (requirements[pos] || 0)) {
        positionFits = true;
        break;
      }
    }
    
    // Check Util position
    if (!positionFits && positionCount.Util < requirements.Util) {
      positionFits = true;
    }
    
    if (positionFits && totalSalary + salary <= salaryCap) {
      // Add player to lineup
      lineup.push({
        player: player.name,
        position: player.position,
        team: player.team,
        salary,
        value: calculatePlayerValue(player, platform),
        projectedPoints: player.projectedPoints || player.fantasyScore / 10
      });
      
      totalSalary += salary;
      
      // Update position counts
      let positionAdded = false;
      for (const pos of positions) {
        if (positionCount[pos] < (requirements[pos] || 0)) {
          positionCount[pos]++;
          positionAdded = true;
          break;
        }
      }
      
      // If no specific position filled, add to Util
      if (!positionAdded && positionCount.Util < requirements.Util) {
        positionCount.Util++;
      }
    }
    
    // Check if lineup is complete
    const lineupComplete = Object.keys(requirements).every(pos => 
      positionCount[pos] >= (requirements[pos] || 0)
    );
    
    if (lineupComplete) break;
  }
  
  // Calculate lineup metrics
  const totalProjectedPoints = lineup.reduce((sum, p) => sum + p.projectedPoints, 0);
  const averageValue = lineup.reduce((sum, p) => sum + p.value, 0) / lineup.length;
  const salaryRemaining = salaryCap - totalSalary;
  
  return {
    lineup,
    metrics: {
      totalSalary,
      salaryRemaining,
      totalProjectedPoints: parseFloat(totalProjectedPoints.toFixed(2)),
      averageValue: parseFloat(averageValue.toFixed(2)),
      salaryEfficiency: totalProjectedPoints / totalSalary * 1000
    },
    constraints: {
      salaryCap,
      platform,
      sport,
      requirements
    }
  };
};

// Calculate player's consistency score
export const calculateConsistencyScore = (playerStats) => {
  if (!playerStats || playerStats.length < 5) return 50;
  
  const fantasyScores = playerStats.map(game => game.fantasyScore || 0);
  const mean = fantasyScores.reduce((sum, score) => sum + score, 0) / fantasyScores.length;
  const variance = fantasyScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / fantasyScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to consistency score (0-100)
  // Lower std dev = more consistent = higher score
  const maxExpectedStdDev = 20; // Adjust based on sport
  const consistency = Math.max(0, 100 - (stdDev / maxExpectedStdDev * 100));
  
  return Math.round(consistency);
};

// Calculate player's volatility score
export const calculateVolatilityScore = (playerStats) => {
  if (!playerStats || playerStats.length < 5) return 50;
  
  const fantasyScores = playerStats.map(game => game.fantasyScore || 0);
  const mean = fantasyScores.reduce((sum, score) => sum + score, 0) / fantasyScores.length;
  const variance = fantasyScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / fantasyScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to volatility score (0-100)
  // Higher std dev = more volatile = higher score
  const maxExpectedStdDev = 20; // Adjust based on sport
  const volatility = Math.min(100, stdDev / maxExpectedStdDev * 100);
  
  return Math.round(volatility);
};

// Calculate player's ceiling and floor
export const calculateCeilingFloor = (playerStats) => {
  if (!playerStats || playerStats.length < 5) return { ceiling: 0, floor: 0 };
  
  const fantasyScores = playerStats.map(game => game.fantasyScore || 0);
  const sortedScores = [...fantasyScores].sort((a, b) => a - b);
  
  // Floor: 20th percentile
  const floorIndex = Math.floor(sortedScores.length * 0.2);
  const floor = sortedScores[floorIndex];
  
  // Ceiling: 80th percentile
  const ceilingIndex = Math.floor(sortedScores.length * 0.8);
  const ceiling = sortedScores[ceilingIndex];
  
  return {
    ceiling: Math.round(ceiling),
    floor: Math.round(floor)
  };
};

// Calculate player's trend direction
export const calculateTrendDirection = (playerStats) => {
  if (!playerStats || playerStats.length < 3) return 'neutral';
  
  const recentGames = playerStats.slice(-5); // Last 5 games
  const fantasyScores = recentGames.map(game => game.fantasyScore || 0);
  
  // Simple linear regression
  const n = fantasyScores.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = fantasyScores;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope > 1) return 'up';
  if (slope < -1) return 'down';
  return 'neutral';
};

export default {
  calculatePlayerValue,
  calculateMatchupScore,
  getDraftStrategyTips,
  calculateOptimalLineup,
  calculateConsistencyScore,
  calculateVolatilityScore,
  calculateCeilingFloor,
  calculateTrendDirection
};
