import Player from '../models/Player.js';
import DraftRecommendation from '../models/Draft.js';
import Simulation from '../models/simulation.js';
import RealDataService from '../services/realDataService.js';
import Game from '../models/Game.js';
import RealPlayer from '../models/RealPlayer.js';
import Standing from '../models/Standing.js';

const realDataService = new RealDataService();

const fantasyDraftController = {
  // Generate snake draft recommendations
  generateSnakeDraft: async (req, res) => {
    try {
      const { draftPosition, sport = 'NBA', platform = 'FanDuel', totalTeams = 10, totalRounds = 6 } = req.query;
      
      if (!draftPosition) {
        return res.status(400).json({
          success: false,
          error: 'Draft position is required'
        });
      }

      const position = parseInt(draftPosition);
      const teams = parseInt(totalTeams);
      const rounds = parseInt(totalRounds);

      // Get all players for the sport
      const players = await Player.find({ 
        sport,
        active: true 
      }).sort({ valueScore: -1 }).limit(200);

      // Calculate snake draft picks
      const picks = [];
      for (let round = 1; round <= rounds; round++) {
        let pickNumber;
        
        // Snake draft logic
        if (round % 2 === 1) {
          // Odd round: normal order
          pickNumber = position;
        } else {
          // Even round: reverse order
          pickNumber = teams - position + 1;
        }
        
        // Calculate overall pick number
        const overallPick = (round - 1) * teams + pickNumber;
        
        // Get best available players for this pick
        const availablePlayers = players.filter(p => 
          !picks.some(pick => pick.playerId.toString() === p._id.toString())
        );

        // Position-based strategy
        const positionNeeds = calculatePositionNeeds(picks, round, sport);
        const recommendedPlayer = selectBestPlayer(availablePlayers, positionNeeds, overallPick);

        picks.push({
          round,
          pickNumber,
          overallPick,
          player: recommendedPlayer,
          position: recommendedPlayer.position,
          salary: platform === 'FanDuel' ? recommendedPlayer.fanDuelSalary : recommendedPlayer.draftKingsSalary,
          valueScore: recommendedPlayer.valueScore || 0,
          reasoning: generateDraftReasoning(recommendedPlayer, round, pickNumber, sport)
        });
      }

      // Create draft recommendation
      const draftRecommendation = new DraftRecommendation({
        type: 'snake',
        draftPosition: position,
        totalTeams: teams,
        totalRounds: rounds,
        sport,
        platform,
        picks: picks.map(pick => ({
          playerId: pick.player._id,
          round: pick.round,
          pickNumber: pick.overallPick,
          position: pick.position,
          salary: pick.salary,
          valueScore: pick.valueScore,
          reasoning: pick.reasoning
        })),
        strategy: determineDraftStrategy(picks, sport),
        averagePickScore: calculateAverageScore(picks),
        totalValue: calculateTotalValue(picks),
        riskLevel: calculateRiskLevel(picks)
      });

      await draftRecommendation.save();

      res.json({
        success: true,
        data: {
          draftPosition: position,
          sport,
          platform,
          totalTeams: teams,
          totalRounds: rounds,
          picks,
          strategy: draftRecommendation.strategy,
          summary: generateDraftSummary(picks, sport)
        }
      });
    } catch (error) {
      console.error('Snake draft generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate snake draft recommendations'
      });
    }
  },

  // Generate turn draft recommendations
  generateTurnDraft: async (req, res) => {
    try {
      const { draftPosition, sport = 'NBA', platform = 'FanDuel', criteria = 'all' } = req.query;
      
      if (!draftPosition) {
        return res.status(400).json({
          success: false,
          error: 'Draft position is required'
        });
      }

      const position = parseInt(draftPosition);
      const sportPositions = getSportPositions(sport);

      // Get players grouped by position
      const positionRecommendations = {};
      
      for (const pos of sportPositions) {
        // Get top players for this position
        const players = await Player.find({ 
          sport,
          position: pos,
          active: true
        }).sort({ valueScore: -1 }).limit(10);

        // Apply filters based on criteria
        let filteredPlayers = players;
        
        if (criteria === 'value') {
          filteredPlayers = players.filter(p => 
            p.valueScore > 8 && 
            (platform === 'FanDuel' ? p.fanDuelSalary < 8000 : p.draftKingsSalary < 7500)
          );
        } else if (criteria === 'safe') {
          filteredPlayers = players.filter(p => 
            p.injuryRisk < 0.2 && 
            p.consistency > 0.7
          );
        } else if (criteria === 'upside') {
          filteredPlayers = players.filter(p => 
            p.upsideScore > 8.5 && 
            p.ownership < 15
          );
        }

        // Add selection scores and reasons
        positionRecommendations[pos] = filteredPlayers.map((player, index) => ({
          rank: index + 1,
          player: {
            _id: player._id,
            name: player.name,
            team: player.team,
            position: player.position,
            injuryStatus: player.injuryStatus || 'Active',
            opponent: player.nextOpponent || 'TBD',
            salary: platform === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary,
            projection: player.projection || 0,
            valueScore: player.valueScore || 0,
            ownership: player.ownership || 0
          },
          selectionScore: calculateSelectionScore(player, position, platform),
          reasons: generateSelectionReasons(player, pos, criteria)
        }));
      }

      // Save to database
      const draftRecommendation = new DraftRecommendation({
        type: 'turn',
        draftPosition: position,
        sport,
        platform,
        picks: Object.entries(positionRecommendations).flatMap(([pos, recommendations]) =>
          recommendations.map(rec => ({
            playerId: rec.player._id,
            position: pos,
            salary: rec.player.salary,
            valueScore: rec.player.valueScore,
            selectionScore: rec.selectionScore,
            reasoning: rec.reasons.join(', ')
          }))
        ),
        criteria: criteria.split(','),
        createdAt: new Date()
      });

      await draftRecommendation.save();

      res.json({
        success: true,
        data: {
          draftPosition: position,
          sport,
          platform,
          criteria,
          positionRecommendations,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Turn draft generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate turn draft recommendations'
      });
    }
  },

  // Get saved draft recommendations
  getSavedDrafts: async (req, res) => {
    try {
      const { userId, type, sport } = req.query;
      
      const query = {};
      if (userId) query.userId = userId;
      if (type) query.type = type;
      if (sport) query.sport = sport;
      
      const drafts = await DraftRecommendation.find(query)
        .sort({ savedAt: -1 })
        .limit(20)
        .populate('picks.playerId', 'name position team');
      
      res.json({
        success: true,
        data: drafts,
        count: drafts.length
      });
    } catch (error) {
      console.error('Get saved drafts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch saved drafts'
      });
    }
  },

  // Simulate draft results
  simulateDraft: async (req, res) => {
    try {
      const { 
        draftType = 'snake',
        draftPosition,
        sport = 'NBA',
        platform = 'FanDuel',
        totalTeams = 10,
        simulations = 1000
      } = req.body;

      // Run Monte Carlo simulation
      const simulation = new Simulation({
        type: 'draft',
        sport,
        platform,
        parameters: {
          draftType,
          draftPosition,
          totalTeams,
          simulations
        }
      });

      const results = await simulation.runDraftSimulation();
      
      res.json({
        success: true,
        data: {
          simulationId: simulation._id,
          draftType,
          draftPosition,
          sport,
          platform,
          totalTeams,
          simulations,
          results: {
            optimalPicks: results.optimalPicks,
            positionBreakdown: results.positionBreakdown,
            valueDistribution: results.valueDistribution,
            winProbability: results.winProbability
          },
          summary: generateSimulationSummary(results)
        }
      });
    } catch (error) {
      console.error('Draft simulation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to simulate draft'
      });
    }
  },

  // Get NBA games from File 1
  getGames: async (req, res) => {
    try {
      const { date } = req.query;
      const gamesData = await realDataService.getNBAGames(date ? new Date(date) : new Date());
      
      res.json(gamesData);
    } catch (error) {
      console.error('NBA games error:', error);
      
      // Fallback to database
      try {
        const searchDate = req.query.date ? new Date(req.query.date) : new Date();
        const games = await Game.find({ 
          sport: 'NBA',
          date: { 
            $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
            $lte: new Date(searchDate.setHours(23, 59, 59, 999))
          }
        }).sort({ date: 1 });
        
        res.json({
          success: true,
          games,
          count: games.length,
          source: 'database_fallback',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch NBA games',
          message: error.message
        });
      }
    }
  },

  // Get NBA standings from File 1
  getStandings: async (req, res) => {
    try {
      const standingsData = await realDataService.getNBAStandings();
      res.json(standingsData);
    } catch (error) {
      console.error('NBA standings error:', error);
      
      // Fallback to database
      try {
        const standings = await Standing.find({ sport: 'NBA' })
          .sort({ 'games.winPercentage': -1 });
        
        res.json({
          success: true,
          standings,
          count: standings.length,
          source: 'database_fallback',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch NBA standings',
          message: error.message
        });
      }
    }
  }
};

