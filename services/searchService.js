import NodeCache from 'node-cache';
import { sportsScheduler } from './sports-scheduler.js';
import EnhancedNBAService from './enhancedNBAService.js';
import sportsDataService from './sportsDataService.js';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const SearchService = {
  // Perform comprehensive search across multiple data sources
  searchAll: async function(query, options = {}) {
    const {
      limit = 20,
      types = ['players', 'teams', 'games', 'stats', 'news'],
      includeMock = true
    } = options;

    const cacheKey = `search_all_${query.toLowerCase().replace(/\s+/g, '_')}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Serving search from cache:', query);
      return cached;
    }

    try {
      console.log('🔍 Performing comprehensive search:', query);
      
      const results = {
        query,
        timestamp: new Date().toISOString(),
        players: [],
        teams: [],
        games: [],
        stats: [],
        news: [],
        betting: [],
        predictions: [],
        sources: []
      };

      // Execute all searches in parallel
      const searchPromises = [];

      if (types.includes('players')) {
        searchPromises.push(this.searchPlayers(query, limit));
      }
      
      if (types.includes('teams')) {
        searchPromises.push(this.searchTeams(query, limit));
      }
      
      if (types.includes('games')) {
        searchPromises.push(this.searchGames(query, limit));
      }
      
      if (types.includes('stats')) {
        searchPromises.push(this.searchStats(query, limit));
      }
      
      if (types.includes('news')) {
        searchPromises.push(this.searchNews(query, limit));
      }
      
      if (types.includes('betting')) {
        searchPromises.push(this.searchBettingOdds(query, limit));
      }
      
      if (types.includes('predictions')) {
        searchPromises.push(this.searchPredictions(query, limit));
      }

      const searchResults = await Promise.allSettled(searchPromises);

      // Process results
      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const searchType = types[index];
          if (searchType === 'players') results.players = result.value;
          else if (searchType === 'teams') results.teams = result.value;
          else if (searchType === 'games') results.games = result.value;
          else if (searchType === 'stats') results.stats = result.value;
          else if (searchType === 'news') results.news = result.value;
          else if (searchType === 'betting') results.betting = result.value;
          else if (searchType === 'predictions') results.predictions = result.value;
        }
      });

      // Track sources used
      if (results.teams.length > 0) results.sources.push('nba_api');
      if (results.games.length > 0) results.sources.push('sports_scheduler');
      if (includeMock) results.sources.push('mock_data');

      // Cache the results
      cache.set(cacheKey, results);
      
      return results;

    } catch (error) {
      console.error('❌ Search error:', error);
      return this.getMockSearchResults(query, limit);
    }
  },

  // Search for players by name
  searchPlayers: async function(query, limit = 10) {
    try {
      // Try to get real player stats
      const playerStats = await EnhancedNBAService.getPlayerStats(query);
      
      if (playerStats && playerStats.name.toLowerCase().includes(query.toLowerCase())) {
        return [{
          type: 'player',
          id: `player_${playerStats.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: playerStats.name,
          team: playerStats.team,
          position: playerStats.position,
          stats: {
            points: playerStats.points,
            rebounds: playerStats.rebounds,
            assists: playerStats.assists,
            games_played: playerStats.games_played
          },
          source: playerStats.source,
          relevance: 0.9
        }];
      }
    } catch (error) {
      console.log('Player search API failed, falling back to mock');
    }

    // Fallback to mock data
    return this.getMockPlayers(query, limit);
  },

  // Search for teams
  searchTeams: async function(query, limit = 5) {
    try {
      const cachedTeams = sportsScheduler.getCachedData('teams');
      
      if (cachedTeams && cachedTeams.data) {
        const matchedTeams = cachedTeams.data.filter(team => 
          team.name.toLowerCase().includes(query.toLowerCase()) ||
          team.abbreviation.toLowerCase().includes(query.toLowerCase()) ||
          team.city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);

        if (matchedTeams.length > 0) {
          return matchedTeams.map(team => ({
            type: 'team',
            id: team.id,
            name: team.name,
            city: team.city,
            abbreviation: team.abbreviation,
            conference: team.conference,
            division: team.division,
            source: 'sports_scheduler',
            relevance: 0.8
          }));
        }
      }
    } catch (error) {
      console.log('Team search failed:', error);
    }

    return this.getMockTeams(query, limit);
  },

  // Search for games
  searchGames: async function(query, limit = 10) {
    try {
      const cachedGames = sportsScheduler.getCachedData('games');
      
      if (cachedGames && cachedGames.data) {
        const matchedGames = cachedGames.data.filter(game => 
          game.home_team.toLowerCase().includes(query.toLowerCase()) ||
          game.away_team.toLowerCase().includes(query.toLowerCase()) ||
          (game.venue && game.venue.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, limit);

        if (matchedGames.length > 0) {
          return matchedGames.map(game => ({
            type: 'game',
            id: game.id,
            home_team: game.home_team,
            away_team: game.away_team,
            date: game.date,
            time: game.time,
            venue: game.venue,
            status: game.status,
            source: 'sports_scheduler',
            relevance: 0.7
          }));
        }
      }
    } catch (error) {
      console.log('Game search failed:', error);
    }

    return this.getMockGames(query, limit);
  },

  // Search for player statistics
  searchStats: async function(query, limit = 10) {
    try {
      // This could be enhanced with more specific stat searches
      const playerStats = await EnhancedNBAService.getPlayerStats(query);
      
      if (playerStats) {
        return [{
          type: 'stats',
          player: playerStats.name,
          stats: {
            points: playerStats.points,
            rebounds: playerStats.rebounds,
            assists: playerStats.assists,
            steals: playerStats.steals,
            blocks: playerStats.blocks,
            fg_percentage: playerStats.fg_percentage,
            three_point_percentage: playerStats.three_point_percentage,
            free_throw_percentage: playerStats.free_throw_percentage
          },
          source: playerStats.source,
          relevance: 0.85
        }];
      }
    } catch (error) {
      console.log('Stats search failed:', error);
    }

    return this.getMockStats(query, limit);
  },

  // Search for news (placeholder - could integrate with news API)
  searchNews: async function(query, limit = 5) {
    // This is a placeholder - you could integrate with a news API
    return this.getMockNews(query, limit);
  },

  // Search for betting odds
  searchBettingOdds: async function(query, limit = 10) {
    try {
      const odds = EnhancedNBAService.getBettingOdds();
      
      if (odds && odds.data) {
        const matchedOdds = odds.data.filter(odd => 
          odd.home_team.toLowerCase().includes(query.toLowerCase()) ||
          odd.away_team.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);

        return matchedOdds.map(odd => ({
          type: 'betting',
          game: `${odd.home_team} vs ${odd.away_team}`,
          bookmakers: odd.bookmakers,
          source: odd.source || 'mock',
          last_updated: odd.last_updated,
          relevance: 0.6
        }));
      }
    } catch (error) {
      console.log('Betting odds search failed:', error);
    }

    return this.getMockBetting(query, limit);
  },

  // Search for predictions
  searchPredictions: async function(query, limit = 5) {
    try {
      const predictions = EnhancedNBAService.getPredictions();
      
      if (predictions && predictions.data) {
        const matchedPredictions = predictions.data.filter(prediction => 
          prediction.game.toLowerCase().includes(query.toLowerCase()) ||
          prediction.prediction.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);

        return matchedPredictions.map(prediction => ({
          type: 'prediction',
          game: prediction.game,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
          source: prediction.source || 'mock',
          last_updated: prediction.last_updated,
          relevance: 0.75
        }));
      }
    } catch (error) {
      console.log('Predictions search failed:', error);
    }

    return this.getMockPredictions(query, limit);
  },

  // Advanced search with filters
  advancedSearch: async function(params) {
    const {
      query,
      filters = {},
      sort = 'relevance',
      page = 1,
      pageSize = 20
    } = params;

    const allResults = await this.searchAll(query, { limit: 100 });
    
    // Apply filters
    let filteredResults = { ...allResults };
    
    if (filters.type) {
      if (filters.type === 'player') {
        filteredResults = { ...filteredResults, players: allResults.players };
      } else if (filters.type === 'team') {
        filteredResults = { ...filteredResults, teams: allResults.teams };
      } else if (filters.type === 'game') {
        filteredResults = { ...filteredResults, games: allResults.games };
      }
    }

    // Apply sorting
    if (sort === 'relevance') {
      // Sort by relevance score if available
      Object.keys(filteredResults).forEach(key => {
        if (Array.isArray(filteredResults[key])) {
          filteredResults[key].sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        }
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = {};
    
    Object.keys(filteredResults).forEach(key => {
      if (Array.isArray(filteredResults[key])) {
        paginatedResults[key] = filteredResults[key].slice(startIndex, startIndex + pageSize);
      } else {
        paginatedResults[key] = filteredResults[key];
      }
    });

    return {
      ...paginatedResults,
      pagination: {
        page,
        pageSize,
        totalResults: Object.values(filteredResults).reduce((total, arr) => 
          total + (Array.isArray(arr) ? arr.length : 0), 0
        ),
        totalPages: Math.ceil(
          Object.values(filteredResults).reduce((total, arr) => 
            total + (Array.isArray(arr) ? arr.length : 0), 0
          ) / pageSize
        )
      }
    };
  },

  // Clear search cache
  clearCache: function() {
    cache.flushAll();
    console.log('🧹 Search cache cleared');
    return { success: true, message: 'Search cache cleared' };
  },

  // Get cache statistics
  getCacheStats: function() {
    const stats = cache.getStats();
    return {
      totalKeys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    };
  },

  // Mock data generators
  getMockSearchResults: function(query, limit) {
    return {
      query,
      timestamp: new Date().toISOString(),
      players: this.getMockPlayers(query, limit),
      teams: this.getMockTeams(query, limit),
      games: this.getMockGames(query, limit),
      stats: this.getMockStats(query, limit),
      news: this.getMockNews(query, limit),
      betting: this.getMockBetting(query, limit),
      predictions: this.getMockPredictions(query, limit),
      sources: ['mock_data']
    };
  },

  getMockPlayers: function(query, limit) {
    const mockPlayers = [
      { type: 'player', id: 'lebron_james', name: 'LeBron James', team: 'Los Angeles Lakers', position: 'F', relevance: 0.9 },
      { type: 'player', id: 'stephen_curry', name: 'Stephen Curry', team: 'Golden State Warriors', position: 'G', relevance: 0.85 },
      { type: 'player', id: 'giannis_antetokounmpo', name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', position: 'F', relevance: 0.8 },
      { type: 'player', id: 'kevin_durant', name: 'Kevin Durant', team: 'Phoenix Suns', position: 'F', relevance: 0.75 },
      { type: 'player', id: 'luka_doncic', name: 'Luka Doncic', team: 'Dallas Mavericks', position: 'G', relevance: 0.7 }
    ];

    return mockPlayers
      .filter(player => player.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  },

  getMockTeams: function(query, limit) {
    const mockTeams = [
      { type: 'team', id: 'lakers', name: 'Los Angeles Lakers', city: 'Los Angeles', abbreviation: 'LAL', relevance: 0.9 },
      { type: 'team', id: 'warriors', name: 'Golden State Warriors', city: 'San Francisco', abbreviation: 'GSW', relevance: 0.85 },
      { type: 'team', id: 'celtics', name: 'Boston Celtics', city: 'Boston', abbreviation: 'BOS', relevance: 0.8 },
      { type: 'team', id: 'bucks', name: 'Milwaukee Bucks', city: 'Milwaukee', abbreviation: 'MIL', relevance: 0.75 },
      { type: 'team', id: 'nuggets', name: 'Denver Nuggets', city: 'Denver', abbreviation: 'DEN', relevance: 0.7 }
    ];

    return mockTeams
      .filter(team => 
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.city.toLowerCase().includes(query.toLowerCase()) ||
        team.abbreviation.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  },

  getMockGames: function(query, limit) {
    const mockGames = [
      { type: 'game', id: 'game_1', home_team: 'Los Angeles Lakers', away_team: 'Golden State Warriors', date: '2024-01-25', time: '7:30 PM', venue: 'Crypto.com Arena', relevance: 0.9 },
      { type: 'game', id: 'game_2', home_team: 'Boston Celtics', away_team: 'Milwaukee Bucks', date: '2024-01-25', time: '8:00 PM', venue: 'TD Garden', relevance: 0.85 },
      { type: 'game', id: 'game_3', home_team: 'Phoenix Suns', away_team: 'Dallas Mavericks', date: '2024-01-26', time: '9:00 PM', venue: 'Footprint Center', relevance: 0.8 }
    ];

    return mockGames
      .filter(game => 
        game.home_team.toLowerCase().includes(query.toLowerCase()) ||
        game.away_team.toLowerCase().includes(query.toLowerCase()) ||
        game.venue.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  },

  getMockStats: function(query, limit) {
    return [{
      type: 'stats',
      player: 'LeBron James',
      stats: { points: 25.3, rebounds: 7.8, assists: 7.3, steals: 1.3, blocks: 0.6 },
      relevance: 0.9
    }];
  },

  getMockNews: function(query, limit) {
    return [{
      type: 'news',
      title: `Latest NBA Updates: ${query}`,
      summary: `Breaking news and analysis about ${query} in the NBA`,
      source: 'NBA News',
      date: new Date().toISOString(),
      relevance: 0.6
    }];
  },

  getMockBetting: function(query, limit) {
    return [{
      type: 'betting',
      game: 'Lakers vs Warriors',
      bookmakers: [{ key: 'draftkings', outcomes: [{ name: 'Lakers', price: -150 }, { name: 'Warriors', price: +130 }] }],
      source: 'mock',
      relevance: 0.5
    }];
  },

  getMockPredictions: function(query, limit) {
    return [{
      type: 'prediction',
      game: 'Lakers vs Warriors',
      prediction: 'Lakers win',
      confidence: 65,
      reasoning: 'Home court advantage',
      source: 'mock',
      relevance: 0.7
    }];
  }
};

export default SearchService;
