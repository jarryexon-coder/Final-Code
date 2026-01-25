// controllers/search.controller.js - COMPLETE VERSION
import Player from '../models/Player.js';
import Selection from '../models/selection.js';
import Game from '../models/Game.js';
import User from '../models/user.js';
import SearchHistory from '../models/SearchHistory.js';
import { redisClient } from '../config/redis.js';

// Search players
export const searchPlayers = async (req, res) => {
  try {
    const {
      q = '',
      sport = 'all',
      position = 'all',
      team = 'all',
      status = 'active',
      minValue,
      maxValue,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Text search
    if (q.trim()) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { team: { $regex: q, $options: 'i' } }
      ];
    }

    // Filters
    if (sport !== 'all') query.sport = sport;
    if (position !== 'all') query.position = position;
    if (team !== 'all') query.team = team;
    if (status !== 'all') query.status = status;
    
    if (minValue) query.value = { ...query.value, $gte: parseFloat(minValue) };
    if (maxValue) query.value = { ...query.value, $lte: parseFloat(maxValue) };

    // Determine sort
    const sort = {};
    if (sortBy === 'relevance' && q.trim()) {
      // For text search, sort by text score
      // This would require text index in MongoDB
      sort.score = { $meta: 'textScore' };
    } else if (sortBy === 'value') {
      sort.value = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'fantasyScore') {
      sort.fantasyScore = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const players = await Player.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Player.countDocuments(query);

    // Save search to history if user is logged in
    if (req.user && q.trim()) {
      await saveSearchHistory(req.user.userId || req.user._id, {
        type: 'player',
        query: q,
        filters: { sport, position, team },
        results: players.length
      });
    }

    res.json({
      success: true,
      data: {
        query: q,
        players,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { sport, position, team, status, minValue, maxValue },
        sort: { by: sortBy, order: sortOrder },
        suggestions: await getPlayerSearchSuggestions(q, sport)
      }
    });
  } catch (error) {
    console.error('Search players error:', error);
    res.status(500).json({ success: false, message: 'Failed to search players', error: error.message });
  }
};

// Search games
export const searchGames = async (req, res) => {
  try {
    const {
      q = '',
      sport = 'all',
      status = 'all',
      date,
      team,
      league = 'all',
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Text search
    if (q.trim()) {
      query.$or = [
        { 'homeTeam.name': { $regex: q, $options: 'i' } },
        { 'awayTeam.name': { $regex: q, $options: 'i' } },
        { 'venue.name': { $regex: q, $options: 'i' } }
      ];
    }

    // Filters
    if (sport !== 'all') query.sport = sport;
    if (league !== 'all') query.league = league;
    if (status !== 'all') query.status = status;
    
    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      query.startTime = { $gte: dateObj, $lt: nextDay };
    }
    
    if (team) {
      query.$or = [
        { 'homeTeam.name': { $regex: team, $options: 'i' } },
        { 'awayTeam.name': { $regex: team, $options: 'i' } }
      ];
    }

    // Determine sort
    const sort = {};
    if (sortBy === 'date') {
      sort.startTime = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'importance') {
      sort.importance = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.startTime = -1;
    }

    const games = await Game.find(query)
      .populate('homeTeam.players', 'name position')
      .populate('awayTeam.players', 'name position')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Game.countDocuments(query);

    // Save search to history if user is logged in
    if (req.user && (q.trim() || team)) {
      await saveSearchHistory(req.user.userId || req.user._id, {
        type: 'game',
        query: q || team,
        filters: { sport, status, date, league },
        results: games.length
      });
    }

    res.json({
      success: true,
      data: {
        query: q || team,
        games,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { sport, status, date, team, league },
        sort: { by: sortBy, order: sortOrder },
        upcoming: await getUpcomingGames(sport, 5)
      }
    });
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ success: false, message: 'Failed to search games', error: error.message });
  }
};

