/**
 * Contest Optimizer Service
 * Optimizes GPP lineup construction for large-field tournaments
 */

// Add better mock players for testing
const mockPlayers = [
  { 
    name: 'Patrick Mahomes', 
    position: 'QB', 
    salary: 8500, 
    projection: 22.5, 
    team: 'KC', 
    opponent: 'BUF',
    id: 'mahomes-patrick',
    ceiling: 28.0,
    ownership: 0.15,
    gameTotal: 52.5,
    form: 8
  },
  { 
    name: 'Josh Allen', 
    position: 'QB', 
    salary: 8200, 
    projection: 21.8, 
    team: 'BUF', 
    opponent: 'KC',
    id: 'allen-josh',
    ceiling: 27.5,
    ownership: 0.18,
    gameTotal: 52.5,
    form: 9
  },
  { 
    name: 'Christian McCaffrey', 
    position: 'RB', 
    salary: 9500, 
    projection: 25.2, 
    team: 'SF', 
    opponent: 'DAL',
    id: 'mccaffrey-christian',
    ceiling: 32.0,
    ownership: 0.25,
    gameTotal: 47.5,
    form: 9
  },
  { 
    name: 'Justin Jefferson', 
    position: 'WR', 
    salary: 9000, 
    projection: 20.5, 
    team: 'MIN', 
    opponent: 'GB',
    id: 'jefferson-justin',
    ceiling: 28.5,
    ownership: 0.22,
    gameTotal: 45.5,
    form: 8
  },
  { 
    name: 'Travis Kelce', 
    position: 'TE', 
    salary: 7800, 
    projection: 18.3, 
    team: 'KC', 
    opponent: 'BUF',
    id: 'kelce-travis',
    ceiling: 25.0,
    ownership: 0.20,
    gameTotal: 52.5,
    form: 7
  },
  { 
    name: 'Tyreek Hill', 
    position: 'WR', 
    salary: 8800, 
    projection: 19.7, 
    team: 'MIA', 
    opponent: 'NYJ',
    id: 'hill-tyreek',
    ceiling: 30.0,
    ownership: 0.28,
    gameTotal: 43.5,
    form: 9
  },
  { 
    name: 'Saquon Barkley', 
    position: 'RB', 
    salary: 7500, 
    projection: 16.8, 
    team: 'NYG', 
    opponent: 'PHI',
    id: 'barkley-saquon',
    ceiling: 24.5,
    ownership: 0.12,
    gameTotal: 44.0,
    form: 6
  },
  { 
    name: 'Davante Adams', 
    position: 'WR', 
    salary: 8200, 
    projection: 17.9, 
    team: 'LV', 
    opponent: 'LAC',
    id: 'adams-davante',
    ceiling: 26.0,
    ownership: 0.16,
    gameTotal: 48.5,
    form: 7
  },
  // Additional mock players for better testing
  { 
    name: 'Jalen Hurts', 
    position: 'QB', 
    salary: 8300, 
    projection: 21.2, 
    team: 'PHI', 
    opponent: 'NYG',
    id: 'hurts-jalen',
    ceiling: 29.0,
    ownership: 0.14,
    gameTotal: 44.0,
    form: 8
  },
  { 
    name: 'Austin Ekeler', 
    position: 'RB', 
    salary: 8100, 
    projection: 18.5, 
    team: 'LAC', 
    opponent: 'LV',
    id: 'ekeler-austin',
    ceiling: 25.5,
    ownership: 0.19,
    gameTotal: 48.5,
    form: 7
  },
  { 
    name: 'Cooper Kupp', 
    position: 'WR', 
    salary: 8700, 
    projection: 19.2, 
    team: 'LAR', 
    opponent: 'SEA',
    id: 'kupp-cooper',
    ceiling: 27.0,
    ownership: 0.21,
    gameTotal: 46.0,
    form: 6
  },
  { 
    name: 'Mark Andrews', 
    position: 'TE', 
    salary: 6800, 
    projection: 15.8, 
    team: 'BAL', 
    opponent: 'CIN',
    id: 'andrews-mark',
    ceiling: 22.5,
    ownership: 0.11,
    gameTotal: 47.0,
    form: 7
  },
  { 
    name: 'San Francisco 49ers', 
    position: 'DEF', 
    salary: 3800, 
    projection: 8.5, 
    team: 'SF', 
    opponent: 'DAL',
    id: 'def-49ers',
    ceiling: 15.0,
    ownership: 0.08,
    form: 9
  },
  { 
    name: 'Dallas Cowboys', 
    position: 'DEF', 
    salary: 3500, 
    projection: 7.8, 
    team: 'DAL', 
    opponent: 'SF',
    id: 'def-cowboys',
    ceiling: 14.0,
    ownership: 0.07,
    form: 8
  }
];

