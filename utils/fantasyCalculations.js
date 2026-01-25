// /Users/jerryexon/sports-app-production/nba-backend/utils/fantasyCalculations.js

/**
 * Fantasy Calculations Utility Module
 * Contains all calculation functions for draft logic and player value assessment
 */

/**
 * Calculate a player's value based on salary and projected points
 * @param {Object} player - Player object
 * @param {string} platform - 'FanDuel' or 'DraftKings'
 * @returns {number} - Value multiplier (points per $1000)
 */
export const calculatePlayerValue = (player, platform = 'FanDuel') => {
  const salary = platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
  const projectedPoints = player.projectedPoints || player.fantasyScore || 0;
  
  if (!salary || salary <= 0 || projectedPoints <= 0) {
    return 1.0; // Default value
  }
  
  // Value = (Projected Points * 1000) / Salary
  const value = (projectedPoints * 1000) / salary;
  
  // Cap value between 0.5 and 2.5 for realism
  return Math.min(Math.max(value, 0.5), 2.5);
};

/**
 * Calculate advanced score for player based on multiple criteria
 * @param {Object} player - Player object
 * @param {number} draftPosition - Current draft position
 * @param {string} platform - 'FanDuel' or 'DraftKings'
 * @returns {number} - Advanced score (0-100)
 */
