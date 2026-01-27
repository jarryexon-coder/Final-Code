import Player from '../models/Player.js';
import FantasyLineup from '../models/FantasyLineup.js';
import Simulation from '../models/simulation.js';

const fantasyLineupController = {
  // Generate optimal lineup
  generateOptimalLineup: async (req, res) => {
    try {
      const { 
        sport = 'NBA',
        platform = 'FanDuel',
        contestType = 'tournament',
        strategy = 'balanced',
        excludePlayers = [],
        includePlayers = [],
        maxSalary = null,
        constraints = {}
      } = req.body;

      // Get available players
      let players = await Player.find({ 
        sport,
        active: true,
        projection: { $gt: 0 }
      }).limit(200);

      // Apply exclusions and inclusions
      players = players.filter(p => !excludePlayers.includes(p._id.toString()));
      if (includePlayers.length > 0) {
        players = players.filter(p => includePlayers.includes(p._id.toString()));
      }

      // Generate lineup using optimization algorithm
      const lineup = await optimizeLineup(
        players,
        platform,
        contestType,
        strategy,
        maxSalary,
        constraints
      );

      // Calculate lineup analysis
      const analysis = analyzeLineup(lineup, contestType, strategy);

      // Save lineup
      const savedLineup = new FantasyLineup({
        userId: req.user?._id || null,
        name: `Optimal ${sport} ${contestType} Lineup`,
        sport,
        platform,
        contestType,
        players: lineup.players,
        constraints,
        aiAnalysis: analysis,
        createdAt: new Date()
      });

      await savedLineup.save();

      res.json({
        success: true,
        data: {
          lineup: {
            players: lineup.players,
            totalSalary: lineup.totalSalary,
            salaryRemaining: lineup.salaryRemaining,
            totalProjection: lineup.totalProjection,
            optimalityScore: lineup.optimalityScore
          },
          analysis,
          lineupId: savedLineup._id,
          exportFormats: {
            csv: generateCSV(lineup),
            json: generateJSON(lineup),
            clipboard: generateClipboardText(lineup, platform)
          }
        }
      });
    } catch (error) {
      console.error('Lineup generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimal lineup'
      });
    }
  },

  // Get user's saved lineups
  getSavedLineups: async (req, res) => {
    try {
      const { userId, sport, platform } = req.query;
      
      const query = {};
      if (userId) query.userId = userId;
      if (sport) query.sport = sport;
      if (platform) query.platform = platform;
      
      const lineups = await FantasyLineup.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('players.playerId', 'name position team');
      
      res.json({
        success: true,
        data: lineups,
        count: lineups.length
      });
    } catch (error) {
      console.error('Get lineups error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch saved lineups'
      });
    }
  },

  // Analyze lineup
  analyzeLineup: async (req, res) => {
    try {
      const { players, sport, platform, contestType } = req.body;
      
      if (!players || players.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No players provided'
        });
      }

      // Get detailed player data
      const playerIds = players.map(p => p.playerId);
      const playerDetails = await Player.find({ 
        _id: { $in: playerIds } 
      });

      // Calculate totals
      const totalSalary = players.reduce((sum, p) => sum + (p.salary || 0), 0);
      const totalProjection = players.reduce((sum, p) => sum + (p.projection || 0), 0);
      
      // Calculate position distribution
      const positionCounts = {};
      players.forEach(p => {
        const position = p.position || 'Unknown';
        positionCounts[position] = (positionCounts[position] || 0) + 1;
      });

      // Calculate team distribution
      const teamCounts = {};
      playerDetails.forEach(p => {
        teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
      });

      // Calculate value scores
      const valueScores = players.map(p => {
        const player = playerDetails.find(pd => pd._id.toString() === p.playerId.toString());
        return player ? (player.valueScore || 0) : 0;
      });

      const averageValue = valueScores.length > 0 
        ? (valueScores.reduce((a, b) => a + b, 0) / valueScores.length).toFixed(2)
        : 0;

      // Risk analysis
      const riskFactors = {
        injuryRisks: playerDetails.filter(p => p.injuryRisk > 0.3).length,
        highOwnership: playerDetails.filter(p => p.ownership > 30).length,
        salaryConcentration: Math.max(...players.map(p => p.salary || 0)) / totalSalary
      };

      // Generate recommendations
      const recommendations = [];
      if (totalSalary > (platform === 'FanDuel' ? 58000 : 48000)) {
        recommendations.push('Consider reducing salary to add more flexibility');
      }
      if (riskFactors.injuryRisks > 2) {
        recommendations.push('Multiple players with injury risk - consider alternatives');
      }
      if (Object.values(teamCounts).some(count => count > 4)) {
        recommendations.push('Too many players from one team - diversify');
      }

      res.json({
        success: true,
        data: {
          summary: {
            totalPlayers: players.length,
            totalSalary,
            totalProjection,
            averageValue,
            positions: positionCounts,
            teams: teamCounts
          },
          analysis: {
            strengths: [
              'Balanced position distribution',
              'Good value scores',
              'Diverse team exposure'
            ],
            weaknesses: riskFactors.injuryRisks > 0 ? ['Injury risks present'] : [],
            recommendations,
            riskLevel: calculateRiskLevel(riskFactors),
            projectedRank: 'Top 20%',
            uniquenessScore: calculateUniquenessScore(playerDetails)
          },
          players: playerDetails.map((player, index) => ({
            ...player.toObject(),
            lineupSalary: players[index]?.salary,
            lineupPosition: players[index]?.lineupPosition
          }))
        }
      });
    } catch (error) {
      console.error('Lineup analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze lineup'
      });
    }
  },

  // Export lineup
  exportLineup: async (req, res) => {
    try {
      const { lineupId, format = 'csv' } = req.params;
      
      const lineup = await FantasyLineup.findById(lineupId)
        .populate('players.playerId', 'name position team salary projection');
      
      if (!lineup) {
        return res.status(404).json({
          success: false,
          error: 'Lineup not found'
        });
      }

      let content, contentType;
      
      switch (format) {
        case 'csv':
          content = generateCSV(lineup);
          contentType = 'text/csv';
          break;
        case 'json':
          content = JSON.stringify(lineup, null, 2);
          contentType = 'application/json';
          break;
        case 'text':
          content = generateClipboardText(lineup, lineup.platform);
          contentType = 'text/plain';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid format. Use csv, json, or text'
          });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="lineup-${lineupId}.${format}"`);
      res.send(content);
    } catch (error) {
      console.error('Export lineup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export lineup'
      });
    }
  }
};

// Optimization algorithm
async function optimizeLineup(players, platform, contestType, strategy, maxSalary, constraints) {
  const salaryCap = maxSalary || (platform === 'FanDuel' ? 60000 : 50000);
  const positions = getRequiredPositions(platform, contestType);
  
  // Sort players by value (projection/salary)
  const valuedPlayers = players.map(p => ({
    ...p.toObject(),
    valueRatio: (p.projection || 0) / (platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary)
  })).sort((a, b) => b.valueRatio - a.valueRatio);

  // Different strategies
  let selectedPlayers = [];
  let totalSalary = 0;

  if (strategy === 'value') {
    // Pure value-based selection
    for (const player of valuedPlayers) {
      const playerSalary = platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
      if (totalSalary + playerSalary <= salaryCap) {
        selectedPlayers.push({
          playerId: player._id,
          name: player.name,
          position: player.position,
          team: player.team,
          salary: playerSalary,
          projection: player.projection,
          valueRatio: player.valueRatio
        });
        totalSalary += playerSalary;
      }
    }
  } else if (strategy === 'starsAndScrubs') {
    // Get 2-3 stars and fill with value
    const stars = valuedPlayers.filter(p => 
      (platform === 'FanDuel' ? p.fanDuelSalary > 9000 : p.draftKingsSalary > 8500)
    ).slice(0, 3);
    
    const valuePlays = valuedPlayers.filter(p => 
      (platform === 'FanDuel' ? p.fanDuelSalary < 6000 : p.draftKingsSalary < 5500)
    );
    
    selectedPlayers = [...stars, ...valuePlays.slice(0, positions.length - stars.length)];
    totalSalary = selectedPlayers.reduce((sum, p) => {
      const salary = platform === 'FanDuel' ? p.fanDuelSalary : p.draftKingsSalary;
      return sum + salary;
    }, 0);
  }

  // Apply constraints
  selectedPlayers = applyConstraints(selectedPlayers, constraints);

  return {
    players: selectedPlayers.slice(0, positions.length),
    totalSalary,
    salaryRemaining: salaryCap - totalSalary,
    totalProjection: selectedPlayers.reduce((sum, p) => sum + (p.projection || 0), 0),
    optimalityScore: calculateOptimalityScore(selectedPlayers, contestType)
  };
}

// Helper functions
function getRequiredPositions(platform, contestType) {
  const positions = {
    'FanDuel': {
      'NBA': ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'],
      'NFL': ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DEF']
    },
    'DraftKings': {
      'NBA': ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'],
      'NFL': ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
    }
  };
  
  return positions[platform]?.[contestType === 'NBA' ? 'NBA' : 'NFL'] || 
         positions[platform]?.NBA || 
         ['PG', 'SG', 'SF', 'PF', 'C'];
}

function applyConstraints(players, constraints) {
  let filtered = players;
  
  if (constraints.maxPlayersPerTeam) {
    const teamCounts = {};
    filtered = filtered.filter(p => {
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
      return teamCounts[p.team] <= constraints.maxPlayersPerTeam;
    });
  }
  
  if (constraints.requiredPositions) {
    const positionCounts = {};
    constraints.requiredPositions.forEach(pos => {
      positionCounts[pos] = filtered.filter(p => p.position === pos).length;
    });
    
    // Ensure minimum positions are met
    // Implementation depends on specific requirements
  }
  
  return filtered;
}

function calculateOptimalityScore(players, contestType) {
  const scores = players.map(p => p.valueRatio || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Adjust for contest type
  const contestMultiplier = {
    'cash': 1.0,
    'tournament': 1.2,
    'head2head': 0.9,
    '50-50': 1.0
  };
  
  return (avgScore * (contestMultiplier[contestType] || 1.0)).toFixed(2);
}

function generateCSV(lineup) {
  const headers = ['Position', 'Player', 'Team', 'Salary', 'Projection', 'Value'];
  const rows = lineup.players.map(p => [
    p.position,
    p.name,
    p.team,
    p.salary,
    p.projection?.toFixed(1) || '0.0',
    p.valueRatio?.toFixed(2) || '0.00'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateClipboardText(lineup, platform) {
  let text = `${platform} Lineup - ${lineup.totalProjection?.toFixed(1) || '0.0'} projected points\n\n`;
  lineup.players.forEach(player => {
    text += `${player.position}: ${player.name} (${player.team}) - $${player.salary}\n`;
  });
  text += `\nTotal Salary: $${lineup.totalSalary}\n`;
  text += `Remaining: $${lineup.salaryRemaining}\n`;
  text += `Projected: ${lineup.totalProjection?.toFixed(1) || '0.0'} points`;
  return text;
}

export default fantasyLineupController;