class ContestOptimizer {
  constructor() {
    this.positionRequirements = {
      'FanDuel NFL': {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 1,
        FLEX: 1,
        DEF: 1
      },
      'DraftKings NFL': {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 1,
        FLEX: 1,
        DST: 1
      },
      'FanDuel NBA': {
        PG: 1,
        SG: 1,
        SF: 1,
        PF: 1,
        C: 1,
        G: 1,
        F: 1,
        UTIL: 1
      }
    };

    this.scoringWeights = {
      'FanDuel NFL': {
        QB: { projection: 0.3, ceiling: 0.4, ownership: 0.3 },
        RB: { projection: 0.4, ceiling: 0.3, ownership: 0.3 },
        WR: { projection: 0.4, ceiling: 0.3, ownership: 0.3 },
        TE: { projection: 0.3, ceiling: 0.4, ownership: 0.3 },
        DEF: { projection: 0.5, ceiling: 0.3, ownership: 0.2 }
      },
      'DraftKings NFL': {
        QB: { projection: 0.3, ceiling: 0.4, ownership: 0.3 },
        RB: { projection: 0.4, ceiling: 0.3, ownership: 0.3 },
        WR: { projection: 0.4, ceiling: 0.3, ownership: 0.3 },
        TE: { projection: 0.3, ceiling: 0.4, ownership: 0.3 },
        DST: { projection: 0.5, ceiling: 0.3, ownership: 0.2 }
      }
    };
  }

  /**
   * Generate optimized lineups
   */
  async generateOptimizedLineups(options = {}) {
    console.log(`🎯 [OPTIMIZER] Generating ${options.lineupCount || 1} optimized lineups`);
    
    // If no player pool provided, use mock data for testing
    if (!options.playerPool || options.playerPool.length === 0) {
      console.log('⚠️ [OPTIMIZER] Using mock player pool for testing');
      options.playerPool = mockPlayers;
    }
    
    const {
      playerPool,
      contestType = 'FanDuel NFL',
      salaryCap = 60000,
      lineupCount = 3,
      strategy = 'balanced',
      stackRules = {},
      customConstraints = {}
    } = options;

    console.log(`🎯 [OPTIMIZER] Generating ${lineupCount} ${strategy} lineups for ${contestType}`);

    const lineups = [];
    const usedPlayers = new Set();
    const positionReqs = this.positionRequirements[contestType];

    if (!positionReqs) {
      throw new Error(`Unsupported contest type: ${contestType}`);
    }

    // Generate lineups
    for (let i = 0; i < lineupCount; i++) {
      try {
        const lineup = await this.generateSingleLineup({
          playerPool: this.filterAvailablePlayers(playerPool, usedPlayers),
          contestType,
          salaryCap,
          strategy,
          stackRules,
          positionReqs,
          customConstraints,
          lineupIndex: i
        });

        if (lineup) {
          lineups.push(lineup);
          // Mark players as used (with some randomness for variety)
          lineup.players.forEach(player => {
            if (Math.random() > 0.3) { // 70% chance to mark as used
              usedPlayers.add(player.id || player.name);
            }
          });
        }
      } catch (error) {
        console.error(`❌ [OPTIMIZER] Error generating lineup ${i + 1}:`, error.message);
      }
    }

    return {
      lineups,
      summary: this.generateOptimizationSummary(lineups, contestType, strategy),
      recommendations: this.generateStrategyRecommendations(lineups, strategy, contestType)
    };
  }