// Helper functions from File 2
function calculatePositionNeeds(picks, round, sport) {
  const positionCounts = {};
  picks.forEach(pick => {
    positionCounts[pick.position] = (positionCounts[pick.position] || 0) + 1;
  });

  const sportRequirements = {
    NBA: { PG: 1, SG: 1, SF: 1, PF: 1, C: 1 },
    NFL: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DEF: 1 }
  };

  const needs = [];
  const requirements = sportRequirements[sport] || {};

  for (const [position, required] of Object.entries(requirements)) {
    const current = positionCounts[position] || 0;
    if (current < required && round <= 8) {
      needs.push({ position, priority: required - current });
    }
  }

  return needs.sort((a, b) => b.priority - a.priority);
}

function selectBestPlayer(players, positionNeeds, pickNumber) {
  if (positionNeeds.length > 0 && pickNumber <= 8) {
    // Early picks: prioritize position needs
    const needPositions = positionNeeds.map(n => n.position);
    const positionPlayers = players.filter(p => needPositions.includes(p.position));
    if (positionPlayers.length > 0) {
      return positionPlayers[0];
    }
  }

  // Best player available
  return players[0];
}

function generateDraftReasoning(player, round, pickNumber, sport) {
  const reasons = [];
  
  if (round <= 3) {
    reasons.push(`Elite ${player.position} with proven production`);
    reasons.push(`High floor and ceiling`);
  } else if (round <= 6) {
    reasons.push(`Great value in round ${round}`);
    reasons.push(`Consistent performer with upside`);
  } else {
    reasons.push(`Late-round steal potential`);
    reasons.push(`Could outperform ADP`);
  }

  if (player.valueScore > 8) {
    reasons.push(`Excellent value score: ${player.valueScore}/10`);
  }

  return reasons.join('. ');
}