// Search selections
export const searchSelections = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const {
      q = '',
      sport = 'all',
      result = 'all',
      type = 'all',
      startDate,
      endDate,
      minOdds,
      maxOdds,
      minConfidence,
      maxConfidence,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Text search (search in player names via playerId)
    if (q.trim()) {
      // This would require a different approach with aggregation
      // For now, we'll search in a separate step
    }

    // Filters
    if (sport !== 'all') query.sport = sport;
    if (result !== 'all') query.result = result;
    if (type !== 'all') query.type = type;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (minOdds || maxOdds) {
      query.odds = {};
      if (minOdds) query.odds.$gte = parseFloat(minOdds);
      if (maxOdds) query.odds.$lte = parseFloat(maxOdds);
    }
    
    if (minConfidence || maxConfidence) {
      query.confidence = {};
      if (minConfidence) query.confidence.$gte = parseFloat(minConfidence);
      if (maxConfidence) query.confidence.$lte = parseFloat(maxConfidence);
    }

    // User-specific unless admin
    if (!req.user || req.user.role !== 'admin') {
      query.userId = userId;
    }

    // Determine sort
    const sort = {};
    if (sortBy === 'date') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'odds') {
      sort.odds = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'confidence') {
      sort.confidence = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'value') {
      sort.value = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // If text query, we need to search in player names
    let selections = [];
    let total = 0;

    if (q.trim()) {
      // Search for players matching the query
      const playerMatches = await Player.find({
        name: { $regex: q, $options: 'i' }
      }).select('_id').lean();

      const playerIds = playerMatches.map(p => p._id);
      
      if (playerIds.length > 0) {
        query.playerId = { $in: playerIds };
      } else {
        // No matching players, return empty results
        return res.json({
          success: true,
          data: {
            query: q,
            selections: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            },
            filters: { sport, result, type, startDate, endDate },
            sort: { by: sortBy, order: sortOrder }
          }
        });
      }
    }

    selections = await Selection.find(query)
      .populate('playerId', 'name position team')
      .populate('userId', 'username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    total = await Selection.countDocuments(query);

    // Save search to history if user is logged in
    if (req.user && (q.trim() || Object.keys(query).length > 1)) {
      await saveSearchHistory(req.user.userId || req.user._id, {
        type: 'selection',
        query: q || 'filtered search',
        filters: { sport, result, type, startDate, endDate },
        results: selections.length
      });
    }

    res.json({
      success: true,
      data: {
        query: q,
        selections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { sport, result, type, startDate, endDate },
        sort: { by: sortBy, order: sortOrder },
        summary: {
          totalSelections: total,
          winRate: selections.length > 0 ? 
            (selections.filter(s => s.result === 'win').length / selections.length * 100).toFixed(2) : 0,
          averageOdds: selections.length > 0 ?
            (selections.reduce((sum, s) => sum + s.odds, 0) / selections.length).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Search selections error:', error);
    res.status(500).json({ success: false, message: 'Failed to search selections', error: error.message });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const {
      q = '',
      role = 'all',
      status = 'all',
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Text search
    if (q.trim()) {
      query.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ];
    }

    // Filters
    if (role !== 'all') query.role = role;
    if (status !== 'all') query.status = status;

    // Determine sort
    const sort = {};
    if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'username') {
      sort.username = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'created') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'activity') {
      sort.lastLogin = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Only save search if admin is searching
    if (req.user && req.user.role === 'admin' && q.trim()) {
      await saveSearchHistory(req.user.userId || req.user._id, {
        type: 'user',
        query: q,
        filters: { role, status },
        results: users.length
      });
    }

    res.json({
      success: true,
      data: {
        query: q,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { role, status },
        sort: { by: sortBy, order: sortOrder },
        suggestions: await getUserSearchSuggestions(q)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users', error: error.message });
  }
};

// Advanced search
export const advancedSearch = async (req, res) => {
  try {
    const {
      type = 'all',
      query: searchQuery = '',
      filters = {},
      dateRange = {},
      sort = {},
      page = 1,
      limit = 20
    } = req.body;

    const skip = (page - 1) * limit;
    let results = [];
    let total = 0;
    let searchType = type;

    // If type is 'all', search across all types
    if (type === 'all') {
      const [players, games, selections, users] = await Promise.all([
        searchPlayersAdvanced(searchQuery, filters, dateRange, sort, skip, limit),
        searchGamesAdvanced(searchQuery, filters, dateRange, sort, skip, limit),
        searchSelectionsAdvanced(searchQuery, filters, dateRange, sort, skip, limit, req.user),
        searchUsersAdvanced(searchQuery, filters, dateRange, sort, skip, limit, req.user)
      ]);

      // Combine and sort results
      results = [
        ...players.results.map(r => ({ type: 'player', ...r })),
        ...games.results.map(r => ({ type: 'game', ...r })),
        ...selections.results.map(r => ({ type: 'selection', ...r })),
        ...users.results.map(r => ({ type: 'user', ...r }))
      ];

      // Apply sorting to combined results
      results = sortCombinedResults(results, sort);

      total = players.total + games.total + selections.total + users.total;
      searchType = 'all';
    } else {
      // Search specific type
      switch (type) {
        case 'player':
          const playerResults = await searchPlayersAdvanced(searchQuery, filters, dateRange, sort, skip, limit);
          results = playerResults.results;
          total = playerResults.total;
          break;
        case 'game':
          const gameResults = await searchGamesAdvanced(searchQuery, filters, dateRange, sort, skip, limit);
          results = gameResults.results;
          total = gameResults.total;
          break;
        case 'selection':
          const selectionResults = await searchSelectionsAdvanced(searchQuery, filters, dateRange, sort, skip, limit, req.user);
          results = selectionResults.results;
          total = selectionResults.total;
          break;
        case 'user':
          const userResults = await searchUsersAdvanced(searchQuery, filters, dateRange, sort, skip, limit, req.user);
          results = userResults.results;
          total = userResults.total;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid search type. Must be: player, game, selection, user, or all'
          });
      }
    }

    // Save advanced search to history
    if (req.user && (searchQuery.trim() || Object.keys(filters).length > 0)) {
      await saveSearchHistory(req.user.userId || req.user._id, {
        type: searchType,
        query: searchQuery,
        filters,
        dateRange,
        results: results.length,
        advanced: true
      });
    }

    res.json({
      success: true,
      data: {
        type: searchType,
        query: searchQuery,
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters,
        dateRange,
        sort,
        breakdown: type === 'all' ? await getSearchBreakdown(searchQuery, filters) : null
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform advanced search', error: error.message });
  }
};

// Get search history
export const getSearchHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      type = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (type !== 'all') query.type = type;
    
    if (startDate || endDate) {
      query.searchedAt = {};
      if (startDate) query.searchedAt.$gte = new Date(startDate);
      if (endDate) query.searchedAt.$lte = new Date(endDate);
    }

    // Determine sort
    const sort = {};
    if (sortBy === 'date') {
      sort.searchedAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'type') {
      sort.type = sortOrder === 'asc' ? 1 : -1;
      sort.searchedAt = -1;
    } else if (sortBy === 'frequency') {
      // This would require aggregation to count frequency
      sort.searchedAt = -1;
    } else {
      sort.searchedAt = -1;
    }

    const history = await SearchHistory.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await SearchHistory.countDocuments(query);

    // Get statistics
    const stats = await SearchHistory.aggregate([
      { $match: query },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$searchedAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          mostSearched: [
            { $group: { 
              _id: '$query', 
              count: { $sum: 1 },
              lastSearched: { $max: '$searchedAt' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: { type, startDate, endDate },
        stats: {
          byType: stats[0]?.byType || [],
          recentDays: stats[0]?.byDay || [],
          mostSearched: stats[0]?.mostSearched || []
        },
        summary: {
          totalSearches: total,
          firstSearch: total > 0 ? history[history.length - 1]?.searchedAt : null,
          lastSearch: total > 0 ? history[0]?.searchedAt : null
        }
      }
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get search history', error: error.message });
  }
};

// Clear search history
export const clearSearchHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { type = 'all', confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm history deletion by setting confirm: true'
      });
    }

    let query = { userId };
    if (type !== 'all') {
      query.type = type;
    }

    const result = await SearchHistory.deleteMany(query);

    // Clear cache
    if (redisClient) {
      const cacheKeys = [
        `search_history:${userId}:*`,
        `search_suggestions:${userId}:*`
      ];
      for (const pattern of cacheKeys) {
        const keys = await redisClient.keys(pattern);
        for (const key of keys) {
          await redisClient.del(key);
        }
      }
    }

    res.json({
      success: true,
      message: `Search history cleared successfully`,
      data: {
        type,
        deletedCount: result.deletedCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear search history', error: error.message });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q = '', type = 'all', limit = 10 } = req.query;
    const userId = req.user?.userId || req.user?._id;

    if (!q.trim()) {
      return res.json({
        success: true,
        data: {
          query: q,
          suggestions: [],
          trending: await getTrendingSearches(type, limit)
        }
      });
    }

    const cacheKey = `search_suggestions:${userId}:${type}:${q}`;
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached)
        });
      }
    }

    const suggestions = await generateSearchSuggestions(q, type, limit, userId);

    const responseData = {
      query: q,
      suggestions,
      trending: await getTrendingSearches(type, Math.floor(limit / 2))
    };

    // Cache suggestions
    if (redisClient) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData)); // 5 minute cache
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get search suggestions', error: error.message });
  }
};

// Get trending searches
export const getTrendingSearches = async (req, res) => {
  try {
    const { type = 'all', timeframe = '24h', limit = 20 } = req.query;

    const cutoffDate = new Date();
    if (timeframe === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    const query = { searchedAt: { $gte: cutoffDate } };
    if (type !== 'all') query.type = type;

    const trending = await SearchHistory.aggregate([
      { $match: query },
      { $group: { 
        _id: '$query', 
        count: { $sum: 1 },
        type: { $first: '$type' },
        lastSearched: { $max: '$searchedAt' }
      }},
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get rising trends (searches that increased recently)
    const rising = await getRisingTrends(timeframe, type, limit);

    res.json({
      success: true,
      data: {
        timeframe,
        type,
        trending,
        rising,
        summary: {
          totalSearches: trending.reduce((sum, item) => sum + item.count, 0),
          uniqueSearches: trending.length,
          mostPopular: trending[0] || null
        }
      }
    });
  } catch (error) {
    console.error('Get trending searches error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trending searches', error: error.message });
  }
};

// Helper functions
const saveSearchHistory = async (userId, searchData) => {
  try {
    const history = new SearchHistory({
      userId,
      type: searchData.type,
      query: searchData.query,
      filters: searchData.filters,
      results: searchData.results,
      advanced: searchData.advanced || false,
      searchedAt: new Date()
    });

    await history.save();

    // Trim history if too long (keep last 100 searches)
    const count = await SearchHistory.countDocuments({ userId });
    if (count > 100) {
      const oldest = await SearchHistory.find({ userId })
        .sort({ searchedAt: 1 })
        .limit(count - 100)
        .select('_id');
      
      const idsToDelete = oldest.map(h => h._id);
      await SearchHistory.deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error('Save search history error:', error);
  }
};

const getPlayerSearchSuggestions = async (query, sport) => {
  if (!query.trim()) return [];

  const players = await Player.find({
    $and: [
      { name: { $regex: query, $options: 'i' } },
      sport !== 'all' ? { sport } : {}
    ]
  })
  .select('name position team value')
  .sort({ value: -1 })
  .limit(10)
  .lean();

  return players.map(p => ({
    type: 'player',
    display: `${p.name} (${p.position} - ${p.team})`,
    value: p.name,
    metadata: {
      position: p.position,
      team: p.team,
      value: p.value
    }
  }));
};

const getUpcomingGames = async (sport, limit) => {
  const query = {
    startTime: { $gte: new Date() },
    status: 'scheduled'
  };

  if (sport !== 'all') query.sport = sport;

  return await Game.find(query)
    .select('homeTeam awayTeam startTime venue')
    .sort({ startTime: 1 })
    .limit(limit)
    .lean();
};

const getUserSearchSuggestions = async (query) => {
  if (!query.trim()) return [];

  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ]
  })
  .select('username name role')
  .sort({ username: 1 })
  .limit(10)
  .lean();

  return users.map(u => ({
    type: 'user',
    display: `${u.username}${u.name ? ` (${u.name})` : ''}`,
    value: u.username,
    metadata: {
      role: u.role,
      name: u.name
    }
  }));
};

const searchPlayersAdvanced = async (query, filters, dateRange, sort, skip, limit) => {
  const searchQuery = {};

  // Text search
  if (query.trim()) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { team: { $regex: query, $options: 'i' } }
    ];
  }

  // Apply filters
  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.position && filters.position !== 'all') searchQuery.position = filters.position;
  if (filters.team && filters.team !== 'all') searchQuery.team = filters.team;
  if (filters.status && filters.status !== 'all') searchQuery.status = filters.status;
  
  if (filters.minValue) searchQuery.value = { ...searchQuery.value, $gte: parseFloat(filters.minValue) };
  if (filters.maxValue) searchQuery.value = { ...searchQuery.value, $lte: parseFloat(filters.maxValue) };

  // Apply date range if relevant
  if (dateRange.startDate || dateRange.endDate) {
    searchQuery.updatedAt = {};
    if (dateRange.startDate) searchQuery.updatedAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) searchQuery.updatedAt.$lte = new Date(dateRange.endDate);
  }

  // Determine sort
  const sortQuery = {};
  if (sort.by === 'value') {
    sortQuery.value = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'fantasyScore') {
    sortQuery.fantasyScore = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'name') {
    sortQuery.name = sort.order === 'asc' ? 1 : -1;
  } else {
    sortQuery.updatedAt = -1;
  }

  const results = await Player.find(searchQuery)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Player.countDocuments(searchQuery);

  return { results, total };
};

