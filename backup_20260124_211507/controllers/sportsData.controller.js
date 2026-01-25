// controllers/sportsData.Controller.js
import axios from 'axios';
import { redisClient } from '../config/redis.js';

// API Configuration
const API_CONFIG = {
  rapidapi: {
    key: process.env.RAPIDAPI_KEY,
    host: 'api-nba-v1.p.rapidapi.com',
    baseURL: 'https://api-nba-v1.p.rapidapi.com'
  },
  sportsdata: {
    key: process.env.SPORTSDATA_API_KEY,
    baseURL: 'https://api.sportsdata.io/v3/nba'
  }
};

// Cache duration in seconds
const CACHE_DURATION = {
  live: 60, // 1 minute for live data
  games: 300, // 5 minutes
  stats: 3600, // 1 hour
  standings: 86400, // 24 hours
  news: 1800 // 30 minutes
};

// Helper function to make API requests with caching
async function makeApiRequest(endpoint, cacheKey, cacheDuration = 300) {
  try {
    // Try to get from cache first
    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    // Make API request
    const response = await axios.get(endpoint, {
      headers: {
        'X-RapidAPI-Key': API_CONFIG.rapidapi.key,
        'X-RapidAPI-Host': API_CONFIG.rapidapi.host
      }
    });

    const data = response.data;

    // Cache the response
    if (redisClient && data) {
      await redisClient.setEx(cacheKey, cacheDuration, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error.message);
    throw error;
  }
}

// Get live games
export const getLiveGames = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `live_games:${targetDate}`;

    const data = await makeApiRequest(
      `${API_CONFIG.rapidapi.baseURL}/games?date=${targetDate}`,
      cacheKey,
      CACHE_DURATION.live
    );

    // Transform data to match our format
    const liveGames = data.response.map(game => ({
      id: game.id,
      date: game.date.start,
      status: game.status.long,
      period: game.periods.current,
      clock: game.status.clock,
      homeTeam: {
        id: game.teams.home.id,
        name: game.teams.home.name,
        code: game.teams.home.code,
        score: game.scores.home.points
      },
      awayTeam: {
        id: game.teams.visitors.id,
        name: game.teams.visitors.name,
        code: game.teams.visitors.code,
        score: game.scores.visitors.points
      },
      arena: game.arena,
      officials: game.officials
    }));

    res.json({
      success: true,
      data: {
        date: targetDate,
        games: liveGames,
        count: liveGames.length
      }
    });
  } catch (error) {
    console.error('Get live games error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get live games', 
      error: error.message 
    });
  }
};

// Get game details
export const getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;
    const cacheKey = `game_details:${gameId}`;

    const [gameData, statsData] = await Promise.all([
      makeApiRequest(
        `${API_CONFIG.rapidapi.baseURL}/games?id=${gameId}`,
        cacheKey,
        CACHE_DURATION.games
      ),
      makeApiRequest(
        `${API_CONFIG.rapidapi.baseURL}/games/statistics?id=${gameId}`,
        `${cacheKey}:stats`,
        CACHE_DURATION.stats
      )
    ]);

    const game = gameData.response[0];
    const stats = statsData.response;

    // Transform game details
    const gameDetails = {
      id: game.id,
      date: game.date.start,
      status: game.status.long,
      arena: game.arena,
      officials: game.officials,
      homeTeam: {
        id: game.teams.home.id,
        name: game.teams.home.name,
        code: game.teams.home.code,
        score: game.scores.home.points,
        lineScore: game.scores.home.linescore,
        statistics: stats.find(s => s.team.id === game.teams.home.id)
      },
      awayTeam: {
        id: game.teams.visitors.id,
        name: game.teams.visitors.name,
        code: game.teams.visitors.code,
        score: game.scores.visitors.points,
        lineScore: game.scores.visitors.linescore,
        statistics: stats.find(s => s.team.id === game.teams.visitors.id)
      },
      periods: game.periods,
      leadChanges: game.leadChanges,
      timesTied: game.timesTied
    };

    res.json({
      success: true,
      data: gameDetails
    });
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get game details', 
      error: error.message 
    });
  }
};