  /**
   * Generate a single optimized lineup
   */
  async generateSingleLineup(options) {
    const {
      playerPool,
      contestType,
      salaryCap,
      strategy,
      stackRules,
      positionReqs,
      customConstraints,
      lineupIndex
    } = options;

    const lineup = {
      players: [],
      totalSalary: 0,
      projectedPoints: 0,
      ownershipProjection: 0,
      stackValue: 0,
      uniqueness: 0,
      constraints: {}
    };

    const availablePlayers = [...playerPool];
    const positionCounts = {};
    const teamCounts = {};
    let remainingSalary = salaryCap;

    // Score players based on strategy
    const scoredPlayers = availablePlayers.map(player => ({
      ...player,
      score: this.calculatePlayerScore(player, strategy, contestType, lineupIndex)
    })).sort((a, b) => b.score - a.score);

    // Fill positions in order of importance
    const positionOrder = this.getPositionOrder(contestType, strategy);

    for (const position of positionOrder) {
      const needed = positionReqs[position] || 0;
      const current = positionCounts[position] || 0;

      if (current >= needed) continue;

      // Find best available player for this position
      const candidate = this.findBestPlayerForPosition(
        scoredPlayers,
        position,
        remainingSalary,
        lineup.players,
        teamCounts,
        stackRules,
        customConstraints
      );

      if (!candidate) {
        console.warn(`⚠️ [OPTIMIZER] No suitable player found for position ${position}`);
        continue;
      }

      // Add player to lineup
      lineup.players.push(candidate);
      lineup.totalSalary += candidate.salary;
      lineup.projectedPoints += candidate.projection || 0;
      lineup.ownershipProjection += candidate.ownership || 0.05;

      remainingSalary -= candidate.salary;
      positionCounts[position] = (positionCounts[position] || 0) + 1;
      teamCounts[candidate.team] = (teamCounts[candidate.team] || 0) + 1;

      // Remove player from available pool
      const playerIndex = scoredPlayers.findIndex(p => 
        (p.id && p.id === candidate.id) || p.name === candidate.name
      );
      if (playerIndex > -1) {
        scoredPlayers.splice(playerIndex, 1);
      }
    }

    // Validate lineup meets all requirements
    const isValid = this.validateLineup(lineup, positionReqs, salaryCap);
    
    if (!isValid.valid) {
      console.warn(`⚠️ [OPTIMIZER] Lineup invalid: ${isValid.reason}`);
      return null;
    }

    // Calculate final metrics
    lineup.ownershipProjection = lineup.ownershipProjection / lineup.players.length;
    lineup.stackValue = this.calculateStackValue(lineup.players, contestType);
    lineup.uniqueness = this.calculateUniqueness(lineup.players, strategy);
    lineup.leverageScore = this.calculateLeverageScore(lineup.players);

    // Add strategy-specific analysis
    lineup.strategyAnalysis = this.analyzeLineupStrategy(lineup, strategy, contestType);

    return lineup;
  }