const searchGamesAdvanced = async (query, filters, dateRange, sort, skip, limit) => {
  const searchQuery = {};

  // Text search
  if (query.trim()) {
    searchQuery.$or = [
      { 'homeTeam.name': { $regex: query, $options: 'i' } },
      { 'awayTeam.name': { $regex: query, $options: 'i' } }
    ];
  }

  // Apply filters
  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.league && filters.league !== 'all') searchQuery.league = filters.league;
  if (filters.status && filters.status !== 'all') searchQuery.status = filters.status;
  
  if (filters.team) {
    searchQuery.$or = [
      { 'homeTeam.name': { $regex: filters.team, $options: 'i' } },
      { 'awayTeam.name': { $regex: filters.team, $options: 'i' } }
    ];
  }

  // Apply date range
  if (dateRange.startDate || dateRange.endDate) {
    searchQuery.startTime = {};
    if (dateRange.startDate) searchQuery.startTime.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) searchQuery.startTime.$lte = new Date(dateRange.endDate);
  }

  // Determine sort
  const sortQuery = {};
  if (sort.by === 'date') {
    sortQuery.startTime = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'importance') {
    sortQuery.importance = sort.order === 'asc' ? 1 : -1;
  } else {
    sortQuery.startTime = -1;
  }

  const results = await Game.find(searchQuery)
    .populate('homeTeam.players', 'name')
    .populate('awayTeam.players', 'name')
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Game.countDocuments(searchQuery);

  return { results, total };
};