// Get player stats
export const getPlayerStats = async (req, res) => {
  try {
    const { playerId, season = '2023', gameId } = req.query;
    let cacheKey = `player_stats:${playerId}:${season}`;
    let endpoint = `${API_CONFIG.rapidapi.baseURL}/players/statistics`;

    if (gameId) {
      endpoint += `?id=${gameId}&player=${playerId}`;
      cacheKey += `:game:${gameId}`;
    } else {
      endpoint += `?season=${season}&id=${playerId}`;
    }

    const data = await makeApiRequest(
      endpoint,
      cacheKey,
      CACHE_DURATION.stats
    );

    const playerStats = data.response.map(stat => ({
      gameId: stat.game.id,
      date: stat.game.date,
      team: {
        id: stat.team.id,
        name: stat.team.name,
        code: stat.team.code
      },
      opponent: {
        id: stat.game.teams.visitors.id === stat.team.id ? 
             stat.game.teams.home.id : stat.game.teams.visitors.id,
        name: stat.game.teams.visitors.id === stat.team.id ? 
              stat.game.teams.home.name : stat.game.teams.visitors.name
      },
      stats: {
        minutes: stat.min,
        points: stat.points,
        rebounds: stat.totReb,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        fouls: stat.pFouls,
        fieldGoals: `${stat.fgm}/${stat.fga}`,
        threePoints: `${stat.tpm}/${stat.tpa}`,
        freeThrows: `${stat.ftm}/${stat.fta}`,
        plusMinus: stat.plusMinus
      },
      advanced: {
        efficiency: calculateEfficiency(stat),
        trueShooting: calculateTrueShooting(stat),
        usage: calculateUsageRate(stat)
      }
    }));

    // Calculate season averages
    const seasonAverages = calculateSeasonAverages(playerStats);

    res.json({
      success: true,
      data: {
        playerId,
        season,
        gameStats: playerStats,
        seasonAverages,
        totals: {
          games: playerStats.length,
          points: playerStats.reduce((sum, game) => sum + game.stats.points, 0),
          rebounds: playerStats.reduce((sum, game) => sum + game.stats.rebounds, 0),
          assists: playerStats.reduce((sum, game) => sum + game.stats.assists, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get player stats', 
      error: error.message 
    });
  }
};

// Helper functions for player stats
function calculateEfficiency(stats) {
  const { points, rebounds, assists, steals, blocks, fga, fgm, fta, ftm, turnovers } = stats;
  return ((points + rebounds + assists + steals + blocks) - 
         ((fga - fgm) + (fta - ftm) + turnovers)).toFixed(1);
}

function calculateTrueShooting(stats) {
  const { points, fga, fta } = stats;
  const ts = points / (2 * (fga + 0.44 * fta));
  return (ts * 100).toFixed(1);
}

function calculateUsageRate(stats) {
  // Simplified usage rate calculation
  const { fga, fta, turnovers, minutes } = stats;
  const teamMinutes = 240; // 5 players * 48 minutes
  const usage = ((fga + 0.44 * fta + turnovers) * teamMinutes) / (minutes * 5);
  return (usage * 100).toFixed(1);
}

function calculateSeasonAverages(gameStats) {
  if (gameStats.length === 0) return {};
  
  const totals = gameStats.reduce((acc, game) => ({
    points: acc.points + game.stats.points,
    rebounds: acc.rebounds + game.stats.rebounds,
    assists: acc.assists + game.stats.assists,
    steals: acc.steals + game.stats.steals,
    blocks: acc.blocks + game.stats.blocks,
    turnovers: acc.turnovers + game.stats.turnovers,
    minutes: acc.minutes + parseFloat(game.stats.minutes) || 0,
    games: acc.games + 1
  }), {
    points: 0, rebounds: 0, assists: 0, steals: 0,
    blocks: 0, turnovers: 0, minutes: 0, games: 0
  });

  return {
    points: (totals.points / totals.games).toFixed(1),
    rebounds: (totals.rebounds / totals.games).toFixed(1),
    assists: (totals.assists / totals.games).toFixed(1),
    steals: (totals.steals / totals.games).toFixed(1),
    blocks: (totals.blocks / totals.games).toFixed(1),
    turnovers: (totals.turnovers / totals.games).toFixed(1),
    minutes: (totals.minutes / totals.games).toFixed(1),
    efficiency: (parseFloat(calculateEfficiency({
      points: totals.points,
      rebounds: totals.rebounds,
      assists: totals.assists,
      steals: totals.steals,
      blocks: totals.blocks,
      fga: 0, fgm: 0, fta: 0, ftm: 0, turnovers: totals.turnovers
    })) / totals.games).toFixed(1)
  };
}

// Get team stats
export const getTeamStats = async (req, res) => {
  try {
    const { teamId, season = '2023' } = req.query;
    const cacheKey = `team_stats:${teamId}:${season}`;

    const [teamData, standingsData, gamesData] = await Promise.all([
      makeApiRequest(
        `${API_CONFIG.rapidapi.baseURL}/teams/statistics?season=${season}&id=${teamId}`,
        cacheKey,
        CACHE_DURATION.stats
      ),
      makeApiRequest(
        `${API_CONFIG.rapidapi.baseURL}/standings?season=${season}&league=standard`,
        `standings:${season}`,
        CACHE_DURATION.standings
      ),
      makeApiRequest(
        `${API_CONFIG.rapidapi.baseURL}/games?season=${season}&team=${teamId}`,
        `${cacheKey}:games`,
        CACHE_DURATION.games
      )
    ]);

    const teamStats = teamData.response;
    const teamStanding = standingsData.response.find(s => s.team.id === parseInt(teamId));
    const teamGames = gamesData.response;

    // Calculate team performance
    const performance = {
      wins: teamGames.filter(g => {
        const isHome = g.teams.home.id === parseInt(teamId);
        const homeWon = g.scores.home.points > g.scores.visitors.points;
        return (isHome && homeWon) || (!isHome && !homeWon);
      }).length,
      losses: teamGames.filter(g => {
        const isHome = g.teams.home.id === parseInt(teamId);
        const homeWon = g.scores.home.points > g.scores.visitors.points;
        return (isHome && !homeWon) || (!isHome && homeWon);
      }).length,
      homeRecord: {
        wins: teamGames.filter(g => 
          g.teams.home.id === parseInt(teamId) && 
          g.scores.home.points > g.scores.visitors.points
        ).length,
        losses: teamGames.filter(g => 
          g.teams.home.id === parseInt(teamId) && 
          g.scores.home.points < g.scores.visitors.points
        ).length
      },
      awayRecord: {
        wins: teamGames.filter(g => 
          g.teams.visitors.id === parseInt(teamId) && 
          g.scores.visitors.points > g.scores.home.points
        ).length,
        losses: teamGames.filter(g => 
          g.teams.visitors.id === parseInt(teamId) && 
          g.scores.visitors.points < g.scores.home.points
        ).length
      }
    };

    const teamDetails = {
      id: teamId,
      season,
      name: teamStats.team?.name || 'Unknown',
      code: teamStats.team?.code || 'UNK',
      statistics: teamStats,
      standings: teamStanding,
      performance,
      recentGames: teamGames.slice(0, 10).map(game => ({
        id: game.id,
        date: game.date.start,
        opponent: game.teams.home.id === parseInt(teamId) ? 
                 game.teams.visitors.name : game.teams.home.name,
        result: game.teams.home.id === parseInt(teamId) ?
               (game.scores.home.points > game.scores.visitors.points ? 'W' : 'L') :
               (game.scores.visitors.points > game.scores.home.points ? 'W' : 'L'),
        score: game.teams.home.id === parseInt(teamId) ?
              `${game.scores.home.points}-${game.scores.visitors.points}` :
              `${game.scores.visitors.points}-${game.scores.home.points}`
      })),
      averages: {
        pointsPerGame: (teamGames.reduce((sum, game) => {
          const isHome = game.teams.home.id === parseInt(teamId);
          return sum + (isHome ? game.scores.home.points : game.scores.visitors.points);
        }, 0) / teamGames.length).toFixed(1),
        pointsAllowed: (teamGames.reduce((sum, game) => {
          const isHome = game.teams.home.id === parseInt(teamId);
          return sum + (isHome ? game.scores.visitors.points : game.scores.home.points);
        }, 0) / teamGames.length).toFixed(1)
      }
    };

    res.json({
      success: true,
      data: teamDetails
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get team stats', 
      error: error.message 
    });
  }
};

// Get standings
export const getStandings = async (req, res) => {
  try {
    const { season = '2023', conference } = req.query;
    const cacheKey = `standings:${season}${conference ? `:${conference}` : ''}`;

    const data = await makeApiRequest(
      `${API_CONFIG.rapidapi.baseURL}/standings?season=${season}&league=standard`,
      cacheKey,
      CACHE_DURATION.standings
    );

    let standings = data.response;

    // Filter by conference if specified
    if (conference && (conference === 'east' || conference === 'west')) {
      standings = standings.filter(team => 
        conference === 'east' ? team.conference.name === 'east' : team.conference.name === 'west'
      );
    }

    // Sort standings
    standings.sort((a, b) => {
      // Sort by win percentage
      const winPctA = a.win.total / (a.win.total + a.loss.total);
      const winPctB = b.win.total / (b.win.total + b.loss.total);
      return winPctB - winPctA;
    });

    // Format standings
    const formattedStandings = standings.map((team, index) => ({
      rank: index + 1,
      team: {
        id: team.team.id,
        name: team.team.name,
        code: team.team.code,
        logo: team.team.logo
      },
      conference: team.conference.name,
      division: team.division.name,
      record: {
        wins: team.win.total,
        losses: team.loss.total,
        percentage: (team.win.total / (team.win.total + team.loss.total)).toFixed(3),
        home: `${team.win.home}-${team.loss.home}`,
        away: `${team.win.away}-${team.loss.away}`,
        last10: `${team.win.lastTen}-${team.loss.lastTen}`
      },
      streak: team.streak,
      points: {
        for: team.points.for,
        against: team.points.against,
        difference: team.points.for - team.points.against
      }
    }));

    // Calculate conference standings
    const eastStandings = formattedStandings.filter(t => t.conference === 'east');
    const westStandings = formattedStandings.filter(t => t.conference === 'west');

    res.json({
      success: true,
      data: {
        season,
        lastUpdated: new Date().toISOString(),
        overall: formattedStandings,
        conferences: {
          east: eastStandings,
          west: westStandings
        },
        summary: {
          totalTeams: formattedStandings.length,
          bestRecord: formattedStandings[0]?.team.name || 'N/A',
          bestWinPct: formattedStandings[0]?.record.percentage || '0.000'
        }
      }
    });
  } catch (error) {
    console.error('Get standings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get standings', 
      error: error.message 
    });
  }
};

// Get schedules
export const getSchedules = async (req, res) => {
  try {
    const { season = '2023', teamId, date, week } = req.query;
    let cacheKey = `schedule:${season}`;
    let endpoint = `${API_CONFIG.rapidapi.baseURL}/games?season=${season}`;

    if (teamId) {
      endpoint += `&team=${teamId}`;
      cacheKey += `:team:${teamId}`;
    }
    if (date) {
      endpoint += `&date=${date}`;
      cacheKey += `:date:${date}`;
    }

    const data = await makeApiRequest(
      endpoint,
      cacheKey,
      CACHE_DURATION.games
    );

    let games = data.response;

    // Filter by week if specified
    if (week) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      games = games.filter(game => {
        const gameDate = new Date(game.date.start);
        return gameDate >= weekStart && gameDate < weekEnd;
      });
    }

    // Group games by date
    const gamesByDate = games.reduce((acc, game) => {
      const date = game.date.start.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push({
        id: game.id,
        time: new Date(game.date.start).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: game.status.long,
        homeTeam: {
          id: game.teams.home.id,
          name: game.teams.home.name,
          code: game.teams.home.code
        },
        awayTeam: {
          id: game.teams.visitors.id,
          name: game.teams.visitors.name,
          code: game.teams.visitors.code
        },
        arena: game.arena,
        tvBroadcast: game.tvBroadcast
      });
      
      return acc;
    }, {});

    // Convert to array format
    const schedule = Object.entries(gamesByDate).map(([date, games]) => ({
      date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      games
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        season,
        schedule,
        totalGames: games.length,
        dateRange: {
          start: games.length > 0 ? games[0].date.start : null,
          end: games.length > 0 ? games[games.length - 1].date.start : null
        }
      }
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get schedules', 
      error: error.message 
    });
  }
};

// Get odds
export const getOdds = async (req, res) => {
  try {
    const { gameId, date, sportsbook = 'fanduel' } = req.query;
    let cacheKey = `odds:${sportsbook}`;
    
    // This would typically come from a sportsbook API
    // For now, we'll simulate odds data
    const simulatedOdds = simulateOdds(gameId, date, sportsbook);

    res.json({
      success: true,
      data: {
        sportsbook,
        lastUpdated: new Date().toISOString(),
        odds: simulatedOdds
      }
    });
  } catch (error) {
    console.error('Get odds error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get odds', 
      error: error.message 
    });
  }
};

