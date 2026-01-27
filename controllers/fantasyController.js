import RealDataService from '../services/realDataService.js';
import Game from '../models/Game.js';
import RealPlayer from '../models/RealPlayer.js';
import Standing from '../models/Standing.js';

const realDataService = new RealDataService();

const fantasyController = {
  // ===== GET FANTASY ADVICE (from File 2) =====
  getFantasyAdvice: async (req, res) => {
    try {
      const sport = req.query.sport || 'NBA';
      
      // 1. Get real-time data from multiple sources
      const [injuries, matchups, playerStats, weather] = await Promise.all([
        fetchInjuryReports(sport),
        fetchTodayMatchups(sport),
        fetchPlayerStats(sport),
        fetchWeatherForGames(sport)
      ]);

      // 2. Apply fantasy algorithms
      const recommendations = {
        must_starts: calculateMustStarts({
          injuries,
          matchups,
          playerStats,
          weather,
          sport
        }),
        sleepers: calculateSleepers({
          injuries,
          matchups,
          playerStats,
          ownership: await fetchOwnershipData(sport),
          salary: await fetchSalaryData(sport)
        }),
        avoids: calculateAvoids({
          injuries,
          matchups,
          playerStats,
          recentPerformance: await fetchRecentPerformance(sport)
        }),
        lastUpdated: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Update every 15 min
      };

      // 3. Cache for 5 minutes
      await cacheFantasyData(sport, recommendations);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Fantasy advice error:', error);
      
      // Fallback: Generate basic fantasy advice using real data service
      try {
        const fallbackAdvice = await generateFallbackFantasyAdvice(req.query.sport || 'NBA');
        res.json({
          success: true,
          data: fallbackAdvice,
          source: 'fallback'
        });
      } catch (fallbackError) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to load fantasy advice' 
        });
      }
    }
  },

  // ===== GET NBA GAMES (from File 1) =====
  getGames: async (req, res) => {
    try {
      const { date } = req.query;
      const gamesData = await realDataService.getNBAGames(date ? new Date(date) : new Date());
      
      // Enhance games data with fantasy context
      const enhancedGamesData = await enhanceGamesWithFantasyContext(gamesData);
      
      res.json(enhancedGamesData);
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
        
        // Add fantasy insights to database games
        const gamesWithFantasy = await addFantasyInsightsToGames(games);
        
        res.json({
          success: true,
          data: gamesWithFantasy,
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

  // ===== GET NBA STANDINGS (from File 1) =====
  getStandings: async (req, res) => {
    try {
      const standingsData = await realDataService.getNBAStandings();
      
      // Add fantasy relevance to standings
      const standingsWithFantasy = addFantasyRelevanceToStandings(standingsData);
      
      res.json(standingsWithFantasy);
    } catch (error) {
      console.error('NBA standings error:', error);
      
      // Fallback to database
      try {
        const standings = await Standing.find({ sport: 'NBA' })
          .sort({ 'games.winPercentage': -1 });
        
        // Add fantasy insights
        const standingsWithFantasy = addFantasyInsightsToStandings(standings);
        
        res.json({
          success: true,
          data: standingsWithFantasy,
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
  },

  // ===== GET PLAYER FANTASY PROJECTIONS =====
  getPlayerProjections: async (req, res) => {
    try {
      const { playerId, date } = req.query;
      
      // Get player data from real data service
      const playerData = await realDataService.getPlayerData(playerId);
      
      // Get today's matchups
      const gamesData = await realDataService.getNBAGames(date ? new Date(date) : new Date());
      
      // Calculate fantasy projection
      const projection = calculateFantasyProjection(playerData, gamesData);
      
      res.json({
        success: true,
        data: {
          player: playerData,
          projection: projection,
          confidence: calculateConfidenceScore(playerData, gamesData),
          recommendation: generatePlayerRecommendation(playerData, projection),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Player projection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate player projection'
      });
    }
  },

  // ===== GET DAILY FANTASY LINEUP OPTIMIZER =====
  getLineupOptimizer: async (req, res) => {
    try {
      const { date, salaryCap = 50000, platform = 'FanDuel' } = req.query;
      
      // Get games and players data
      const [gamesData, playersData] = await Promise.all([
        realDataService.getNBAGames(date ? new Date(date) : new Date()),
        realDataService.getNBAPlayers()
      ]);
      
      // Optimize lineup
      const optimizedLineup = optimizeFantasyLineup({
        games: gamesData,
        players: playersData,
        salaryCap: parseInt(salaryCap),
        platform: platform
      });
      
      res.json({
        success: true,
        data: optimizedLineup,
        constraints: {
          salaryCap: salaryCap,
          platform: platform,
          date: date || new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Lineup optimizer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize lineup'
      });
    }
  },

  // ===== GET FANTASY TRENDS =====
  getFantasyTrends: async (req, res) => {
    try {
      const { period = '7d' } = req.query;
      
      // Get trending players and matchups
      const [trendingPlayers, hotMatchups, injuryUpdates] = await Promise.all([
        getTrendingPlayers(period),
        getHotMatchups(period),
        getRecentInjuryUpdates()
      ]);
      
      res.json({
        success: true,
        data: {
          trendingPlayers: trendingPlayers,
          hotMatchups: hotMatchups,
          injuryUpdates: injuryUpdates,
          period: period,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Fantasy trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fantasy trends'
      });
    }
  }
};

// ===== ALGORITHM FUNCTIONS (from File 2) =====
function calculateMustStarts(data) {
  return data.playerStats
    .filter(player => {
      // Criteria for must-start:
      // 1. Healthy (no injuries)
      // 2. Favorable matchup
      // 3. High usage rate
      // 4. Good recent performance
      // 5. Projected high minutes
      const isHealthy = !data.injuries.some(inj => inj.playerId === player.id);
      const hasFavorableMatchup = checkFavorableMatchup(player, data.matchups);
      const highUsage = player.usageRate > 25;
      const goodRecent = player.last5Avg > player.seasonAvg * 0.9;
      
      return isHealthy && hasFavorableMatchup && highUsage && goodRecent;
    })
    .sort((a, b) => b.fantasyProjection - a.fantasyProjection)
    .slice(0, 5)
    .map(player => ({
      player: player.name,
      team: player.team,
      position: player.position,
      projection: player.fantasyProjection.toFixed(1),
      value: 'Elite',
      injury: player.injuryStatus || '',
      matchup: getMatchupText(player, data.matchups),
      reasoning: generateReasoning(player, data)
    }));
}

function calculateSleepers(data) {
  return data.playerStats
    .filter(player => {
      // Criteria for sleepers:
      // 1. Low ownership (< 10%)
      // 2. Value play (low salary, high projection)
      // 3. Upside potential
      // 4. Increased role due to injuries
      const lowOwnership = data.ownership[player.id] < 10;
      const goodValue = player.fantasyProjection / player.salary > 0.006;
      const hasUpside = player.upsideScore > 7;
      const increasedRole = checkIncreasedRole(player, data.injuries);
      
      return lowOwnership && goodValue && (hasUpside || increasedRole);
    })
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 3)
    .map(player => ({
      player: player.name,
      team: player.team,
      position: player.position,
      projection: player.fantasyProjection.toFixed(1),
      value: 'Value',
      salary: `$${player.salary.toLocaleString()}`,
      reasoning: generateSleeperReasoning(player, data)
    }));
}

// ===== NEW HELPER FUNCTIONS FOR INTEGRATION =====
async function enhanceGamesWithFantasyContext(gamesData) {
  if (!gamesData || !gamesData.games) return gamesData;
  
  const enhancedGames = gamesData.games.map(game => {
    // Add fantasy-relevant fields
    return {
      ...game,
      fantasy_insights: {
        pace: calculateGamePace(game),
        over_under: game.total || 220,
        spread: game.spread || 0,
        fantasy_friendly: isFantasyFriendlyGame(game),
        key_players: identifyKeyFantasyPlayers(game),
        injury_report: null // Would be populated from injury data
      }
    };
  });
  
  return {
    ...gamesData,
    games: enhancedGames,
    fantasy_context: {
      total_games: enhancedGames.length,
      high_pace_games: enhancedGames.filter(g => g.fantasy_insights.pace > 100).length,
      high_total_games: enhancedGames.filter(g => g.fantasy_insights.over_under > 225).length
    }
  };
}

function addFantasyRelevanceToStandings(standingsData) {
  if (!standingsData || !standingsData.standings) return standingsData;
  
  const enhancedStandings = standingsData.standings.map(team => {
    // Add fantasy-relevant metrics
    return {
      ...team,
      fantasy_metrics: {
        pace: calculateTeamPace(team),
        offensive_rating: team.offensiveRating || 0,
        defensive_rating: team.defensiveRating || 0,
        fantasy_friendly: isFantasyFriendlyTeam(team),
        top_fantasy_players: identifyTopFantasyPlayers(team)
      }
    };
  });
  
  return {
    ...standingsData,
    standings: enhancedStandings,
    fantasy_analysis: {
      best_fantasy_teams: enhancedStandings
        .filter(team => team.fantasy_metrics.fantasy_friendly)
        .slice(0, 5)
        .map(team => team.team),
      worst_fantasy_teams: enhancedStandings
        .filter(team => !team.fantasy_metrics.fantasy_friendly)
        .slice(0, 5)
        .map(team => team.team)
    }
  };
}

async function generateFallbackFantasyAdvice(sport) {
  // Generate basic fantasy advice when main algorithm fails
  const mockAdvice = {
    must_starts: [
      {
        player: 'LeBron James',
        team: 'LAL',
        position: 'SF',
        projection: '55.5',
        value: 'Elite',
        injury: '',
        matchup: 'vs GSW - High pace game',
        reasoning: 'High usage, triple-double threat, favorable matchup'
      },
      {
        player: 'Nikola Jokic',
        team: 'DEN',
        position: 'C',
        projection: '65.2',
        value: 'Elite',
        injury: '',
        matchup: 'vs PHX - Center advantage',
        reasoning: 'Triple-double machine, elite efficiency'
      }
    ],
    sleepers: [
      {
        player: 'Austin Reaves',
        team: 'LAL',
        position: 'SG',
        projection: '32.5',
        value: 'Value',
        salary: '$5,800',
        reasoning: 'Increased minutes with injuries, good shooter'
      }
    ],
    avoids: [
      {
        player: 'Jordan Poole',
        team: 'WAS',
        position: 'SG',
        reasoning: 'Inconsistent, high turnover rate, tough matchup'
      }
    ],
    lastUpdated: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
  
  return mockAdvice;
}

function calculateFantasyProjection(playerData, gamesData) {
  // Simplified projection calculation
  const baseProjection = playerData.points * 1 + 
                         playerData.rebounds * 1.2 + 
                         playerData.assists * 1.5 +
                         playerData.steals * 3 +
                         playerData.blocks * 3;
  
  // Adjust based on matchup
  const matchupFactor = calculateMatchupFactor(playerData, gamesData);
  
  return baseProjection * matchupFactor;
}

function optimizeFantasyLineup(params) {
  // Simplified lineup optimization
  const { players, salaryCap, platform } = params;
  
  // Sort players by value (projection per salary)
  const playersWithValue = players.map(player => ({
    ...player,
    valuePerDollar: player.fantasyProjection / player.salary
  })).sort((a, b) => b.valuePerDollar - a.valuePerDollar);
  
  // Greedy algorithm to build lineup
  const lineup = [];
  let totalSalary = 0;
  const positionCounts = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
  
  for (const player of playersWithValue) {
    if (totalSalary + player.salary <= salaryCap && 
        positionCounts[player.position] < 1) {
      lineup.push(player);
      totalSalary += player.salary;
      positionCounts[player.position]++;
    }
    
    if (lineup.length === 5) break; // Standard 5-player lineup
  }
  
  return {
    lineup: lineup.map(p => ({
      name: p.name,
      position: p.position,
      team: p.team,
      salary: p.salary,
      projection: p.fantasyProjection.toFixed(1)
    })),
    totalSalary: totalSalary,
    totalProjection: lineup.reduce((sum, p) => sum + p.fantasyProjection, 0).toFixed(1),
    valueScore: (lineup.reduce((sum, p) => sum + p.fantasyProjection, 0) / totalSalary * 1000).toFixed(2)
  };
}

// ===== STUB FUNCTIONS (to be implemented) =====
async function fetchInjuryReports(sport) { return []; }
async function fetchTodayMatchups(sport) { return []; }
async function fetchPlayerStats(sport) { return []; }
async function fetchWeatherForGames(sport) { return []; }
async function fetchOwnershipData(sport) { return {}; }
async function fetchSalaryData(sport) { return {}; }
async function fetchRecentPerformance(sport) { return []; }
function calculateAvoids(data) { return []; }
function checkFavorableMatchup(player, matchups) { return true; }
function getMatchupText(player, matchups) { return ''; }
function generateReasoning(player, data) { return ''; }
function checkIncreasedRole(player, injuries) { return false; }
function generateSleeperReasoning(player, data) { return ''; }
async function cacheFantasyData(sport, data) { }
async function addFantasyInsightsToGames(games) { return games; }
function addFantasyInsightsToStandings(standings) { return standings; }
function calculateConfidenceScore(playerData, gamesData) { return 0.8; }
function generatePlayerRecommendation(playerData, projection) { return 'Play'; }
async function getTrendingPlayers(period) { return []; }
async function getHotMatchups(period) { return []; }
async function getRecentInjuryUpdates() { return []; }
function calculateGamePace(game) { return 100; }
function isFantasyFriendlyGame(game) { return true; }
function identifyKeyFantasyPlayers(game) { return []; }
function calculateTeamPace(team) { return 100; }
function isFantasyFriendlyTeam(team) { return true; }
function identifyTopFantasyPlayers(team) { return []; }
function calculateMatchupFactor(playerData, gamesData) { return 1.0; }

export default fantasyController;
