const https = require('https');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

const EnhancedNBAService = {
  // Get real player stats using your BallDon'tLie API key
  getPlayerStats: async function(playerName) {
    const cacheKey = `player_${playerName.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Serving from cache:', playerName);
      return cached;
    }

    try {
      console.log('🌐 Fetching from BallDon\'tLie API:', playerName);
      const stats = await this.fetchFromBallDontLie(playerName);
      cache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      console.log('❌ BallDon\'tLie API failed, using mock data');
      return this.getMockPlayerStats(playerName);
    }
  },

  // Fetch from BallDon'tLie using your API key
  fetchFromBallDontLie: function(playerName) {
    return new Promise(function(resolve, reject) {
      const options = {
        hostname: 'api.balldontlie.io',
        path: '/v1/players?search=' + encodeURIComponent(playerName),
        method: 'GET',
        headers: {
          'Authorization': process.env.BALLDONTLIE_API_KEY
        },
        timeout: 10000
      };

      const req = https.request(options, function(res) {
        let data = '';

        res.on('data', function(chunk) {
          data += chunk;
        });

        res.on('end', function() {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.data && parsedData.data.length > 0) {
                const player = parsedData.data[0];
                // Fetch player stats
                EnhancedNBAService.fetchPlayerStats(player.id)
                  .then(function(stats) {
                    const playerData = EnhancedNBAService.transformBallDontLieData(player, stats);
                    resolve(playerData);
                  })
                  .catch(function(error) {
                    reject(error);
                  });
              } else {
                reject(new Error('Player not found'));
              }
            } catch (parseError) {
              reject(parseError);
            }
          } else {
            reject(new Error('HTTP ' + res.statusCode + ': ' + data));
          }
        });
      });

      req.on('timeout', function() {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', function(error) {
        reject(error);
      });

      req.end();
    });
  },

  fetchPlayerStats: function(playerId) {
    return new Promise(function(resolve, reject) {
      const options = {
        hostname: 'api.balldontlie.io',
        path: '/v1/season_averages?player_ids[]=' + playerId,
        method: 'GET',
        headers: {
          'Authorization': process.env.BALLDONTLIE_API_KEY
        },
        timeout: 10000
      };

      const req = https.request(options, function(res) {
        let data = '';

        res.on('data', function(chunk) {
          data += chunk;
        });

        res.on('end', function() {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData.data[0] || {});
            } catch (parseError) {
              reject(parseError);
            }
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        });
      });

      req.on('timeout', function() {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', function(error) {
        reject(error);
      });

      req.end();
    });
  },

  // Get betting odds from your scheduler cache
  getBettingOdds: function() {
    const cachedOdds = require('./sports-scheduler').sportsScheduler.getCachedData('odds');
    if (cachedOdds) {
      return cachedOdds;
    }
    return this.getMockBettingOdds();
  },

  // Get player props from your scheduler cache
  getPlayerProps: function() {
    const cachedProps = require('./sports-scheduler').sportsScheduler.getCachedData('player_props');
    if (cachedProps) {
      return cachedProps;
    }
    return this.getMockPlayerProps();
  },

  // Get predictions from your scheduler cache
  getPredictions: function() {
    const cachedPredictions = require('./sports-scheduler').sportsScheduler.getCachedData('predictions');
    if (cachedPredictions) {
      return cachedPredictions;
    }
    return this.getMockPredictions();
  },

  transformBallDontLieData: function(player, stats) {
    return {
      name: player.first_name + ' ' + player.last_name,
      points: stats ? stats.pts : 0,
      rebounds: stats ? stats.reb : 0,
      assists: stats ? stats.ast : 0,
      steals: stats ? stats.stl : 0,
      blocks: stats ? stats.blk : 0,
      fg_percentage: stats ? (stats.fg_pct * 100).toFixed(1) : 0,
      three_point_percentage: stats ? (stats.fg3_pct * 100).toFixed(1) : 0,
      free_throw_percentage: stats ? (stats.ft_pct * 100).toFixed(1) : 0,
      team: player.team ? player.team.full_name : 'Unknown',
      position: player.position || 'Unknown',
      games_played: stats ? stats.games_played : 0,
      minutes: stats ? stats.min : '0',
      source: 'balldontlie',
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
        games_played: 65, minutes: '35.2', source: 'mock'
      },
      'stephen curry': {
        name: 'Stephen Curry',
        points: 27.5, rebounds: 4.5, assists: 5.8,
        steals: 1.2, blocks: 0.2, fg_percentage: 47.3,
        three_point_percentage: 42.7, free_throw_percentage: 91.5,
        team: 'Golden State Warriors', position: 'G',
        games_played: 62, minutes: '34.2', source: 'mock'
      }
    };
    
    return mockData[playerName.toLowerCase()] || {
      name: playerName,
      points: 18.5, rebounds: 5.2, assists: 3.8,
      steals: 0.8, blocks: 0.4, fg_percentage: 45.0,
      three_point_percentage: 35.0, free_throw_percentage: 75.0,
      team: 'Unknown', position: 'Unknown',
      games_played: 70, minutes: '28.5', source: 'mock'
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

module.exports = EnhancedNBAService;