  /**
   * Calculate player score based on strategy
   */
  calculatePlayerScore(player, strategy, contestType, lineupIndex) {
    const weights = this.getStrategyWeights(strategy, lineupIndex);
    const scoringWeights = this.scoringWeights[contestType] || this.scoringWeights['FanDuel NFL'];

    const position = player.position;
    const positionWeights = scoringWeights[position] || scoringWeights.QB;

    // Base projection (normalized to 0-1)
    const projectionScore = (player.projection || 0) / 30; // Assuming max 30 points
    
    // Ceiling score (potential upside)
    const ceilingScore = (player.ceiling || player.projection || 0) / 40;
    
    // Ownership score (lower is better for GPPs)
    const ownership = player.ownership || 0.05;
    const ownershipScore = 1 - Math.min(ownership, 0.5) * 2; // Convert to 0-1, lower ownership = higher score
    
    // Value score (points per $1000)
    const valueScore = ((player.projection || 0) / (player.salary || 1)) * 1000 / 5; // Normalized
    
    // Recent form
    const formScore = (player.form || 5) / 10;
    
    // Apply weights based on strategy
    let score = 0;
    
    if (strategy === 'balanced') {
      score = (
        projectionScore * 0.3 +
        valueScore * 0.3 +
        ownershipScore * 0.2 +
        ceilingScore * 0.2
      );
    } else if (strategy === 'contrarian') {
      score = (
        ownershipScore * 0.4 +
        ceilingScore * 0.3 +
        projectionScore * 0.2 +
        valueScore * 0.1
      );
    } else if (strategy === 'stars_and_scrubs') {
      // Either high-priced stars or minimum salary scrubs
      const salaryRatio = (player.salary || 0) / 10000; // Assuming max $10k
      if (salaryRatio > 0.8 || salaryRatio < 0.2) {
        score = (
          projectionScore * 0.4 +
          ceilingScore * 0.3 +
          valueScore * 0.2 +
          ownershipScore * 0.1
        );
      } else {
        score = -1; // Penalize mid-range players
      }
    } else if (strategy === 'game_stack') {
      // Higher score for players in high-total games
      const gameStackBonus = player.gameTotal ? (player.gameTotal - 45) / 10 : 0;
      score = (
        projectionScore * 0.3 +
        ceilingScore * 0.3 +
        gameStackBonus * 0.3 +
        ownershipScore * 0.1
      );
    }

    // Add some randomness for lineup variety
    score += (Math.random() * 0.1) - 0.05;

    return Math.max(0, score);
  }

  /**
   * Get position order based on contest type and strategy
   */
  getPositionOrder(contestType, strategy) {
    if (contestType.includes('NFL')) {
      if (strategy === 'game_stack') {
        return ['QB', 'WR', 'WR', 'TE', 'RB', 'RB', 'FLEX', 'DEF'];
      }
      return ['RB', 'WR', 'QB', 'TE', 'WR', 'RB', 'FLEX', 'DEF'];
    }
    
    if (contestType.includes('NBA')) {
      return ['C', 'PG', 'SG', 'SF', 'PF', 'G', 'F', 'UTIL'];
    }
    
    return Object.keys(this.positionRequirements[contestType] || {});
  }

  /**
   * Find best player for a position
   */
  findBestPlayerForPosition(players, position, remainingSalary, currentLineup, teamCounts, stackRules, constraints) {
    const eligiblePlayers = players.filter(player => {
      // Check position match
      if (player.position !== position) return false;
      
      // Check salary constraint
      if (player.salary > remainingSalary) return false;
      
      // Check team stacking constraints
      if (stackRules.maxTeamPlayers) {
        const currentTeamCount = teamCounts[player.team] || 0;
        if (currentTeamCount >= stackRules.maxTeamPlayers) return false;
      }
      
      // Check for QB-WR stack requirement
      if (stackRules.requireQBWRStack && position === 'WR') {
        const hasQB = currentLineup.some(p => p.position === 'QB');
        if (!hasQB) return false;
      }
      
      // Check custom constraints
      if (constraints.minProjection && (player.projection || 0) < constraints.minProjection) {
        return false;
      }
      
      if (constraints.maxOwnership && (player.ownership || 0) > constraints.maxOwnership) {
        return false;
      }
      
      return true;
    });

    if (eligiblePlayers.length === 0) {
      // Try to find any player for this position, relaxing constraints
      const fallbackPlayers = players.filter(p => p.position === position && p.salary <= remainingSalary);
      return fallbackPlayers.sort((a, b) => b.score - a.score)[0];
    }

    return eligiblePlayers.sort((a, b) => b.score - a.score)[0];
  }

