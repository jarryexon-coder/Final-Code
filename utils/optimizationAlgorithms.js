/**
 * Fantasy Sports Optimization Algorithms
 */

export class OptimizationAlgorithms {
  
  // Snake draft optimization
  static optimizeSnakeDraft(params) {
    const { draftPosition, players, teamCount, rounds, platform, strategy = 'VOR' } = params;
    
    // Calculate pick numbers for this draft position
    const pickNumbers = this.calculatePickNumbers(draftPosition, teamCount, rounds);
    
    // Apply strategy
    switch(strategy) {
      case 'VOR':
        return this.vorStrategy(players, pickNumbers, platform);
      case 'StarsAndScrubs':
        return this.starsAndScrubsStrategy(players, pickNumbers, platform);
      case 'Balanced':
        return this.balancedStrategy(players, pickNumbers, platform);
      case 'ZeroRB':
        return this.zeroRBStrategy(players, pickNumbers, platform);
      default:
        return this.vorStrategy(players, pickNumbers, platform);
    }
  }
  
  // Calculate Value Over Replacement (VOR)
  static calculateVOR(players, platform) {
    // Group by position
    const byPosition = {};
    players.forEach(player => {
      if (!byPosition[player.position]) {
        byPosition[player.position] = [];
      }
      byPosition[player.position].push({
        ...player,
        fantasyScore: player.stats?.fantasy?.[platform.toLowerCase()]?.projection || 0
      });
    });
    
    // Calculate baseline (replacement level) for each position
    const baselines = {};
    Object.keys(byPosition).forEach(position => {
      const sorted = [...byPosition[position]].sort((a, b) => b.fantasyScore - a.fantasyScore);
      // Baseline is the 30th player at that position
      const baselineIndex = Math.min(29, sorted.length - 1);
      baselines[position] = sorted[baselineIndex]?.fantasyScore || 0;
    });
    
    // Calculate VOR for each player
    return players.map(player => {
      const baseline = baselines[player.position] || 0;
      const fantasyScore = player.stats?.fantasy?.[platform.toLowerCase()]?.projection || 0;
      return {
        ...player,
        vor: fantasyScore - baseline,
        baseline
      };
    }).sort((a, b) => b.vor - a.vor);
  }
  
  // VOR Strategy
  static vorStrategy(players, pickNumbers, platform) {
    const playersWithVOR = this.calculateVOR(players, platform);
    return pickNumbers.map((pickNumber, index) => {
      const round = Math.ceil(pickNumber / (pickNumbers.length / players.length));
      const availablePlayers = playersWithVOR.filter(p => !p.selected);
      
      // Consider positional needs for later rounds
      const optimalPlayer = this.findOptimalPlayer(availablePlayers, index + 1);
      optimalPlayer.selected = true;
      
      return {
        round,
        pick: pickNumber,
        player: optimalPlayer,
        reason: this.generatePickReason(optimalPlayer, round, platform)
      };
    });
  }
  
  // Find optimal player considering round and needs
  static findOptimalPlayer(players, round) {
    if (round <= 3) {
      // Early rounds: Take best available regardless of position
      return players[0];
    } else if (round <= 6) {
      // Middle rounds: Consider positional scarcity
      return this.considerPositionalScarcity(players);
    } else {
      // Late rounds: Fill needs and find sleepers
      return this.findSleepers(players);
    }
  }
  
  // Lineup optimization for DFS
  static optimizeLineup(params) {
    const { players, salaryCap, platform, constraints } = params;
    
    // Filter valid players
    const validPlayers = players.filter(player => {
      const salary = player.stats?.fantasy?.[platform.toLowerCase()]?.salary || 999999;
      const projection = player.stats?.fantasy?.[platform.toLowerCase()]?.projection || 0;
      
      return salary > 0 && projection > 0 && 
             (!constraints.minSalary || salary >= constraints.minSalary) &&
             (!constraints.maxSalary || salary <= constraints.maxSalary);
    });
    
    // Implement knapsack algorithm with position constraints
    const positionRequirements = {
      'NBA': { PG: 1, SG: 1, SF: 1, PF: 1, C: 1, G: 1, F: 1, UTIL: 1 },
      'NFL': { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1 }
    };
    
    return this.knapsackDFS(validPlayers, salaryCap, positionRequirements[constraints.sport] || {});
  }
  