export const calculateAdvancedScore = (player, draftPosition, platform) => {
  let score = 0;
  
  // 1. Cost (40% weight) - Lower salary is better
  const maxSalary = platform === 'FanDuel' ? 10000 : 9000;
  const salary = player[`${platform.toLowerCase()}Salary`] || player.salary || 5000;
  const costScore = (maxSalary - salary) / maxSalary * 40;
  score += costScore;
  
  // 2. Injuries (20% weight) - Penalize injured players
  const injuryStatus = player.injuryStatus || player.status || 'ACTIVE';
  const injuryPenalty = injuryStatus === 'OUT' ? -20 : 
                       injuryStatus === 'GTD' || injuryStatus === 'QUESTIONABLE' ? -10 : 0;
  score += injuryPenalty;
  
  // 3. Opponent (15% weight) - Consider defensive matchup
  const opponentScore = calculateOpponentScore(player.opponent);
  score += opponentScore * 15;
  
  // 4. Advanced stats (15% weight)
  const advancedScore = calculateAdvancedStatsScore(player.advancedStats || {});
  score += advancedScore * 15;
  
  // 5. Trends (5% weight)
  const trend = player.trend || 'neutral';
  const trendScore = trend === 'up' ? 5 : 
                    trend === 'down' ? 0 : 2.5;
  score += trendScore;
  
  // 6. Statistics (5% weight)
  const statScore = (player.fantasyScore || player.projectedPoints || 0) / 100 * 5;
  score += statScore;
  
  // Adjust for draft position (later picks get slight boost)
  const positionAdjustment = draftPosition > 50 ? 5 : 0;
  score += positionAdjustment;
  
  // Ensure score is between 0 and 100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Calculate opponent defensive score (0-1)
 * @param {string} opponent - Opponent team abbreviation
 * @returns {number} - Score from 0 (tough matchup) to 1 (easy matchup)
 */
export const calculateOpponentScore = (opponent) => {
  if (!opponent) return 0.5;
  
  // Mock data for opponent defensive rankings
  // In production, this should come from a database or external API
  const defensiveRankings = {
    // NBA Teams - Better defensive teams get lower scores
    'SAS': 0.8,  // San Antonio Spurs - Good matchup (weak defense)
    'DET': 0.9,  // Detroit Pistons - Great matchup
    'HOU': 0.8,  // Houston Rockets
    'CHA': 0.8,  // Charlotte Hornets
    'ORL': 0.7,  // Orlando Magic
    'WAS': 0.85, // Washington Wizards
    'POR': 0.75, // Portland Trail Blazers
    
    // Tough defensive teams
    'BOS': 0.3,  // Boston Celtics - Tough matchup
    'MIL': 0.4,  // Milwaukee Bucks
    'CLE': 0.4,  // Cleveland Cavaliers
    'MIA': 0.35, // Miami Heat
    'MEM': 0.4,  // Memphis Grizzlies
    'TOR': 0.45, // Toronto Raptors
    
    // Average defensive teams
    'GSW': 0.6,  // Golden State Warriors
    'LAL': 0.55, // Los Angeles Lakers
    'DEN': 0.5,  // Denver Nuggets
    'PHX': 0.5,  // Phoenix Suns
    'DAL': 0.55, // Dallas Mavericks
    'LAC': 0.45, // LA Clippers
    'NYK': 0.5,  // New York Knicks
    'BKN': 0.6,  // Brooklyn Nets
    'ATL': 0.65, // Atlanta Hawks
    'CHI': 0.55, // Chicago Bulls
    'MIN': 0.5,  // Minnesota Timberwolves
    'OKC': 0.6,  // Oklahoma City Thunder
    'SAC': 0.7,  // Sacramento Kings
    'NOP': 0.65, // New Orleans Pelicans
    'UTA': 0.45, // Utah Jazz
    'IND': 0.6,  // Indiana Pacers
  };
  
  return defensiveRankings[opponent.toUpperCase()] || 0.5;
};

/**
 * Calculate advanced stats score (0-1)
 * @param {Object} advancedStats - Advanced stats object
 * @returns {number} - Score from 0 to 1
 */
export const calculateAdvancedStatsScore = (advancedStats) => {
  if (!advancedStats || Object.keys(advancedStats).length === 0) {
    return 0.5;
  }
  
  let score = 0;
  
  // Usage Rate (25% weight)
  const usageRate = advancedStats.usageRate || 0;
  if (usageRate > 30) score += 0.25;
  else if (usageRate > 25) score += 0.2;
  else if (usageRate > 20) score += 0.15;
  else if (usageRate > 15) score += 0.1;
  else score += 0.05;
  
  // Efficiency (25% weight)
  const efficiency = advancedStats.efficiency || advancedStats.per || 0;
  if (efficiency > 60) score += 0.25;
  else if (efficiency > 55) score += 0.2;
  else if (efficiency > 50) score += 0.15;
  else if (efficiency > 45) score += 0.1;
  else score += 0.05;
  
  // Defensive Impact (20% weight)
  const defensiveRating = advancedStats.defensiveRating || advancedStats.defRating || 0;
  if (defensiveRating > 115) score += 0.2;
  else if (defensiveRating > 110) score += 0.15;
  else if (defensiveRating > 105) score += 0.1;
  else if (defensiveRating > 100) score += 0.05;
  else score += 0.02;
  
  // Rebound Rate (15% weight)
  const reboundRate = advancedStats.reboundRate || advancedStats.rebRate || 0;
  if (reboundRate > 15) score += 0.15;
  else if (reboundRate > 12) score += 0.1;
  else if (reboundRate > 9) score += 0.05;
  else if (reboundRate > 6) score += 0.02;
  
  // Assist Rate (15% weight)
  const assistRate = advancedStats.assistRate || advancedStats.astRate || 0;
  if (assistRate > 30) score += 0.15;
  else if (assistRate > 25) score += 0.1;
  else if (assistRate > 20) score += 0.05;
  else if (assistRate > 15) score += 0.02;
  
  // Cap at 1
  return Math.min(score, 1);
};

/**
 * Calculate draft value based on player and draft context
 * @param {Object} player - Player object
 * @param {string} platform - Platform name
 * @param {number} contestants - Number of contestants in draft
 * @returns {number} - Draft value score
 */
export const calculateDraftValue = (player, platform, contestants) => {
  const baseValue = calculatePlayerValue(player, platform);
  
  // Adjust for draft size
  let scarcityMultiplier = 1.0;
  if (contestants > 12) {
    scarcityMultiplier = 1.3; // Larger drafts increase value of top players
  } else if (contestants > 8) {
    scarcityMultiplier = 1.2;
  } else if (contestants > 4) {
    scarcityMultiplier = 1.1;
  }
  
  // Positional scarcity adjustments
  const position = player.position || '';
  let positionMultiplier = 1.0;
  
  // In NBA, centers are scarce
  if (position.includes('C')) {
    positionMultiplier = contestants > 8 ? 1.25 : 1.15;
  }
  // Point guards are valuable in fantasy
  else if (position.includes('PG')) {
    positionMultiplier = contestants > 10 ? 1.2 : 1.1;
  }
  
  return baseValue * scarcityMultiplier * positionMultiplier;
};

/**
 * Get selection reasons for a player
 * @param {Object} player - Player object
 * @param {string} platform - Platform name
 * @returns {Array} - Array of reason strings
 */
export const getSelectionReasons = (player, platform) => {
  const reasons = [];
  const salary = player[`${platform.toLowerCase()}Salary`] || player.salary;
  
  // Cost-based reasons
  if (salary < (platform === 'FanDuel' ? 5000 : 4500)) {
    reasons.push('Excellent value for salary');
  } else if (salary < (platform === 'FanDuel' ? 7000 : 6500)) {
    reasons.push('Good salary efficiency');
  } else if (salary > (platform === 'FanDuel' ? 9000 : 8500)) {
    reasons.push('Premium player worth the price');
  }
  
  // Injury reasons
  const injuryStatus = player.injuryStatus || player.status;
  if (injuryStatus === 'GTD' || injuryStatus === 'QUESTIONABLE') {
    reasons.push('Monitor injury status');
  } else if (!injuryStatus || injuryStatus === 'ACTIVE' || injuryStatus === 'PROBABLE') {
    reasons.push('Full health, no injury concerns');
  } else if (injuryStatus === 'OUT') {
    reasons.push('Injured - avoid');
  }
  
  // Performance reasons
  const value = calculatePlayerValue(player, platform);
  if (value > 1.4) {
    reasons.push('Outstanding value pick');
  } else if (value > 1.2) {
    reasons.push('Strong value relative to salary');
  }
  
  // Trend reasons
  if (player.trend === 'up') {
    reasons.push('Positive trending performance');
  } else if (player.trend === 'down') {
    reasons.push('Recent performance dip');
  }
  
  // Usage reasons
  if (player.usageRate > 25) {
    reasons.push('High usage rate');
  }
  
  // Opponent reasons
  const opponentScore = calculateOpponentScore(player.opponent);
  if (opponentScore > 0.7) {
    reasons.push('Favorable matchup');
  } else if (opponentScore < 0.4) {
    reasons.push('Tough defensive matchup');
  }
  
  // Stat-based reasons
  if (player.fantasyScore > 45) {
    reasons.push('High fantasy point ceiling');
  }
  
  if (player.rebounds > 10) {
    reasons.push('Strong rebounder');
  }
  
  if (player.assists > 7) {
    reasons.push('Excellent playmaker');
  }
  
  // Add at least one reason if none found
  if (reasons.length === 0) {
    reasons.push('Solid all-around contributor');
  }
  
  return reasons.slice(0, 3); // Return top 3 reasons
};

/**
 * Calculate lineup efficiency score
 * @param {Array} lineup - Array of player objects
 * @param {string} platform - Platform name
 * @param {number} budget - Total budget
 * @returns {Object} - Efficiency metrics
 */
export const calculateLineupEfficiency = (lineup, platform, budget) => {
  if (!lineup || lineup.length === 0) {
    return {
      totalSalary: 0,
      totalProjectedPoints: 0,
      efficiency: 0,
      valuePerDollar: 0,
      averagePlayerValue: 0
    };
  }
  
  let totalSalary = 0;
  let totalProjectedPoints = 0;
  let totalValue = 0;
  
  lineup.forEach(player => {
    const salary = player[`${platform.toLowerCase()}Salary`] || player.salary || 0;
    const points = player.projectedPoints || player.fantasyScore || 0;
    
    totalSalary += salary;
    totalProjectedPoints += points;
    totalValue += calculatePlayerValue(player, platform);
  });
  
  const efficiency = totalSalary > 0 ? (totalProjectedPoints / totalSalary) * 1000 : 0;
  const valuePerDollar = totalSalary > 0 ? totalProjectedPoints / totalSalary : 0;
  const averagePlayerValue = lineup.length > 0 ? totalValue / lineup.length : 0;
  
  return {
    totalSalary,
    totalProjectedPoints,
    efficiency,
    valuePerDollar,
    averagePlayerValue,
    remainingBudget: budget - totalSalary,
    budgetUsedPercentage: (totalSalary / budget) * 100
  };
};

/**
 * Generate draft strategy tips based on contest type
 * @param {number} contestants - Number of contestants
 * @param {number} rounds - Number of rounds
 * @param {string} platform - Platform name
 * @returns {Array} - Array of tip strings
 */
export const getDraftStrategyTips = (contestants, rounds, platform) => {
  const tips = [];
  
  // General tips
  tips.push('Monitor injury reports throughout the draft');
  tips.push('Consider stacking teammates with good matchups');
  
  // Contestant count specific tips
  if (contestants > 8) {
    tips.push('In large drafts, target high-ceiling players early');
    tips.push('Differentiate your roster with lower-owned players');
  } else {
    tips.push('In smaller drafts, focus on safe, high-floor players');
  }
  
  // Platform specific tips
  if (platform === 'FanDuel') {
    tips.push('FanDuel scoring favors scoring and rebounding');
    tips.push('Utilize the utility spot for maximum flexibility');
  } else if (platform === 'DraftKings') {
    tips.push('DraftKings scoring includes 3-pointers and double-doubles');
    tips.push('Punt categories strategically based on contest size');
  }
  
  // Round strategy tips
  if (rounds <= 6) {
    tips.push('In short drafts, prioritize elite talent early');
    tips.push('Don\'t wait too long on scarce positions');
  } else {
    tips.push('In longer drafts, build a balanced roster throughout');
    tips.push('Target value in middle rounds, upside in late rounds');
  }
  
  // Budget management tips
  if (platform === 'FanDuel') {
    tips.push(`Save 5-10% of your $${FANDUEL_STARTING_BUDGET} budget for late-round fliers`);
  } else {
    tips.push(`Save 5-10% of your $${DRAFTKINGS_STARTING_BUDGET} budget for late-round fliers`);
  }
  
  return tips;
};

/**
 * Calculate player consistency score
 * @param {Object} player - Player object
 * @returns {number} - Consistency score (0-100)
 */
export const calculateConsistencyScore = (player) => {
  const recentGames = player.recentGames || [];
  
  if (recentGames.length === 0) {
    return 50; // Default score
  }
  
  // Calculate standard deviation of recent fantasy scores
  const scores = recentGames.map(game => game.fantasyScore || game.points || 0);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = more consistent
  const consistency = 100 - Math.min(stdDev * 5, 100); // Scale appropriately
  
  // Adjust for minutes consistency
  const minutesStdDev = recentGames.map(game => game.minutes || 0);
  const minutesMean = minutesStdDev.reduce((sum, min) => sum + min, 0) / minutesStdDev.length;
  const minutesConsistency = minutesMean > 30 ? 20 : minutesMean > 25 ? 15 : 10;
  
  return Math.min(Math.max(consistency + minutesConsistency, 0), 100);
};

/**
 * Calculate matchup advantage score
 * @param {Object} player - Player object
 * @param {string} opponent - Opponent team
 * @returns {number} - Matchup score (0-100)
 */
export const calculateMatchupAdvantage = (player, opponent) => {
  const opponentScore = calculateOpponentScore(opponent);
  const position = player.position || '';
  
  let positionAdvantage = 0.5;
  
  // Position-specific advantages
  if (position.includes('C') && ['SAS', 'DET', 'HOU'].includes(opponent)) {
    positionAdvantage = 0.8; // Good matchups for centers
  } else if (position.includes('PG') && ['CHA', 'ORL', 'WAS'].includes(opponent)) {
    positionAdvantage = 0.75; // Good matchups for point guards
  } else if (position.includes('SG') && ['POR', 'SAC', 'IND'].includes(opponent)) {
    positionAdvantage = 0.7; // Good matchups for shooting guards
  }
  
  // Combine opponent score with position advantage
  const matchupScore = (opponentScore * 0.6 + positionAdvantage * 0.4) * 100;
  
  return Math.min(Math.max(matchupScore, 0), 100);
};

// Constants for budget calculations
const FANDUEL_STARTING_BUDGET = 60000;
const DRAFTKINGS_STARTING_BUDGET = 50000;

// Export constants
export {
  FANDUEL_STARTING_BUDGET,
  DRAFTKINGS_STARTING_BUDGET
};