// Helper function to simulate odds
function simulateOdds(gameId, date, sportsbook) {
  if (gameId) {
    // Return specific game odds
    return {
      gameId,
      moneyline: {
        home: -150,
        away: +130
      },
      spread: {
        home: -3.5,
        away: +3.5,
        homeOdds: -110,
        awayOdds: -110
      },
      total: {
        points: 225.5,
        over: -110,
        under: -110
      },
      sportsbook,
      lastUpdated: new Date().toISOString()
    };
  }

  // Return multiple games for a date
  const games = [];
  for (let i = 0; i < 5; i++) {
    games.push({
      gameId: `game_${i}`,
      homeTeam: `Team ${i}A`,
      awayTeam: `Team ${i}B`,
      moneyline: {
        home: Math.random() > 0.5 ? -Math.floor(Math.random() * 200 + 100) : Math.floor(Math.random() * 200 + 100),
        away: Math.random() > 0.5 ? -Math.floor(Math.random() * 200 + 100) : Math.floor(Math.random() * 200 + 100)
      },
      spread: {
        home: (Math.random() * 10 - 5).toFixed(1),
        away: (Math.random() * -10 + 5).toFixed(1),
        homeOdds: -110,
        awayOdds: -110
      },
      total: {
        points: (Math.random() * 50 + 200).toFixed(1),
        over: -110,
        under: -110
      }
    });
  }

  return games;
}

