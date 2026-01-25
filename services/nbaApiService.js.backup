const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

class NBAApiService {
  constructor() {
    this.sportradarKey = process.env.SPORTRADAR_API_KEY;
    this.balldontlieKey = process.env.BALLDONTLIE_API_KEY;
    this.rapidapiKey = process.env.RAPIDAPI_KEY;
  }

  // Sportradar API for real-time data
  async getPlayerStats(playerName) {
    const cacheKey = `player_${playerName.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://api.sportradar.com/nba/trial/v8/en/players/${playerName}/profile.json?api_key=${this.sportradarKey}`
      );
      
      const playerData = this.transformPlayerData(response.data);
      cache.set(cacheKey, playerData);
      return playerData;
    } catch (error) {
      console.log('Sportradar API failed, trying BallDontLie...');
      return this.getPlayerStatsFallback(playerName);
    }
  }

  // BallDontLie API fallback
  async getPlayerStatsFallback(playerName) {
    try {
      const searchResponse = await axios.get(
        `https://www.balldontlie.io/api/v1/players?search=${encodeURIComponent(playerName)}`
      );
      
      if (searchResponse.data.data.length > 0) {
        const player = searchResponse.data.data[0];
        const statsResponse = await axios.get(
          `https://www.balldontlie.io/api/v1/season_averages?player_ids[]=${player.id}`
        );
        
        return this.transformBallDontLieData(player, statsResponse.data.data[0]);
      }
      throw new Error('Player not found');
    } catch (error) {
      return this.getMockPlayerStats(playerName);
    }
  }

  // Get today's real games
  async getTodaysGames() {
    const cacheKey = 'todays_games';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `https://www.balldontlie.io/api/v1/games?dates[]=${today}`
      );
      
      const games = response.data.data.map(game => ({
        id: game.id,
        home_team: game.home_team.full_name,
        away_team: game.visitor_team.full_name,
        time: new Date(game.date).toLocaleTimeString(),
        home_score: game.home_team_score,
        away_score: game.visitor_team_score,
        status: game.status,
        period: game.period
      }));
      
      cache.set(cacheKey, games);
      return games;
    } catch (error) {
      return this.getMockGames();
    }
  }

  // Transform data to consistent format
  transformPlayerData(apiData) {
    return {
      name: apiData.player.full_name,
      points: apiData.player.stats?.ppg || 0,
      rebounds: apiData.player.stats?.rpg || 0,
      assists: apiData.player.stats?.apg || 0,
      steals: apiData.player.stats?.spg || 0,
      blocks: apiData.player.stats?.bpg || 0,
      fg_percentage: apiData.player.stats?.fg_pct || 0,
      three_point_percentage: apiData.player.stats?.fg3_pct || 0,
      team: apiData.player.team?.name || 'Unknown',
      position: apiData.player.position || 'Unknown',
      games_played: apiData.player.stats?.games_played || 0,
      source: 'sportradar',
      last_updated: new Date().toISOString()
    };
  }

  transformBallDontLieData(player, stats) {
    return {
      name: `${player.first_name} ${player.last_name}`,
      points: stats?.pts || 0,
      rebounds: stats?.reb || 0,
      assists: stats?.ast || 0,
      steals: stats?.stl || 0,
      blocks: stats?.blk || 0,
      fg_percentage: stats?.fg_pct || 0,
      three_point_percentage: stats?.fg3_pct || 0,
      team: player.team?.full_name || 'Unknown',
      position: player.position || 'Unknown',
      games_played: stats?.games_played || 0,
      source: 'balldontlie',
      last_updated: new Date().toISOString()
    };
  }

  getMockPlayerStats(playerName) {
    const mockData = {
      'lebron james': {
        name: 'LeBron James',
        points: 25.3, rebounds: 7.8, assists: 7.3,
        steals: 1.3, blocks: 0.6, fg_percentage: 50.4,
        three_point_percentage: 35.2, team: 'Los Angeles Lakers',
        position: 'F', games_played: 65, source: 'mock'
      },
      'stephen curry': {
        name: 'Stephen Curry',
        points: 27.5, rebounds: 4.5, assists: 5.8,
        steals: 1.2, blocks: 0.2, fg_percentage: 47.3,
        three_point_percentage: 42.7, team: 'Golden State Warriors',
        position: 'G', games_played: 62, source: 'mock'
      }
    };
    
    return mockData[playerName.toLowerCase()] || {
      name: playerName,
      points: 18.5, rebounds: 5.2, assists: 3.8,
      steals: 0.8, blocks: 0.4, fg_percentage: 45.0,
      three_point_percentage: 35.0, team: 'Unknown',
      position: 'Unknown', games_played: 70, source: 'mock'
    };
  }

  getMockGames() {
    return [
      {
        id: 1,
        home_team: "Lakers",
        away_team: "Warriors", 
        time: "7:00 PM ET",
        channel: "ESPN",
        status: "Scheduled"
      }
    ];
  }
}

module.exports = new NBAApiService();