const searchSelectionsAdvanced = async (query, filters, dateRange, sort, skip, limit, user) => {
  const searchQuery = {};

  // Apply filters
  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.result && filters.result !== 'all') searchQuery.result = filters.result;
  if (filters.type && filters.type !== 'all') searchQuery.type = filters.type;
  
  if (filters.minOdds || filters.maxOdds) {
    searchQuery.odds = {};
    if (filters.minOdds) searchQuery.odds.$gte = parseFloat(filters.minOdds);
    if (filters.maxOdds) searchQuery.odds.$lte = parseFloat(filters.maxOdds);
  }
  
  if (filters.minConfidence || filters.maxConfidence) {
    searchQuery.confidence = {};
    if (filters.minConfidence) searchQuery.confidence.$gte = parseFloat(filters.minConfidence);
    if (filters.maxConfidence) searchQuery.confidence.$lte = parseFloat(filters.maxConfidence);
  }

  // Apply date range
  if (dateRange.startDate || dateRange.endDate) {
    searchQuery.createdAt = {};
    if (dateRange.startDate) searchQuery.createdAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) searchQuery.createdAt.$lte = new Date(dateRange.endDate);
  }

  // User-specific unless admin
  if (!user || user.role !== 'admin') {
    searchQuery.userId = user?.userId || user?._id;
  }

  // Text search - search in player names
  if (query.trim()) {
    const playerMatches = await Player.find({
      name: { $regex: query, $options: 'i' }
    }).select('_id').lean();

    const playerIds = playerMatches.map(p => p._id);
    if (playerIds.length > 0) {
      searchQuery.playerId = { $in: playerIds };
    } else {
      return { results: [], total: 0 };
    }
  }

  // Determine sort
  const sortQuery = {};
  if (sort.by === 'date') {
    sortQuery.createdAt = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'odds') {
    sortQuery.odds = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'confidence') {
    sortQuery.confidence = sort.order === 'asc' ? 1 : -1;
  } else {
    sortQuery.createdAt = -1;
  }

  const results = await Selection.find(searchQuery)
    .populate('playerId', 'name position team')
    .populate('userId', 'username')
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Selection.countDocuments(searchQuery);

  return { results, total };
};