// Get injuries
export const getInjuries = async (req, res) => {
  try {
    const { teamId, date } = req.query;
    const cacheKey = `injuries${teamId ? `:team:${teamId}` : ''}${date ? `:date:${date}` : ''}`;

    // This would typically come from an injuries API
    // For now, we'll simulate injury data
    const simulatedInjuries = simulateInjuries(teamId, date);

    res.json({
      success: true,
      data: {
        lastUpdated: new Date().toISOString(),
        injuries: simulatedInjuries
      }
    });
  } catch (error) {
    console.error('Get injuries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get injuries', 
      error: error.message 
    });
  }
};

// Helper function to simulate injuries
function simulateInjuries(teamId, date) {
  const injuries = [];
  const teams = teamId ? [teamId] : Array.from({ length: 5 }, (_, i) => `team_${i}`);
  
  teams.forEach(team => {
    const playerCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < playerCount; i++) {
      injuries.push({
        playerId: `player_${team}_${i}`,
        playerName: `Player ${i} of Team ${team}`,
        teamId: team,
        teamName: `Team ${team}`,
        injury: ['Ankle', 'Knee', 'Hamstring', 'Shoulder', 'Concussion'][Math.floor(Math.random() * 5)],
        status: ['Questionable', 'Doubtful', 'Out', 'Day-to-day'][Math.floor(Math.random() * 4)],
        date: date || new Date().toISOString().split('T')[0],
        expectedReturn: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  });

  return injuries;
}

// Get news
export const getNews = async (req, res) => {
  try {
    const { teamId, playerId, limit = 20 } = req.query;
    let cacheKey = `news${teamId ? `:team:${teamId}` : ''}${playerId ? `:player:${playerId}` : ''}`;

    // This would typically come from a news API
    // For now, we'll simulate news data
    const simulatedNews = simulateNews(teamId, playerId, limit);

    res.json({
      success: true,
      data: {
        lastUpdated: new Date().toISOString(),
        news: simulatedNews
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get news', 
      error: error.message 
    });
  }
};

// Helper function to simulate news
function simulateNews(teamId, playerId, limit) {
  const news = [];
  const topics = ['Trade Rumors', 'Injury Update', 'Game Preview', 'Player Performance', 'Team Strategy'];
  const sources = ['ESPN', 'NBA.com', 'Bleacher Report', 'The Athletic', 'Sports Illustrated'];
  
  for (let i = 0; i < limit; i++) {
    news.push({
      id: `news_${i}`,
      title: `${topics[Math.floor(Math.random() * topics.length)]}: ${teamId || playerId || 'NBA'}`,
      summary: `This is a simulated news article about ${teamId || playerId || 'the NBA'}.`,
      content: `Full content of the news article would appear here. This is just simulated data for demonstration purposes.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      author: `Author ${Math.floor(Math.random() * 100)}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://example.com/news/${i}`,
      imageUrl: `https://via.placeholder.com/300x200?text=News+${i}`,
      tags: [teamId || 'NBA', playerId || 'General'].filter(Boolean)
    });
  }

  return news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

// Sync sports data
export const syncSportsData = async (req, res) => {
  try {
    const { dataType, forceRefresh = false } = req.body;
    
    let syncResults = [];
    
    // Define sync tasks based on dataType
    const syncTasks = {
      all: ['games', 'standings', 'players', 'teams', 'schedules'],
      games: ['games'],
      standings: ['standings'],
      players: ['players'],
      teams: ['teams'],
      schedules: ['schedules']
    };

    const tasks = syncTasks[dataType] || syncTasks.all;

    // Execute sync tasks
    for (const task of tasks) {
      try {
        // Clear cache for this task if force refresh
        if (redisClient && forceRefresh) {
          const pattern = `${task}:*`;
          const keys = await redisClient.keys(pattern);
          for (const key of keys) {
            await redisClient.del(key);
          }
        }

        // Simulate sync operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        syncResults.push({
          task,
          status: 'success',
          message: `Successfully synced ${task} data`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        syncResults.push({
          task,
          status: 'error',
          message: `Failed to sync ${task} data: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      message: 'Sports data sync completed',
      data: {
        results: syncResults,
        summary: {
          totalTasks: syncResults.length,
          successful: syncResults.filter(r => r.status === 'success').length,
          failed: syncResults.filter(r => r.status === 'error').length
        }
      }
    });
  } catch (error) {
    console.error('Sync sports data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync sports data', 
      error: error.message 
    });
  }
};

// Default export
export default {
  getLiveGames,
  getGameDetails,
  getPlayerStats,
  getTeamStats,
  getStandings,
  getSchedules,
  getOdds,
  getInjuries,
  getNews,
  syncSportsData
};
