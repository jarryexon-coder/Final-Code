import express from 'express';
import { Player, Team, Game, Stat } from '../models/index.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Global search across all collections - Cache for 120 seconds (2 minutes)
router.post('/global', cacheMiddleware(120), async (req, res) => {
  try {
    const { query, sports = [], types = [], limit = 10 } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const searchPromises = [];
    const sportsFilter = sports.length > 0 ? { sport: { $in: sports } } : {};
    
    // Player search
    if (types.length === 0 || types.includes('players')) {
      searchPromises.push(
        Player.find({
          ...sportsFilter,
          $text: { $search: query }
        })
        .select('name sport team position fantasyPoints fantasyRank')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean()
        .then(players => ({
          type: 'players',
          results: players,
          count: players.length
        }))
      );
    }
    
    // Team search
    if (types.length === 0 || types.includes('teams')) {
      searchPromises.push(
        Team.find({
          ...sportsFilter,
          $text: { $search: query }
        })
        .select('name sport city conference division record')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean()
        .then(teams => ({
          type: 'teams',
          results: teams,
          count: teams.length
        }))
      );
    }
    
    // Game search
    if (types.length === 0 || types.includes('games')) {
      searchPromises.push(
        Game.find({
          ...sportsFilter,
          $text: { $search: query }
        })
        .select('sport homeTeam awayTeam date status location')
        .sort({ date: -1 })
        .limit(limit)
        .lean()
        .then(games => ({
          type: 'games',
          results: games,
          count: games.length
        }))
      );
    }
    
    // Execute all searches in parallel
    const results = await Promise.allSettled(searchPromises);
    
    const searchResults = {
      query,
      totalResults: 0,
      byType: {}
    };
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, results, count } = result.value;
        searchResults.byType[type] = {
          results,
          count
        };
        searchResults.totalResults += count;
      }
    });
    
    // Add suggestions
    const suggestions = await getSearchSuggestions(query, sportsFilter);
    
    res.json({
      success: true,
      ...searchResults,
      suggestions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Autocomplete endpoint - Cache for 300 seconds (5 minutes)
router.get('/autocomplete', cacheMiddleware(300), async (req, res) => {
  try {
    const { q: query, sport, type = 'all' } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }
    
    const sportsFilter = sport ? { sport } : {};
    const regex = new RegExp(query, 'i');
    
    const pipelines = [];
    
    if (type === 'all' || type === 'players') {
      pipelines.push(
        Player.aggregate([
          { $match: { ...sportsFilter, name: regex } },
          { $project: { _id: 1, name: 1, sport: 1, team: 1, position: 1 } },
          { $limit: 5 }
        ])
      );
    }
    
    if (type === 'all' || type === 'teams') {
      pipelines.push(
        Team.aggregate([
          { $match: { ...sportsFilter, name: regex } },
          { $project: { _id: 1, name: 1, sport: 1, city: 1, abbreviation: 1 } },
          { $limit: 5 }
        ])
      );
    }
    
    const results = await Promise.all(pipelines);
    const flattened = results.flat();
    
    // Sort by relevance (exact match first, then partial)
    flattened.sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
    
    res.json({
      success: true,
      query,
      results: flattened.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      error: 'Autocomplete failed'
    });
  }
});

// Advanced search with filters - Cache for 60 seconds (1 minute)
router.post('/advanced', cacheMiddleware(60), async (req, res) => {
  try {
    const { 
      query,
      sport,
      filters = {},
      sort = { field: 'fantasyPoints', order: -1 },
      page = 1,
      limit = 20
    } = req.body;
    
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery = { sport };
    
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        if (key === 'positions' && Array.isArray(filters[key])) {
          searchQuery.position = { $in: filters[key] };
        } else if (key === 'teams' && Array.isArray(filters[key])) {
          searchQuery.team = { $in: filters[key] };
        } else if (key.includes('Range')) {
          const [min, max] = filters[key];
          const field = key.replace('Range', '').toLowerCase();
          searchQuery[field] = { $gte: min, $lte: max };
        } else {
          searchQuery[key] = filters[key];
        }
      }
    });
    
    // Build sort
    const sortQuery = { [sort.field]: sort.order };
    if (query) {
      sortQuery.score = { $meta: 'textScore' };
    }
    
    // Execute search
    const [results, total] = await Promise.all([
      Player.find(searchQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Player.countDocuments(searchQuery)
    ]);
    
    // Get aggregation stats
    const stats = await Player.aggregate([
      { $match: searchQuery },
      {
        $group: {
          _id: null,
          avgFantasyPoints: { $avg: '$fantasyPoints' },
          maxFantasyPoints: { $max: '$fantasyPoints' },
          minFantasyPoints: { $min: '$fantasyPoints' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: stats[0] || {},
      filtersApplied: filters
    });
    
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: 'Advanced search failed'
    });
  }
});

// Helper function for search suggestions
async function getSearchSuggestions(query, filter = {}) {
  try {
    const suggestions = await Player.aggregate([
      { $match: { ...filter, name: new RegExp(query, 'i') } },
      { $group: { _id: '$name' } },
      { $limit: 5 },
      { $project: { suggestion: '$_id', _id: 0 } }
    ]);
    
    return suggestions.map(s => s.suggestion);
  } catch (error) {
    console.error('Suggestion error:', error);
    return [];
  }
}

export default router;
