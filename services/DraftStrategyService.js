/**
 * Draft Strategy Service
 * Calculates optimal snake draft picks and strategies
 */

class DraftStrategyService {
  constructor() {
    this.positionValues = {
      'PPR': {
        QB: 1.0,
        RB: 1.2,
        WR: 1.1,
        TE: 0.9,
        FLEX: 1.0,
        DEF: 0.3,
        K: 0.2
      },
      'Half PPR': {
        QB: 1.0,
        RB: 1.1,
        WR: 1.0,
        TE: 0.8,
        FLEX: 0.9,
        DEF: 0.3,
        K: 0.2
      },
      'Standard': {
        QB: 1.0,
        RB: 1.3,
        WR: 0.9,
        TE: 0.7,
        FLEX: 0.9,
        DEF: 0.3,
        K: 0.2
      }
    };

    this.strategyTemplates = {
      'balanced': {
        name: 'Balanced Build',
        description: 'Equal focus on all positions, avoiding major weaknesses',
        roundFocus: {
          1: ['RB', 'WR'],
          2: ['RB', 'WR'],
          3: ['WR', 'TE'],
          4: ['WR', 'RB', 'QB'],
          5: ['RB', 'WR', 'QB'],
          6: ['RB', 'WR', 'TE'],
          7: ['QB', 'TE'],
          8: ['RB', 'WR'],
          9: ['RB', 'WR'],
          10: ['DEF', 'K', 'RB', 'WR']
        },
        risk: 'Low',
        recommendedFor: ['All draft positions', 'Beginners', 'Conservative players']
      },
      'zero_rb': {
        name: 'Zero RB',
        description: 'Load up on WRs and TE early, target RBs in middle rounds',
        roundFocus: {
          1: ['WR'],
          2: ['WR'],
          3: ['TE', 'WR'],
          4: ['WR', 'QB'],
          5: ['QB', 'WR'],
          6: ['RB'],
          7: ['RB'],
          8: ['RB'],
          9: ['RB'],
          10: ['DEF', 'K', 'RB']
        },
        risk: 'High',
        recommendedFor: ['Late draft positions', 'Deep RB draft years', 'WR-heavy managers']
      },
      'hero_rb': {
        name: 'Hero RB',
        description: 'Draft one elite RB early, then focus on WRs and TE',
        roundFocus: {
          1: ['RB'],
          2: ['WR'],
          3: ['WR'],
          4: ['TE', 'WR'],
          5: ['QB', 'WR'],
          6: ['RB', 'WR'],
          7: ['RB', 'WR'],
          8: ['RB', 'WR'],
          9: ['RB', 'WR'],
          10: ['DEF', 'K', 'RB']
        },
        risk: 'Medium',
        recommendedFor: ['Early draft positions', 'RB-scarcity years', 'Risk-averse players']
      },
      'robust_rb': {
        name: 'Robust RB',
        description: 'Draft multiple RBs early to dominate the position',
        roundFocus: {
          1: ['RB'],
          2: ['RB'],
          3: ['RB', 'WR'],
          4: ['WR', 'TE'],
          5: ['WR', 'QB'],
          6: ['WR', 'TE'],
          7: ['QB', 'WR'],
          8: ['RB', 'WR'],
          9: ['RB', 'WR'],
          10: ['DEF', 'K', 'WR']
        },
        risk: 'Medium',
        recommendedFor: ['Early draft positions', 'RB-heavy managers', 'Standard leagues']
      },
      'late_round_qb': {
        name: 'Late Round QB',
        description: 'Wait on QB until late rounds, load up on skill positions',
        roundFocus: {
          1: ['RB', 'WR'],
          2: ['RB', 'WR'],
          3: ['TE', 'WR'],
          4: ['WR', 'RB'],
          5: ['RB', 'WR'],
          6: ['RB', 'WR'],
          7: ['QB', 'TE'],
          8: ['QB', 'RB'],
          9: ['QB', 'WR'],
          10: ['DEF', 'K', 'QB']
        },
        risk: 'Low',
        recommendedFor: ['All positions', 'Deep QB years', 'Value seekers']
      }
    };
  }

  /**
   * Generate draft plan based on inputs
   */
  generateDraftPlan(options) {
    const {
      draftPosition,
      teamCount = 10,
      rounds = 15,
      strategy = 'balanced',
      scoringFormat = 'PPR',
      playerPool = []
    } = options;

    const plan = [];
    const strategyTemplate = this.strategyTemplates[strategy] || this.strategyTemplates.balanced;
    const takenPlayers = new Set();
    const positionCounts = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      DEF: 0,
      K: 0
    };