  // DFS knapsack algorithm for lineup optimization
  static knapsackDFS(players, salaryCap, positionRequirements) {
    const positions = Object.keys(positionRequirements);
    let bestLineup = {
      players: [],
      totalSalary: 0,
      totalProjection: 0,
      positionsFilled: {}
    };
    
    const backtrack = (index, currentLineup, currentSalary, currentProjection, positionsFilled) => {
      // Check if we've filled all positions
      const allFilled = positions.every(pos => 
        (positionsFilled[pos] || 0) >= (positionRequirements[pos] || 0)
      );
      
      if (allFilled) {
        if (currentProjection > bestLineup.totalProjection) {
          bestLineup = {
            players: [...currentLineup],
            totalSalary: currentSalary,
            totalProjection: currentProjection,
            positionsFilled: { ...positionsFilled }
          };
        }
        return;
      }
      
      if (index >= players.length) return;
      
      const player = players[index];
      const playerSalary = player.stats?.fantasy?.fanduel?.salary || 0;
      const playerProjection = player.stats?.fantasy?.fanduel?.projection || 0;
      
      // Try including this player
      const neededPositions = positions.filter(pos => 
        (positionsFilled[pos] || 0) < (positionRequirements[pos] || 0)
      );
      
      if (neededPositions.includes(player.position) && 
          currentSalary + playerSalary <= salaryCap) {
        
        const newPositionsFilled = { ...positionsFilled };
        newPositionsFilled[player.position] = (newPositionsFilled[player.position] || 0) + 1;
        
        backtrack(
          index + 1,
          [...currentLineup, player],
          currentSalary + playerSalary,
          currentProjection + playerProjection,
          newPositionsFilled
        );
      }
      
      // Try excluding this player
      backtrack(index + 1, currentLineup, currentSalary, currentProjection, positionsFilled);
    };
    
    backtrack(0, [], 0, 0, {});
    return bestLineup;
  }
  
  // Stack optimization
  static optimizeStack(players, team, stackType = 'game', size = 3) {
    const teamPlayers = players.filter(p => p.team?.name === team);
    
    if (stackType === 'game') {
      // Game stack: Include players from both teams
      const opponent = this.findOpponent(players, team);
      const opponentPlayers = players.filter(p => p.team?.name === opponent);
      
      return this.findOptimalGameStack([...teamPlayers, ...opponentPlayers], size);
    } else if (stackType === 'team') {
      // Team stack: Only players from same team
      return this.findOptimalTeamStack(teamPlayers, size);
    } else if (stackType === 'correlation') {
      // Correlation stack: Highly correlated players
      return this.findCorrelatedStack(teamPlayers, size);
    }
  }
  
  // Helper methods
  static calculatePickNumbers(position, teamCount, rounds) {
    const picks = [];
    for (let round = 1; round <= rounds; round++) {
      if (round % 2 === 1) {
        // Odd round: snake order
        picks.push((round - 1) * teamCount + position);
      } else {
        // Even round: reverse order
        picks.push(round * teamCount - position + 1);
      }
    }
    return picks;
  }
  
  static generatePickReason(player, round, platform) {
    const reasons = [];
    
    if (round <= 3) {
      reasons.push('Elite talent - secure cornerstone player');
    } else if (round <= 6) {
      reasons.push('Great value at this pick');
    } else {
      reasons.push('High-upside sleeper pick');
    }
    
    const value = player.stats?.fantasy?.[platform.toLowerCase()]?.value || 0;
    if (value > 1.3) reasons.push('Excellent value score');
    else if (value > 1.1) reasons.push('Good value score');
    
    if (player.injury?.status === 'ACTIVE') {
      reasons.push('No injury concerns');
    }
    
    return reasons.join(' • ');
  }
  
  static considerPositionalScarcity(players) {
    // Count available players by position
    const positionCounts = {};
    players.forEach(p => {
      positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
    });
    
    // Find positions with scarcity
    const scarcePositions = Object.keys(positionCounts)
      .filter(pos => positionCounts[pos] < 10) // Less than 10 players available
      .sort((a, b) => positionCounts[a] - positionCounts[b]);
    
    if (scarcePositions.length > 0) {
      const scarcePosition = scarcePositions[0];
      const scarcePlayers = players.filter(p => p.position === scarcePosition);
      return scarcePlayers[0] || players[0];
    }
    
    return players[0];
  }
  
  static findSleepers(players) {
    // Find players with high projection but low salary/ownership
    return players
      .filter(p => {
        const value = p.stats?.fantasy?.fanduel?.value || 0;
        return value > 1.2 && p.ownership < 0.1;
      })
      .sort((a, b) => b.stats?.fantasy?.fanduel?.value - a.stats?.fantasy?.fanduel?.value)[0] || players[0];
  }
}
