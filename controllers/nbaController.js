// NBA Controller - Handles NBA-related API logic
const redis = require('redis');
const axios = require('axios');

// Create Redis client (add config in production)
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Handle Redis errors
client.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis
(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis cache');
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
    console.log('⚠️  Continuing without cache...');
  }
})();

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper function to fetch real games data from API
const fetchRealGamesData = async (date) => {
  try {
    const apiKey = process.env.SPORTSDATA_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️  No SportsData API key found, using mock data');
      return null;
    }
    
    const formattedDate = formatDate(date);
    const response = await axios.get(
      `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${formattedDate}`,
      { 
        headers: { 
          'Ocp-Apim-Subscription-Key': apiKey 
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(game => ({
        id: game.GameID,
        home_team: game.HomeTeam,
        away_team: game.AwayTeam,
        time: game.DateTime ? new Date(game.DateTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/New_York',
          hour12: false 
        }) + ' ET' : 'TBD',
        home_score: game.HomeTeamScore || 0,
        away_score: game.AwayTeamScore || 0,
        status: game.Status || 'Scheduled',
        channel: game.Channel || 'TBD',
        date: formattedDate,
        arena: game.Arena || null,
        city: game.ArenaCity || null
      }));
    }
    
    return null;
  } catch (error) {
    console.error('❌ SportsData API Error:', error.message);
    return null;
  }
};

// Helper function for fallback mock data
const getFallbackGames = (date) => {
  const today = formatDate(date);
  const yesterday = formatDate(new Date(date.getTime() - 86400000));
  const tomorrow = formatDate(new Date(date.getTime() + 86400000));
  
  return [
    {
      id: 1,
      home_team: 'Los Angeles Lakers',
      away_team: 'Golden State Warriors',
      time: '7:30 PM ET',
      channel: 'TNT',
      home_score: 112,
      away_score: 108,
      status: 'Final',
      date: today
    },
    {
      id: 2,
      home_team: 'Boston Celtics',
      away_team: 'Miami Heat',
      time: '8:00 PM ET',
      channel: 'ESPN',
      home_score: 105,
      away_score: 102,
      status: 'Q3 4:32',
      date: today
    },
    {
      id: 3,
      home_team: 'Denver Nuggets',
      away_team: 'Phoenix Suns',
      time: '10:00 PM ET',
      channel: 'NBA TV',
      home_score: 0,
      away_score: 0,
      status: 'Upcoming',
      date: today
    },
    {
      id: 4,
      home_team: 'New York Knicks',
      away_team: 'Brooklyn Nets',
      time: '7:00 PM ET',
      channel: 'MSG',
      home_score: 98,
      away_score: 95,
      status: 'Final',
      date: yesterday
    },
    {
      id: 5,
      home_team: 'Milwaukee Bucks',
      away_team: 'Philadelphia 76ers',
      time: '7:30 PM ET',
      channel: 'NBA TV',
      home_score: 0,
      away_score: 0,
      status: 'Scheduled',
      date: tomorrow
    }
  ];
};