    // Generate picks for each round
    for (let round = 1; round <= rounds; round++) {
      const pickNumber = (round - 1) * teamCount + draftPosition;
      const isYourPick = (pickNumber % teamCount) === (draftPosition % teamCount);
      
      // Get recommended position for this round
      const recommendedPosition = this.getRecommendedPosition(round, strategyTemplate, positionCounts, scoringFormat);
      
      // Find best available player for this position
      const suggestedPlayers = this.findSuggestedPlayers(playerPool, recommendedPosition, takenPlayers, round, scoringFormat);
      
      // Calculate value metrics
      const valueScore = this.calculatePickValue(round, draftPosition, teamCount, recommendedPosition, scoringFormat);
      
      // Generate pick note
      const note = this.generatePickNote(round, recommendedPosition, strategyTemplate, valueScore);

      plan.push({
        round,
        pickNumber,
        recommendedPosition,
        note,
        suggestedPlayers: suggestedPlayers.slice(0, 3), // Top 3 suggestions
        valueScore: Math.round(valueScore),
        tier: this.getTierForRound(round),
        isYourPick,
        strategyAdvice: this.getStrategyAdvice(round, strategyTemplate)
      });

      // Update counts for next pick
      if (isYourPick && suggestedPlayers.length > 0) {
        const takenPlayer = suggestedPlayers[0];
        takenPlayers.add(takenPlayer.id || takenPlayer.name);
        positionCounts[takenPlayer.position] = (positionCounts[takenPlayer.position] || 0) + 1;
      }
    }