function calculateSelectionScore(player, draftPosition, platform) {
  let score = 0;
  
  // Value score (30%)
  score += (player.valueScore || 5) * 3;
  
  // Injury risk (20%)
  score += (1 - (player.injuryRisk || 0.5)) * 2;
  
  // Consistency (20%)
  score += (player.consistency || 0.5) * 2;
  
  // Upside (15%)
  score += (player.upsideScore || 0.5) * 1.5;
  
  // Position scarcity (15%)
  const positionScarcity = {
    'QB': 0.9, 'RB': 0.8, 'WR': 0.7, 'TE': 0.6,
    'PG': 0.8, 'SG': 0.7, 'SF': 0.8, 'PF': 0.7, 'C': 0.9
  };
  score += (positionScarcity[player.position] || 0.5) * 1.5;
  
  // Adjust for draft position
  const positionFactor = 1 - (draftPosition * 0.02);
  score *= positionFactor;
  
  return Math.min(score, 10).toFixed(1);
}

// Additional helper functions needed from File 2 (stubs)
function getSportPositions(sport) {
  return sport === 'NBA' ? ['PG', 'SG', 'SF', 'PF', 'C'] : 
         sport === 'NFL' ? ['QB', 'RB', 'WR', 'TE', 'DEF'] : [];
}

function generateSelectionReasons(player, position, criteria) {
  const reasons = [];
  reasons.push(`Strong ${position} option`);
  reasons.push(`Good matchup against ${player.opponent}`);
  return reasons;
}

function determineDraftStrategy(picks, sport) {
  const positions = picks.map(p => p.position);
  const positionCounts = positions.reduce((acc, pos) => {
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(positionCounts).map(([pos, count]) => `${count}x ${pos}`).join(', ');
}

function calculateAverageScore(picks) {
  const total = picks.reduce((sum, pick) => sum + (pick.valueScore || 0), 0);
  return picks.length > 0 ? (total / picks.length).toFixed(2) : '0.00';
}

function calculateTotalValue(picks) {
  return picks.reduce((sum, pick) => sum + (pick.valueScore || 0), 0).toFixed(2);
}

function calculateRiskLevel(picks) {
  const riskScores = picks.map(p => p.player?.injuryRisk || 0.5);
  const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  
  if (avgRisk < 0.3) return 'Low';
  if (avgRisk < 0.5) return 'Medium';
  return 'High';
}

function generateDraftSummary(picks, sport) {
  const totalValue = calculateTotalValue(picks);
  const avgScore = calculateAverageScore(picks);
  const strategy = determineDraftStrategy(picks, sport);
  
  return `Draft with ${picks.length} picks averaging ${avgScore} value score. Total value: ${totalValue}. Strategy: ${strategy}`;
}

function generateSimulationSummary(results) {
  return `Simulation completed with optimal picks identified. Win probability: ${results.winProbability}%`;
}

export default fantasyDraftController;