const nbaController = {
  // ===== GET ALL NBA GAMES =====
  getGames: async (req, res) => {
    try {
      console.log('[NBA Controller] Getting all games (real data)');
      
      // Try to get games for today, yesterday, and tomorrow
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const tomorrow = new Date(today.getTime() + 86400000);
      
      const [gamesToday, gamesYesterday, gamesTomorrow] = await Promise.all([
        fetchRealGamesData(today),
        fetchRealGamesData(yesterday),
        fetchRealGamesData(tomorrow)
      ]);
      
      let allGames = [];
      
      // Combine real data if available
      if (gamesToday && gamesYesterday && gamesTomorrow) {
        allGames = [...gamesYesterday, ...gamesToday, ...gamesTomorrow];
      } else {
        // Fallback to mock data
        console.log('📋 Using fallback mock data for getGames');
        allGames = getFallbackGames(today);
      }
      
      // Filter based on query parameters if provided
      let filteredGames = allGames;
      
      if (req.query.date) {
        filteredGames = filteredGames.filter(game => game.date === req.query.date);
      }
      
      if (req.query.status) {
        filteredGames = filteredGames.filter(game => 
          game.status.toLowerCase().includes(req.query.status.toLowerCase())
        );
      }
      
      if (req.query.team) {
        const teamQuery = req.query.team.toLowerCase();
        filteredGames = filteredGames.filter(game => 
          game.home_team.toLowerCase().includes(teamQuery) ||
          game.away_team.toLowerCase().includes(teamQuery)
        );
      }
      
      res.json({
        success: true,
        data: filteredGames,
        count: filteredGames.length,
        timestamp: new Date().toISOString(),
        source: allGames[0] && allGames[0].arena ? 'SportsData API' : 'Mock Data'
      });
      
    } catch (error) {
      console.error('[NBA Controller] Error in getGames:', error);
      
      // Fallback to mock data
      const games = getFallbackGames(new Date());
      res.json({
        success: true,
        data: games,
        count: games.length,
        timestamp: new Date().toISOString(),
        source: 'Mock Data (Fallback)',
        error: error.message
      });
    }
  },

  // ===== GET TODAY'S NBA GAMES (WITH CACHING) =====
  getTodayGames: async (req, res) => {
    try {
      const today = new Date();
      const todayStr = formatDate(today);
      const cacheKey = `nba-games-${todayStr}`;
      
      // Try cache first
      const cachedResponse = await client.get(cacheKey);
      if (cachedResponse) {
        console.log('📦 [NBA Controller] Serving today\'s games from Redis cache');
        return res.json(JSON.parse(cachedResponse));
      }
      
      // If not cached, try to fetch real data
      console.log('🔄 [NBA Controller] Fetching fresh NBA games data');
      
      let games = await fetchRealGamesData(today);
      let source = 'SportsData API';
      
      // Fallback to mock data if real API fails
      if (!games || games.length === 0) {
        console.log('📋 Using fallback mock data for today\'s games');
        games = getFallbackGames(today).filter(game => game.date === todayStr);
        source = 'Mock Data';
      }
      
      const responseData = {
        success: true,
        data: games,
        timestamp: new Date().toISOString(),
        cached: false,
        source: source,
        date: todayStr
      };
      
      // Store in Redis for 5 minutes (300 seconds)
      try {
        await client.setEx(cacheKey, 300, JSON.stringify(responseData));
      } catch (cacheError) {
        console.error('⚠️ Redis cache error:', cacheError.message);
      }
      
      res.json(responseData);
      
    } catch (error) {
      console.error('[NBA Controller] Error in getTodayGames:', error);
      
      // Fallback: Serve mock data without cache
      const today = new Date();
      const todayStr = formatDate(today);
      const games = getFallbackGames(today).filter(game => game.date === todayStr);
      
      res.json({
        success: true,
        data: games,
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'Mock Data (Error Fallback)',
        error: error.message
      });
    }
  },

  // ===== GET GAMES BY DATE =====
  getGamesByDate: async (req, res) => {
    try {
      const { date } = req.params;
      
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      console.log(`[NBA Controller] Getting games for date: ${date}`);
      
      const gameDate = new Date(date);
      const cacheKey = `nba-games-${date}`;
      
      // Try cache first
      const cachedResponse = await client.get(cacheKey);
      if (cachedResponse) {
        console.log(`📦 Serving games for ${date} from Redis cache`);
        return res.json(JSON.parse(cachedResponse));
      }
      
      // Fetch fresh data
      let games = await fetchRealGamesData(gameDate);
      let source = 'SportsData API';
      
      // Fallback to mock data if real API fails
      if (!games || games.length === 0) {
        console.log(`📋 Using fallback mock data for ${date}`);
        games = getFallbackGames(gameDate).filter(game => game.date === date);
        source = 'Mock Data';
      }
      
      const responseData = {
        success: true,
        data: games,
        date: date,
        timestamp: new Date().toISOString(),
        cached: false,
        source: source
      };
      
      // Store in Redis for 5 minutes
      try {
        await client.setEx(cacheKey, 300, JSON.stringify(responseData));
      } catch (cacheError) {
        console.error('⚠️ Redis cache error:', cacheError.message);
      }
      
      res.json(responseData);
      
    } catch (error) {
      console.error('[NBA Controller] Error in getGamesByDate:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch games for the specified date',
        message: error.message
      });
    }
  },

  // ===== GET NBA PLAYERS =====
  getPlayers: (req, res) => {
    console.log('[NBA Controller] Getting players list');
    
    const players = [
      { id: 1, name: 'LeBron James', team: 'LAL', position: 'SF', points: 27.8, rebounds: 8.2, assists: 8.5 },
      { id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 28.5, rebounds: 4.9, assists: 6.3 },
      { id: 3, name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 29.1, rebounds: 7.2, assists: 5.8 },
      { id: 4, name: 'Nikola Jokic', team: 'DEN', position: 'C', points: 26.3, rebounds: 12.1, assists: 9.0 },
      { id: 5, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4, rebounds: 11.5, assists: 6.5 },
      { id: 6, name: 'Luka Doncic', team: 'DAL', position: 'PG', points: 33.2, rebounds: 8.6, assists: 9.1 },
      { id: 7, name: 'Jayson Tatum', team: 'BOS', position: 'SF', points: 27.5, rebounds: 8.8, assists: 4.6 },
      { id: 8, name: 'Joel Embiid', team: 'PHI', position: 'C', points: 34.8, rebounds: 11.7, assists: 5.9 }
    ];
    
    res.json({
      success: true,
      data: players,
      count: players.length
    });
  },

  // ===== GET NBA BETTING ODDS =====
  getOdds: (req, res) => {
    console.log('[NBA Controller] Getting betting odds');
    
    const odds = {
      games: [
        {
          id: 1,
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: 'Tonight 7:30 PM',
          moneyline: { home: -150, away: +130 },
          spread: { home: -3.5, away: +3.5 },
          total: { points: 225.5 }
        },
        {
          id: 2,
          home_team: 'Celtics',
          away_team: 'Heat',
          date: 'Tonight 8:00 PM',
          moneyline: { home: -180, away: +155 },
          spread: { home: -4.5, away: +4.5 },
          total: { points: 218.5 }
        },
        {
          id: 3,
          home_team: 'Nuggets',
          away_team: 'Suns',
          date: 'Tonight 10:00 PM',
          moneyline: { home: -200, away: +170 },
          spread: { home: -5.5, away: +5.5 },
          total: { points: 230.5 }
        }
      ],
      player_props: [
        { player: 'LeBron James', stat: 'Points', line: 27.5, over: -110, under: -110 },
        { player: 'Stephen Curry', stat: '3-Pointers', line: 4.5, over: -115, under: -105 },
        { player: 'Nikola Jokic', stat: 'Assists', line: 8.5, over: -120, under: +100 },
        { player: 'Kevin Durant', stat: 'Points', line: 28.5, over: -115, under: -105 }
      ],
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: odds,
      source: 'Sample Data'
    });
  },

  // ===== GET NBA FANTASY ADVICE =====
  getFantasyAdvice: (req, res) => {
    console.log('[NBA Controller] Getting fantasy advice');
    
    const advice = {
      must_starts: [
        { player: 'LeBron James', reason: 'High usage with Davis out', projection: '55+ fantasy points' },
        { player: 'Nikola Jokic', reason: 'Triple-double threat every night', projection: '65+ fantasy points' },
        { player: 'Luka Doncic', reason: 'High usage rate, fills stat sheet', projection: '60+ fantasy points' }
      ],
      sleepers: [
        { player: 'Austin Reaves', reason: 'Increased minutes, good matchup', projection: '35+ fantasy points' },
        { player: 'Jalen Williams', reason: 'Hot streak, high efficiency', projection: '40+ fantasy points' },
        { player: 'Cameron Johnson', reason: 'Starting role, 3-point upside', projection: '30+ fantasy points' }
      ],
      busts: [
        { player: 'Jordan Poole', reason: 'Inconsistent shooting, turnovers', projection: 'Under 25 fantasy points' },
        { player: 'Ben Simmons', reason: 'Limited offensive role', projection: 'Under 30 fantasy points' },
        { player: 'Draymond Green', reason: 'Limited scoring upside', projection: 'Under 28 fantasy points' }
      ],
      generated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: advice
    });
  },

  // ===== SEARCH PLAYERS =====
  searchPlayers: (req, res) => {
    const query = req.query.q || '';
    console.log(`[NBA Controller] Searching players for: ${query}`);
    
    const allPlayers = [
      { id: 1, name: 'LeBron James', team: 'LAL', position: 'SF', points: 27.8 },
      { id: 2, name: 'Stephen Curry', team: 'GSW', position: 'PG', points: 28.5 },
      { id: 3, name: 'Kevin Durant', team: 'PHX', position: 'SF', points: 29.1 },
      { id: 4, name: 'Nikola Jokic', team: 'DEN', position: 'C', points: 26.3 },
      { id: 5, name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', points: 30.4 },
      { id: 6, name: 'Luka Doncic', team: 'DAL', position: 'PG', points: 33.2 },
      { id: 7, name: 'Jayson Tatum', team: 'BOS', position: 'SF', points: 27.5 },
      { id: 8, name: 'Joel Embiid', team: 'PHI', position: 'C', points: 34.8 }
    ];
    
    const results = query 
      ? allPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : allPlayers;
    
    res.json({
      success: true,
      data: results,
      query: query,
      count: results.length
    });
  },

  // ===== GET SINGLE PLAYER =====
  getPlayer: (req, res) => {
    const playerName = req.params.playerName;
    console.log(`[NBA Controller] Getting player: ${playerName}`);
    
    // Mock player data based on name
    const playerData = {
      'LeBron James': {
        name: 'LeBron James',
        team: 'LAL',
        position: 'SF',
        age: 39,
        stats: {
          points: 27.8,
          rebounds: 8.2,
          assists: 8.5,
          steals: 1.3,
          blocks: 0.8,
          fg_percentage: 52.3,
          three_point_percentage: 39.5,
          ft_percentage: 76.8
        },
        fantasy_points: 58.7,
        injury_status: 'Healthy',
        next_game: 'vs Warriors, Tonight 7:30 PM'
      },
      'Stephen Curry': {
        name: 'Stephen Curry',
        team: 'GSW',
        position: 'PG',
        age: 36,
        stats: {
          points: 28.5,
          rebounds: 4.9,
          assists: 6.3,
          steals: 1.2,
          blocks: 0.4,
          fg_percentage: 47.5,
          three_point_percentage: 42.7,
          ft_percentage: 91.5
        },
        fantasy_points: 52.3,
        injury_status: 'Healthy',
        next_game: '@ Lakers, Tonight 7:30 PM'
      },
      'default': {
        name: playerName,
        team: 'Unknown',
        position: 'Unknown',
        age: 28,
        stats: {
          points: 20.0,
          rebounds: 5.0,
          assists: 5.0,
          steals: 1.0,
          blocks: 0.5,
          fg_percentage: 45.0,
          three_point_percentage: 35.0,
          ft_percentage: 75.0
        },
        fantasy_points: 40.0,
        injury_status: 'Healthy',
        next_game: 'No game scheduled'
      }
    };
    
    const player = playerData[playerName] || playerData.default;
    
    res.json({
      success: true,
      data: player
    });
  },

  // ===== GET API STATUS =====
  getApiStatus: async (req, res) => {
    try {
      const apiKey = process.env.SPORTSDATA_API_KEY;
      const today = new Date();
      const todayStr = formatDate(today);
      
      // Test the API
      let apiWorking = false;
      let message = 'API not configured';
      
      if (apiKey) {
        try {
          const response = await axios.get(
            `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${todayStr}`,
            { 
              headers: { 
                'Ocp-Apim-Subscription-Key': apiKey 
              },
              timeout: 3000
            }
          );
          
          apiWorking = response.status === 200;
          message = apiWorking ? 'API is working' : `API returned status ${response.status}`;
        } catch (apiError) {
          message = `API error: ${apiError.message}`;
        }
      }
      
      res.json({
        success: true,
        api_configured: !!apiKey,
        api_working: apiWorking,
        message: message,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = nbaController;