  /**
   * Validate lineup meets all requirements
   */
  validateLineup(lineup, positionReqs, salaryCap) {
    const positionCounts = {};
    
    lineup.players.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });

    // Check position requirements
    for (const [position, required] of Object.entries(positionReqs)) {
      if ((positionCounts[position] || 0) < required) {
        return { valid: false, reason: `Missing ${position}` };
      }
    }

    // Check salary cap
    if (lineup.totalSalary > salaryCap) {
      return { valid: false, reason: `Over salary cap: ${lineup.totalSalary} > ${salaryCap}` };
    }

    // Check min salary usage (optional)
    if (lineup.totalSalary < salaryCap * 0.95) {
      return { valid: false, reason: `Under salary cap: ${lineup.totalSalary} < ${salaryCap * 0.95}` };
    }

    return { valid: true };
  }

  /**
   * Calculate stack value (correlation between players)
   */
  calculateStackValue(players, contestType) {
    if (contestType.includes('NFL')) {
      // NFL stack value: QB with pass catchers
      const qbs = players.filter(p => p.position === 'QB');
      const passCatchers = players.filter(p => ['WR', 'TE'].includes(p.position));
      
      let stackScore = 0;
      
      qbs.forEach(qb => {
        passCatchers.forEach(pc => {
          if (qb.team === pc.team) {
            stackScore += 2; // QB-WR/TE stack
          }
        });
      });
      
      // Add bonus for game stack (multiple players from same game)
      const teams = [...new Set(players.map(p => p.team))];
      if (teams.length <= 4) {
        stackScore += 1;
      }
      
      return Math.min(stackScore, 10);
    }
    
    return 0;
  }

  /**
   * Calculate lineup uniqueness
   */
  calculateUniqueness(players, strategy) {
    // Calculate based on ownership projections
    const totalOwnership = players.reduce((sum, player) => {
      return sum + (player.ownership || 0.05);
    }, 0);
    
    const avgOwnership = totalOwnership / players.length;
    
    // Lower average ownership = more unique
    let uniqueness = 100 - (avgOwnership * 100);
    
    // Adjust for strategy
    if (strategy === 'contrarian') {
      uniqueness *= 1.5;
    } else if (strategy === 'stars_and_scrubs') {
      uniqueness *= 0.8;
    }
    
    return Math.min(100, Math.max(0, uniqueness));
  }

  /**
   * Calculate leverage score
   */
  calculateLeverageScore(players) {
    // Leverage = (Projection * (1 - Ownership)) / Salary
    let totalLeverage = 0;
    
    players.forEach(player => {
      const projection = player.projection || 0;
      const ownership = player.ownership || 0.05;
      const salary = player.salary || 1;
      
      const leverage = (projection * (1 - ownership)) / (salary / 1000);
      totalLeverage += leverage;
    });
    
    return totalLeverage / players.length;
  }

  /**
   * Analyze lineup strategy
   */
  analyzeLineupStrategy(lineup, strategy, contestType) {
    const analysis = {
      strategy,
      strengths: [],
      weaknesses: [],
      riskLevel: 'Medium',
      recommendations: []
    };

    // Analyze based on strategy
    if (strategy === 'contrarian') {
      if (lineup.uniqueness > 70) {
        analysis.strengths.push('Highly unique lineup for large-field GPPs');
        analysis.riskLevel = 'High';
      } else {
        analysis.weaknesses.push('Could be more contrarian for GPPs');
        analysis.recommendations.push('Consider players with lower ownership');
      }
    }

    if (strategy === 'game_stack') {
      if (lineup.stackValue > 5) {
        analysis.strengths.push('Strong game stack with good correlation');
      } else {
        analysis.weaknesses.push('Weak game stack correlation');
        analysis.recommendations.push('Add more players from the same game');
      }
    }

    // Analyze salary distribution
    const salaries = lineup.players.map(p => p.salary).sort((a, b) => b - a);
    const top3Salary = salaries.slice(0, 3).reduce((a, b) => a + b, 0);
    const salaryConcentration = top3Salary / lineup.totalSalary;

    if (salaryConcentration > 0.6) {
      analysis.strengths.push('Top-heavy approach with star power');
      analysis.riskLevel = 'High';
    } else if (salaryConcentration < 0.4) {
      analysis.strengths.push('Balanced salary distribution');
      analysis.riskLevel = 'Low';
    }

    // Analyze positional value
    const qbProjection = lineup.players
      .filter(p => p.position === 'QB')
      .reduce((sum, p) => sum + (p.projection || 0), 0);
    
    if (qbProjection > 25) {
      analysis.strengths.push('Strong QB projection');
    }

    return analysis;
  }

  /**
   * Generate optimization summary
   */
  generateOptimizationSummary(lineups, contestType, strategy) {
    if (lineups.length === 0) {
      return { error: 'No valid lineups generated' };
    }

    const avgProjection = lineups.reduce((sum, l) => sum + l.projectedPoints, 0) / lineups.length;
    const avgSalary = lineups.reduce((sum, l) => sum + l.totalSalary, 0) / lineups.length;
    const avgOwnership = lineups.reduce((sum, l) => sum + l.ownershipProjection, 0) / lineups.length;
    const avgUniqueness = lineups.reduce((sum, l) => sum + l.uniqueness, 0) / lineups.length;

    const bestLineup = lineups.sort((a, b) => b.projectedPoints - a.projectedPoints)[0];
    const mostUnique = lineups.sort((a, b) => b.uniqueness - a.uniqueness)[0];

    return {
      totalLineups: lineups.length,
      averageProjection: Math.round(avgProjection),
      averageSalary: Math.round(avgSalary),
      averageOwnership: (avgOwnership * 100).toFixed(1) + '%',
      averageUniqueness: Math.round(avgUniqueness),
      bestProjection: Math.round(bestLineup.projectedPoints),
      mostUnique: Math.round(mostUnique.uniqueness),
      strategyUsed: strategy,
      contestType
    };
  }

  /**
   * Generate strategy recommendations
   */
  generateStrategyRecommendations(lineups, strategy, contestType) {
    const recommendations = [];

    if (strategy === 'balanced' && lineups.length > 0) {
      const avgUniqueness = lineups.reduce((sum, l) => sum + l.uniqueness, 0) / lineups.length;
      
      if (avgUniqueness < 50) {
        recommendations.push({
          type: 'warning',
          message: 'Lineups may be too chalky for large GPPs',
          suggestion: 'Consider Contrarian strategy for tournaments'
        });
      }
    }

    if (contestType.includes('NFL')) {
      const hasStrongStacks = lineups.some(l => l.stackValue > 5);
      
      if (!hasStrongStacks) {
        recommendations.push({
          type: 'info',
          message: 'Consider adding game stacks for higher upside',
          suggestion: 'Try Game Stack strategy'
        });
      }
    }

    // General recommendation based on lineup count
    if (lineups.length < 3) {
      recommendations.push({
        type: 'warning',
        message: 'Limited lineup variety',
        suggestion: 'Increase lineup count or adjust constraints'
      });
    }

    return recommendations;
  }

  /**
   * Get strategy weights
   */
  getStrategyWeights(strategy, lineupIndex) {
    const baseWeights = {
      balanced: { projection: 0.4, ceiling: 0.3, ownership: 0.3 },
      contrarian: { projection: 0.3, ceiling: 0.3, ownership: 0.4 },
      stars_and_scrubs: { projection: 0.4, ceiling: 0.4, ownership: 0.2 },
      game_stack: { projection: 0.3, ceiling: 0.4, ownership: 0.3 }
    };

    const weights = baseWeights[strategy] || baseWeights.balanced;

    // Adjust weights slightly for each lineup to create variety
    if (lineupIndex > 0) {
      const variation = 0.1 * (lineupIndex % 3);
      return {
        projection: weights.projection + (Math.random() * variation) - (variation / 2),
        ceiling: weights.ceiling + (Math.random() * variation) - (variation / 2),
        ownership: weights.ownership + (Math.random() * variation) - (variation / 2)
      };
    }

    return weights;
  }

  /**
   * Filter available players
   */
  filterAvailablePlayers(playerPool, usedPlayers) {
    return playerPool.filter(player => {
      if (usedPlayers.has(player.id || player.name)) {
        return Math.random() > 0.7; // 30% chance to reuse a player
      }
      return true;
    });
  }
}

export default new ContestOptimizer();

