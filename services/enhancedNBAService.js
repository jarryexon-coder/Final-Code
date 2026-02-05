import https from 'https';
import NodeCache from 'node-cache';
import { sportsScheduler } from './sports-scheduler.js';

const cache = new NodeCache({ stdTTL: 300 });

const EnhancedNBAService = {
  // Get real player stats using NBA Data API
  getPlayerStats: async function(playerName) {
    const cacheKey = `player_${playerName.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Serving from cache:', playerName);
      return cached;
    }

    try {
      console.log('🌐 Fetching from NBA Data API:', playerName);
      const apiResult = await this.fetchFromNBAData(playerName);
      
      // Process API result with transformation
      if (apiResult.found && apiResult.player && apiResult.seasonStats) {
        const transformedStats = this.transformNBAData(apiResult.player, apiResult.seasonStats);
        cache.set(cacheKey, transformedStats);
        return transformedStats;
      } else if (apiResult.found === false) {
        console.log('❌ Player not found in NBA Data API, using mock data');
        const mockStats = this.getMockPlayerStats(playerName);
        cache.set(cacheKey, mockStats);
        return mockStats;
      }
      
      // If API result doesn't have expected structure, use mock
      console.log('⚠️ Unexpected response format, using mock data');
      const mockStats = this.getMockPlayerStats(playerName);
      cache.set(cacheKey, mockStats);
      return mockStats;
    } catch (error) {
      console.log('❌ NBA Data API failed, using mock data');
      const mockStats = this.getMockPlayerStats(playerName);
      cache.set(cacheKey, mockStats);
      return mockStats;
    }
  },

  // Fetch from NBA Data API service
  fetchFromNBAData: async function(playerName) {
    try {
      const nbaApiService = await import('./nbaApiService.js');
      return await nbaApiService.default.getPlayerStats(playerName);
    } catch (error) {
      console.error('NBA Data API fetch error:', error);
      return { playerName, found: false };
    }
  },

  // Get betting odds from your scheduler cache
  getBettingOdds: function() {
    const cachedOdds = sportsScheduler.getCachedData('odds');
    if (cachedOdds) {
      return cachedOdds;
    }
    return this.getMockBettingOdds();
  },

  // Get player props from your scheduler cache
  getPlayerProps: function() {
    const cachedProps = sportsScheduler.getCachedData('player_props');
    if (cachedProps) {
      return cachedProps;
    }
    return this.getMockPlayerProps();
  },

  // Get predictions from your scheduler cache
  getPredictions: function() {
    const cachedPredictions = sportsScheduler.getCachedData('predictions');
    if (cachedPredictions) {
      return cachedPredictions;
    }
    return this.getMockPredictions();
  },

  transformNBAData: function(player, stats) {
    // Handle null/undefined cases
    if (!player) {
      return this.getMockPlayerStats('Unknown Player');
    }
    
    return {
      name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      points: stats && stats.pts ? stats.pts : 0,
      rebounds: stats && stats.reb ? stats.reb : 0,
      assists: stats && stats.ast ? stats.ast : 0,
      steals: stats && stats.stl ? stats.stl : 0,
      blocks: stats && stats.blk ? stats.blk : 0,
      fg_percentage: stats && stats.fg_pct ? (stats.fg_pct * 100).toFixed(1) : 0,
      three_point_percentage: stats && stats.fg3_pct ? (stats.fg3_pct * 100).toFixed(1) : 0,
      free_throw_percentage: stats && stats.ft_pct ? (stats.ft_pct * 100).toFixed(1) : 0,
      team: player.team && player.team.full_name ? player.team.full_name : 'Unknown',
      position: player.position || 'Unknown',
      games_played: stats && stats.games_played ? stats.games_played : 0,
      minutes: stats && stats.min ? stats.min.toString() : '0',
      source: 'nba_api',
      last_updated: new Date().toISOString()
    };
  },

  getMockPlayerStats: function(playerName) {
    const mockData = {
      'lebron james': {
        name: 'LeBron James',
        points: 25.3, rebounds: 7.8, assists: 7.3,
        steals: 1.3, blocks: 0.6, fg_percentage: 50.4,
        three_point_percentage: 35.2, free_throw_percentage: 76.8,
        team: 'Los Angeles Lakers', position: 'F', 
        games_played: 65, minutes: '35.2', source: 'mock',
        last_updated: new Date().toISOString()
      },
      'stephen curry': {
        name: 'Stephen Curry',
        points: 27.5, rebounds: 4.5, assists: 5.8,
        steals: 1.2, blocks: 0.2, fg_percentage: 47.3,
        three_point_percentage: 42.7, free_throw_percentage: 91.5,
        team: 'Golden State Warriors', position: 'G',
        games_played: 62, minutes: '34.2', source: 'mock',
        last_updated: new Date().toISOString()
      }
    };
    
    const normalizedName = playerName.toLowerCase();
    if (mockData[normalizedName]) {
      return mockData[normalizedName];
    }
    
    // Return generic mock data for unknown players
    return {
      name: playerName,
      points: 18.5, rebounds: 5.2, assists: 3.8,
      steals: 0.8, blocks: 0.4, fg_percentage: 45.0,
      three_point_percentage: 35.0, free_throw_percentage: 75.0,
      team: 'Unknown', position: 'Unknown',
      games_played: 70, minutes: '28.5', source: 'mock',
      last_updated: new Date().toISOString()
    };
  },

  getMockBettingOdds: function() {
    return {
      data: [
        {
          sport: 'basketball_nba',
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'draftkings',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    { name: 'Lakers', price: -150 },
                    { name: 'Warriors', price: +130 }
                  ]
                }
              ]
            }
          ]
        }
      ],
      source: 'mock',
      last_updated: new Date().toISOString()
    };
  },

  getMockPlayerProps: function() {
    return {
      data: [
        {
          player: 'LeBron James',
          market: 'points',
          line: 25.5,
          over_odds: -110,
          under_odds: -110
        }
      ],
      source: 'mock',
      last_updated: new Date().toISOString()
    };
  },

  getMockPredictions: function() {
    return {
      data: [
        {
          game: 'Lakers vs Warriors',
          prediction: 'Lakers win',
          confidence: 65,
          reasoning: 'Home court advantage and recent form'
        }
      ],
      source: 'mock',
      last_updated: new Date().toISOString()
    };
  }
};

export default EnhancedNBAService;