const searchUsersAdvanced = async (query, filters, dateRange, sort, skip, limit, user) => {
  const searchQuery = {};

  // Text search
  if (query.trim()) {
    searchQuery.$or = [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ];
  }

  // Apply filters
  if (filters.role && filters.role !== 'all') searchQuery.role = filters.role;
  if (filters.status && filters.status !== 'all') searchQuery.status = filters.status;

  // Apply date range
  if (dateRange.startDate || dateRange.endDate) {
    searchQuery.createdAt = {};
    if (dateRange.startDate) searchQuery.createdAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) searchQuery.createdAt.$lte = new Date(dateRange.endDate);
  }

  // Determine sort
  const sortQuery = {};
  if (sort.by === 'name') {
    sortQuery.name = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'username') {
    sortQuery.username = sort.order === 'asc' ? 1 : -1;
  } else if (sort.by === 'created') {
    sortQuery.createdAt = sort.order === 'asc' ? 1 : -1;
  } else {
    sortQuery.createdAt = -1;
  }

  const results = await User.find(searchQuery)
    .select('-password -refreshToken')
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(searchQuery);

  return { results, total };
};

const sortCombinedResults = (results, sort) => {
  if (!sort.by) return results;

  return results.sort((a, b) => {
    let aValue, bValue;

    switch (sort.by) {
      case 'relevance':
        // Sort by type relevance: player > game > selection > user
        const typeOrder = { player: 4, game: 3, selection: 2, user: 1 };
        aValue = typeOrder[a.type] || 0;
        bValue = typeOrder[b.type] || 0;
        break;
      case 'date':
        aValue = a.createdAt || a.startTime || a.updatedAt || new Date(0);
        bValue = b.createdAt || b.startTime || b.updatedAt || new Date(0);
        break;
      case 'name':
        aValue = a.name || a.username || a.query || '';
        bValue = b.name || b.username || b.query || '';
        break;
      default:
        return 0;
    }

    if (sort.order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

const getSearchBreakdown = async (query, filters) => {
  const breakdown = {
    players: 0,
    games: 0,
    selections: 0,
    users: 0
  };

  const queries = [
    Player.countDocuments(buildPlayerQuery(query, filters)),
    Game.countDocuments(buildGameQuery(query, filters)),
    Selection.countDocuments(buildSelectionQuery(query, filters)),
    User.countDocuments(buildUserQuery(query, filters))
  ];

  const results = await Promise.all(queries);
  
  breakdown.players = results[0];
  breakdown.games = results[1];
  breakdown.selections = results[2];
  breakdown.users = results[3];

  return breakdown;
};

const buildPlayerQuery = (query, filters) => {
  const searchQuery = {};

  if (query.trim()) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { team: { $regex: query, $options: 'i' } }
    ];
  }

  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.position && filters.position !== 'all') searchQuery.position = filters.position;

  return searchQuery;
};

const buildGameQuery = (query, filters) => {
  const searchQuery = {};

  if (query.trim()) {
    searchQuery.$or = [
      { 'homeTeam.name': { $regex: query, $options: 'i' } },
      { 'awayTeam.name': { $regex: query, $options: 'i' } }
    ];
  }

  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.league && filters.league !== 'all') searchQuery.league = filters.league;

  return searchQuery;
};