    return {
      plan,
      summary: this.generatePlanSummary(plan, strategyTemplate, scoringFormat),
      optimalStrategy: this.determineOptimalStrategy(draftPosition, teamCount, scoringFormat),
      riskAssessment: this.assessPlanRisk(plan, strategyTemplate)
    };
  }

  /**
   * Get recommended position for a round
   */
  getRecommendedPosition(round, strategyTemplate, positionCounts, scoringFormat) {
    // Check if we have a specific recommendation for this round
    if (strategyTemplate.roundFocus[round]) {
      const positions = strategyTemplate.roundFocus[round];
      
      // Try to find a position that hasn't exceeded its limit
      for (const position of positions) {
        const maxForPosition = this.getMaxPlayersForPosition(position, scoringFormat);
        if ((positionCounts[position] || 0) < maxForPosition) {
          return position;
        }
      }
    }

    // Default fallback: RB/WR based on round
    if (round <= 5) return Math.random() > 0.5 ? 'RB' : 'WR';
    if (round <= 10) return ['RB', 'WR', 'TE'][Math.floor(Math.random() * 3)];
    return ['RB', 'WR', 'QB', 'TE', 'DEF', 'K'][Math.floor(Math.random() * 6)];
  }

  /**
   * Find suggested players for a position
   */
  findSuggestedPlayers(playerPool, position, takenPlayers, round, scoringFormat) {
    if (!playerPool || playerPool.length === 0) {
      // Return mock players if no player pool provided
      return this.getMockPlayers(position, round);
    }

    return playerPool
      .filter(player => 
        player.position === position && 
        !takenPlayers.has(player.id || player.name) &&
        this.isPlayerRelevantForRound(player, round, scoringFormat)
      )
      .sort((a, b) => {
        // Sort by value (ADP, projection, etc.)
        const aValue = this.calculatePlayerValue(a, round, scoringFormat);
        const bValue = this.calculatePlayerValue(b, round, scoringFormat);
        return bValue - aValue;
      });
  }

  /**
   * Calculate player value
   */
  calculatePlayerValue(player, round, scoringFormat) {
    const baseValue = player.adp ? 100 - player.adp : 50;
    const roundModifier = Math.max(0, 10 - Math.abs(round - (player.adp || 15)));
    const positionModifier = this.positionValues[scoringFormat][player.position] || 1.0;
    
    return baseValue + roundModifier * positionModifier;
  }

  /**
   * Calculate pick value
   */
  calculatePickValue(round, draftPosition, teamCount, position, scoringFormat) {
    const roundValue = 100 - (round * 6);
    const positionValue = this.positionValues[scoringFormat][position] * 20;
    const draftSpotValue = draftPosition <= teamCount / 2 ? 10 : 5;
    
    return roundValue + positionValue + draftSpotValue + (Math.random() * 10);
  }

  /**
   * Generate pick note
   */
  generatePickNote(round, position, strategyTemplate, valueScore) {
    if (round === 1) {
      return `Anchor your team with an elite ${position}`;
    }
    
    if (round <= 3) {
      return `Secure a strong ${position} to build your foundation`;
    }
    
    if (round <= 7) {
      return `Fill out your starting lineup with a solid ${position}`;
    }
    
    if (valueScore > 70) {
      return `Great value pick for a ${position} here`;
    }
    
    return `Target ${position} depth or high-upside player`;
  }

  /**
   * Get strategy advice
   */
  getStrategyAdvice(round, strategyTemplate) {
    if (round === 1) return "Stick to your strategy - don't reach for players";
    if (round === 5) return "Time to consider QB if good value presents itself";
    if (round === 8) return "Look for falling stars and value picks";
    if (round === 12) return "Target high-upside lottery tickets";
    return "Stay disciplined and follow your draft plan";
  }

  /**
   * Get max players for a position
   */
  getMaxPlayersForPosition(position, scoringFormat) {
    const maxMap = {
      QB: scoringFormat === '2QB' ? 3 : 2,
      RB: 5,
      WR: 5,
      TE: 2,
      DEF: 1,
      K: 1
    };
    
    return maxMap[position] || 2;
  }

  /**
   * Check if player is relevant for round
   */
  isPlayerRelevantForRound(player, round, scoringFormat) {
    const expectedADP = player.adp || 100;
    const roundStart = (round - 1) * 12; // Assuming 12 teams
    const roundEnd = round * 12;
    
    return expectedADP >= roundStart && expectedADP <= roundEnd + 24; // Allow some flexibility
  }

  /**
   * Get tier for round
   */
  getTierForRound(round) {
    if (round <= 2) return 'Tier 1';
    if (round <= 4) return 'Tier 2';
    if (round <= 7) return 'Tier 3';
    if (round <= 10) return 'Tier 4';
    return 'Tier 5';
  }

  /**
   * Generate plan summary
   */
  generatePlanSummary(plan, strategyTemplate, scoringFormat) {
    const yourPicks = plan.filter(pick => pick.isYourPick);
    const positionBreakdown = {};
    
    yourPicks.forEach(pick => {
      if (pick.recommendedPosition) {
        positionBreakdown[pick.recommendedPosition] = (positionBreakdown[pick.recommendedPosition] || 0) + 1;
      }
    });
    
    const totalValue = yourPicks.reduce((sum, pick) => sum + (pick.valueScore || 0), 0);
    const avgValue = yourPicks.length > 0 ? Math.round(totalValue / yourPicks.length) : 0;
    
    return {
      totalPicks: yourPicks.length,
      positionBreakdown,
      averageValueScore: avgValue,
      strategy: strategyTemplate.name,
      riskLevel: strategyTemplate.risk,
      recommendation: this.generateOverallRecommendation(yourPicks, strategyTemplate, scoringFormat)
    };
  }

  /**
   * Generate overall recommendation
   */
  generateOverallRecommendation(picks, strategyTemplate, scoringFormat) {
    const positions = picks.map(p => p.recommendedPosition);
    const rbCount = positions.filter(p => p === 'RB').length;
    const wrCount = positions.filter(p => p === 'WR').length;
    
    if (rbCount > wrCount + 2) {
      return "You're heavy on RBs. Consider targeting WRs in later rounds.";
    }
    
    if (wrCount > rbCount + 2) {
      return "You're heavy on WRs. Look for RB value in middle rounds.";
    }
    
    return "Well-balanced draft approach. Stick to your strategy.";
  }

  /**
   * Determine optimal strategy
   */
  determineOptimalStrategy(draftPosition, teamCount, scoringFormat) {
    const strategies = Object.entries(this.strategyTemplates);
    
    // Score each strategy based on draft position
    const scoredStrategies = strategies.map(([key, strategy]) => {
      let score = 50; // Base score
      
      // Adjust based on draft position
      if (draftPosition <= 3) {
        // Early pick benefits RB-heavy strategies
        if (key === 'robust_rb' || key === 'hero_rb') score += 20;
      } else if (draftPosition >= teamCount - 2) {
        // Late pick benefits Zero RB
        if (key === 'zero_rb') score += 20;
      }
      
      // Adjust based on scoring format
      if (scoringFormat === 'Standard' && key === 'robust_rb') score += 15;
      if (scoringFormat === 'PPR' && key === 'balanced') score += 10;
      
      return { key, strategy, score };
    });
    
    // Return top strategy
    const topStrategy = scoredStrategies.sort((a, b) => b.score - a.score)[0];
    
    return {
      strategy: topStrategy.key,
      name: topStrategy.strategy.name,
      score: topStrategy.score,
      confidence: topStrategy.score >= 70 ? 'High' : topStrategy.score >= 50 ? 'Medium' : 'Low'
    };
  }

  /**
   * Assess plan risk
   */
  assessPlanRisk(plan, strategyTemplate) {
    const riskFactors = [];
    
    if (strategyTemplate.risk === 'High') {
      riskFactors.push('High-risk strategy selected');
    }
    
    const rbPicks = plan.filter(p => p.recommendedPosition === 'RB' && p.isYourPick).length;
    if (rbPicks < 2) {
      riskFactors.push('Low RB count could be risky');
    }
    
    const earlyQBPicks = plan.filter(p => 
      p.recommendedPosition === 'QB' && 
      p.isYourPick && 
      p.round <= 5
    ).length;
    
    if (earlyQBPicks > 0) {
      riskFactors.push('Early QB pick may sacrifice value at skill positions');
    }
    
    return {
      riskLevel: riskFactors.length > 2 ? 'High' : riskFactors.length > 0 ? 'Medium' : 'Low',
      riskFactors,
      mitigation: this.generateRiskMitigation(riskFactors)
    };
  }

  /**
   * Generate risk mitigation advice
   */
  generateRiskMitigation(riskFactors) {
    if (riskFactors.length === 0) return "Your draft plan looks solid. Stay the course.";
    
    const advice = [];
    
    if (riskFactors.some(f => f.includes('RB'))) {
      advice.push("Target pass-catching RBs in PPR formats for safer floor");
    }
    
    if (riskFactors.some(f => f.includes('QB'))) {
      advice.push("Consider waiting on QB if you take one early - focus on value elsewhere");
    }
    
    if (riskFactors.some(f => f.includes('High-risk'))) {
      advice.push("Have a backup plan ready in case your strategy doesn't fall perfectly");
    }
    
    return advice.join(' ');
  }

  /**
   * Get mock players for development
   */
  getMockPlayers(position, round) {
    const mockPlayers = {
      QB: [
        { name: 'Josh Allen', team: 'BUF', adp: 12, position: 'QB' },
        { name: 'Patrick Mahomes', team: 'KC', adp: 18, position: 'QB' },
        { name: 'Jalen Hurts', team: 'PHI', adp: 24, position: 'QB' }
      ],
      RB: [
        { name: 'Christian McCaffrey', team: 'SF', adp: 1, position: 'RB' },
        { name: 'Breece Hall', team: 'NYJ', adp: 2, position: 'RB' },
        { name: 'Bijan Robinson', team: 'ATL', adp: 3, position: 'RB' }
      ],
      WR: [
        { name: 'Justin Jefferson', team: 'MIN', adp: 5, position: 'WR' },
        { name: 'Ja\'Marr Chase', team: 'CIN', adp: 6, position: 'WR' },
        { name: 'CeeDee Lamb', team: 'DAL', adp: 7, position: 'WR' }
      ],
      TE: [
        { name: 'Travis Kelce', team: 'KC', adp: 9, position: 'TE' },
        { name: 'Sam LaPorta', team: 'DET', adp: 25, position: 'TE' },
        { name: 'Mark Andrews', team: 'BAL', adp: 35, position: 'TE' }
      ]
    };
    
    return mockPlayers[position] || [];
  }

  /**
   * Analyze draft vs. ADP
   */
  analyzeDraftVsADP(yourPicks, allPicks) {
    const analysis = [];
    let totalValue = 0;
    
    yourPicks.forEach((pick, index) => {
      const player = pick.selectedPlayer;
      if (!player || !player.adp) return;
      
      const expectedRound = Math.ceil(player.adp / 12);
      const value = expectedRound - pick.round;
      
      totalValue += value;
      
      analysis.push({
        pick: index + 1,
        player: player.name,
        round: pick.round,
        expectedRound,
        value,
        grade: value > 1 ? 'A+' : value > 0.5 ? 'A' : value > 0 ? 'B+' : value > -0.5 ? 'B' : 'C'
      });
    });
    
    return {
      picks: analysis,
      averageValue: analysis.length > 0 ? totalValue / analysis.length : 0,
      overallGrade: this.calculateOverallGrade(totalValue / analysis.length),
      summary: this.generateADPSummary(analysis)
    };
  }

  calculateOverallGrade(averageValue) {
    if (averageValue > 1) return 'A+';
    if (averageValue > 0.5) return 'A';
    if (averageValue > 0) return 'B+';
    if (averageValue > -0.5) return 'B';
    if (averageValue > -1) return 'C+';
    return 'C';
  }

  generateADPSummary(analysis) {
    const aboveADP = analysis.filter(a => a.value > 0).length;
    const belowADP = analysis.filter(a => a.value < 0).length;
    const atADP = analysis.filter(a => a.value === 0).length;
    
    return `Drafted ${aboveADP} players above ADP, ${belowADP} below ADP, ${atADP} at ADP`;
  }
}

export default new DraftStrategyService();
