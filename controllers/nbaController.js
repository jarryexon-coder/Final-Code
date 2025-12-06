// NBA Controller - Handles NBA-related API logic
const nbaController = {
  // ===== GET ALL NBA GAMES =====
  getGames: (req, res) => {
    console.log('[NBA Controller] Getting all games');
    
    const games = [
      {
        id: 1,
        home_team: 'Los Angeles Lakers',
        away_team: 'Golden State Warriors',
        time: '7:30 PM ET',
        channel: 'TNT',
        home_score: 112,
        away_score: 108,
        status: 'Final',
        date: new Date().toISOString().split('T')[0]
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
        date: new Date().toISOString().split('T')[0]
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
        date: new Date().toISOString().split('T')[0]
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
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
      }
    ];
    
    res.json({
      success: true,
      data: games,
      count: games.length,
      timestamp: new Date().toISOString()
    });
  },

  // ===== GET TODAY'S NBA GAMES =====
  getTodayGames: (req, res) => {
    console.log('[NBA Controller] Getting today\'s games');
    
    const today = new Date().toISOString().split('T')[0];
    const games = [
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
      }
    ];
    
    res.json({
      success: true,
      data: games,
      timestamp: new Date().toISOString()
    });
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
  }
};

module.exports = nbaController;