const buildSelectionQuery = (query, filters) => {
  const searchQuery = {};

  if (filters.sport && filters.sport !== 'all') searchQuery.sport = filters.sport;
  if (filters.result && filters.result !== 'all') searchQuery.result = filters.result;

  return searchQuery;
};

const buildUserQuery = (query, filters) => {
  const searchQuery = {};

  if (query.trim()) {
    searchQuery.$or = [
      { username: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ];
  }

  if (filters.role && filters.role !== 'all') searchQuery.role = filters.role;

  return searchQuery;
};

const generateSearchSuggestions = async (query, type, limit, userId) => {
  const suggestions = [];

  // Get from search history first
  const historySuggestions = await SearchHistory.find({
    userId,
    query: { $regex: query, $options: 'i' },
    ...(type !== 'all' ? { type } : {})
  })
  .sort({ searchedAt: -1 })
  .limit(Math.floor(limit / 2))
  .select('query type')
  .lean();

  historySuggestions.forEach(item => {
    suggestions.push({
      type: item.type,
      display: item.query,
      value: item.query,
      source: 'history'
    });
  });

  // Get from database based on type
  const remaining = limit - suggestions.length;
  if (remaining > 0) {
    let dbSuggestions = [];

    if (type === 'all' || type === 'player') {
      const playerSuggestions = await Player.find({
        name: { $regex: query, $options: 'i' }
      })
      .select('name position team')
      .limit(5)
      .lean();

      dbSuggestions.push(...playerSuggestions.map(p => ({
        type: 'player',
        display: `${p.name} (${p.position} - ${p.team})`,
        value: p.name,
        source: 'database'
      })));
    }

    if (type === 'all' || type === 'game') {
      const gameSuggestions = await Game.find({
        $or: [
          { 'homeTeam.name': { $regex: query, $options: 'i' } },
          { 'awayTeam.name': { $regex: query, $options: 'i' } }
        ]
      })
      .select('homeTeam.name awayTeam.name startTime')
      .limit(5)
      .lean();

      dbSuggestions.push(...gameSuggestions.map(g => ({
        type: 'game',
        display: `${g.homeTeam.name} vs ${g.awayTeam.name}`,
        value: `${g.homeTeam.name} vs ${g.awayTeam.name}`,
        source: 'database'
      })));
    }

    // Add database suggestions
    suggestions.push(...dbSuggestions.slice(0, remaining));
  }

  // Remove duplicates
  const uniqueSuggestions = [];
  const seen = new Set();

  suggestions.forEach(suggestion => {
    const key = `${suggestion.type}:${suggestion.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSuggestions.push(suggestion);
    }
  });

  return uniqueSuggestions.slice(0, limit);
};

const getRisingTrends = async (timeframe, type, limit) => {
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Last 24 hours
  const previousCutoff = new Date(recentCutoff.getTime() - (24 * 60 * 60 * 1000)); // Previous 24 hours

  const query = { 
    searchedAt: { $gte: previousCutoff },
    ...(type !== 'all' ? { type } : {})
  };

  const searches = await SearchHistory.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          query: '$query',
          period: {
            $cond: [
              { $gte: ['$searchedAt', recentCutoff] },
              'recent',
              'previous'
            ]
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.query',
        periods: {
          $push: {
            period: '$_id.period',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        query: '$_id',
        recent: {
          $arrayElemAt: [
            { $filter: { input: '$periods', as: 'p', cond: { $eq: ['$$p.period', 'recent'] } } },
            0
          ]
        },
        previous: {
          $arrayElemAt: [
            { $filter: { input: '$periods', as: 'p', cond: { $eq: ['$$p.period', 'previous'] } } },
            0
          ]
        }
      }
    },
    {
      $project: {
        query: 1,
        recentCount: { $ifNull: ['$recent.count', 0] },
        previousCount: { $ifNull: ['$previous.count', 0] },
        growth: {
          $cond: [
            { $gt: ['$previous.count', 0] },
            { $multiply: [
              { $divide: [
                { $subtract: [{ $ifNull: ['$recent.count', 0] }, { $ifNull: ['$previous.count', 0] }] },
                { $ifNull: ['$previous.count', 0] }
              ]},
              100
            ]},
            100 // If no previous searches, treat as 100% growth
          ]
        }
      }
    },
    { $match: { recentCount: { $gt: 0 } } },
    { $sort: { growth: -1, recentCount: -1 } },
    { $limit: parseInt(limit) }
  ]);

  return searches;
};

// Default export
export default {
  searchPlayers,
  searchGames,
  searchSelections,
  searchUsers,
  advancedSearch,
  getSearchHistory,
  clearSearchHistory,
  getSearchSuggestions,
  getTrendingSearches
};
