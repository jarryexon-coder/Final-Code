import RealDataService from '../services/realDataService.js';
import Game from '../models/Game.js';
import Standing from '../models/Standing.js';

const realDataService = new RealDataService();

const nhlController = {
  getGames: async (req, res) => {
    try {
      console.log('🏒 Fetching NHL games');
      const { date } = req.query;
      
      // Try real-time data first
      const gamesData = await realDataService.getNHLGames(date ? new Date(date) : new Date());
      
      if (gamesData && gamesData.success) {
        // Cache successful results in database
        try {
          await Game.bulkWrite(
            gamesData.games.map(game => ({
              updateOne: {
                filter: { id: game.id, sport: 'NHL' },
                update: { 
                  $set: { 
                    ...game, 
                    sport: 'NHL', 
                    lastSynced: new Date() 
                  } 
                },
                upsert: true
              }
            }))
          );
        } catch (cacheError) {
          console.log('Failed to cache NHL games:', cacheError.message);
        }
        
        res.json({
          ...gamesData,
          source: 'realtime_api',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Real-time data unavailable');
      }
    } catch (error) {
      console.error('NHL games error:', error);
      
      // Fallback to database
      try {
        const searchDate = req.query.date ? new Date(req.query.date) : new Date();
        searchDate.setHours(0, 0, 0, 0);
        const endDate = new Date(searchDate);
        endDate.setHours(23, 59, 59, 999);
        
        const games = await Game.find({ 
          sport: 'NHL',
          date: { 
            $gte: searchDate,
            $lte: endDate
          }
        }).sort({ date: 1, time: 1 });
        
        if (games.length > 0) {
          res.json({
            success: true,
            games: games.map(g => ({
              id: g.id || g._id,
              homeTeam: g.homeTeam || { name: g.home, abbreviation: g.homeAbbrev },
              awayTeam: g.awayTeam || { name: g.away, abbreviation: g.awayAbbrev },
              homeScore: g.homeScore,
              awayScore: g.awayScore,
              period: g.period,
              time: g.time,
              status: g.status,
              date: g.date,
              location: g.location,
              broadcast: g.broadcast
            })),
            count: games.length,
            source: 'database_fallback',
            timestamp: new Date().toISOString()
          });
        } else {
          // No database entries, use mock data
          console.log('No database entries, using mock NHL games');
          const mockGames = await nhlController.getGamesInternal();
          res.json({
            success: true,
            games: mockGames,
            count: mockGames.length,
            source: 'mock_fallback',
            timestamp: new Date().toISOString(),
            note: 'Using mock data due to missing real-time and database sources'
          });
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        
        // Ultimate fallback: mock data
        const mockGames = await nhlController.getGamesInternal();
        res.json({
          success: true,
          games: mockGames,
          count: mockGames.length,
          source: 'mock_fallback',
          timestamp: new Date().toISOString(),
          note: 'Using mock data due to system errors'
        });
      }
    }
  },

  getGamesInternal: async () => {
    // Mock NHL games - In a real app, fetch from NHL API or database
    return [
      { 
        id: 1, 
        homeTeam: { name: 'Toronto Maple Leafs', abbreviation: 'TOR' }, 
        awayTeam: { name: 'Boston Bruins', abbreviation: 'BOS' }, 
        homeScore: 3, 
        awayScore: 2, 
        period: '3rd', 
        time: '12:45', 
        status: 'live',
        date: new Date().toISOString(),
        location: 'Scotiabank Arena',
        broadcast: 'ESPN'
      },
      { 
        id: 2, 
        homeTeam: { name: 'New York Rangers', abbreviation: 'NYR' }, 
        awayTeam: { name: 'New Jersey Devils', abbreviation: 'NJD' }, 
        homeScore: 4, 
        awayScore: 1, 
        period: 'FINAL', 
        status: 'final',
        date: new Date().toISOString(),
        location: 'Madison Square Garden',
        broadcast: 'MSG'
      },
      { 
        id: 3, 
        homeTeam: { name: 'Colorado Avalanche', abbreviation: 'COL' }, 
        awayTeam: { name: 'Edmonton Oilers', abbreviation: 'EDM' }, 
        homeScore: 2, 
        awayScore: 2, 
        period: '2nd', 
        time: '8:30', 
        status: 'live',
        date: new Date().toISOString(),
        location: 'Ball Arena',
        broadcast: 'ALT'
      },
    ];
  },

  getStats: async (req, res) => {
    try {
      console.log('📊 Fetching NHL stats');
      
      // Try real-time data first
      try {
        const realStats = await realDataService.getNHLStats();
        if (realStats && realStats.success) {
          res.json({
            ...realStats,
            source: 'realtime_api',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.log('Real-time stats API failed:', apiError.message);
      }
      
      // Fallback to database/mock data
      const stats = {
        topScorers: [
          { name: 'Nathan MacKinnon', team: 'COL', goals: 31, assists: 55, points: 86 },
          { name: 'Nikita Kucherov', team: 'TB', goals: 28, assists: 53, points: 81 },
          { name: 'Connor McDavid', team: 'EDM', goals: 20, assists: 60, points: 80 },
          { name: 'David Pastrnak', team: 'BOS', goals: 35, assists: 42, points: 77 },
          { name: 'Auston Matthews', team: 'TOR', goals: 45, assists: 28, points: 73 }
        ],
        topGoalies: [
          { name: 'Connor Hellebuyck', team: 'WPG', wins: 28, gaa: 2.39, savePct: .920 },
          { name: 'Igor Shesterkin', team: 'NYR', wins: 25, gaa: 2.58, savePct: .913 },
          { name: 'Jeremy Swayman', team: 'BOS', wins: 22, gaa: 2.42, savePct: .918 }
        ],
        teamStats: {
          topPowerPlay: 'Edmonton Oilers (29.5%)',
          topPenaltyKill: 'Boston Bruins (86.7%)',
          mostGoalsFor: 'Colorado Avalanche (3.8/game)',
          fewestGoalsAgainst: 'Florida Panthers (2.6/game)'
        },
        updated: new Date().toISOString()
      };
      
      res.json({ 
        success: true, 
        ...stats,
        source: 'mock_data',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in NHL getStats:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        source: 'error',
        timestamp: new Date().toISOString()
      });
    }
  },

  getStandings: async (req, res) => {
    try {
      console.log('📈 Fetching NHL standings');
      
      // Try real-time data first
      const standingsData = await realDataService.getNHLStandings();
      
      if (standingsData && standingsData.success) {
        // Cache successful results in database
        try {
          await Standing.bulkWrite(
            standingsData.standings.map(team => ({
              updateOne: {
                filter: { teamId: team.id, sport: 'NHL' },
                update: { 
                  $set: { 
                    ...team, 
                    sport: 'NHL', 
                    lastSynced: new Date() 
                  } 
                },
                upsert: true
              }
            }))
          );
        } catch (cacheError) {
          console.log('Failed to cache NHL standings:', cacheError.message);
        }
        
        res.json({
          ...standingsData,
          source: 'realtime_api',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Real-time standings unavailable');
      }
    } catch (error) {
      console.error('NHL standings error:', error);
      
      // Fallback to database
      try {
        const standings = await Standing.find({ sport: 'NHL' })
          .sort({ 'record.winPercentage': -1 });
        
        if (standings.length > 0) {
          res.json({
            success: true,
            standings: standings.map(s => ({
              team: s.team,
              teamId: s.teamId,
              wins: s.wins || s.record?.wins || 0,
              losses: s.losses || s.record?.losses || 0,
              otLosses: s.otLosses || s.record?.otLosses || 0,
              points: s.points || 0,
              gamesPlayed: s.gamesPlayed || (s.wins || 0) + (s.losses || 0) + (s.otLosses || 0),
              winPercentage: s.winPercentage || 0
            })),
            count: standings.length,
            source: 'database_fallback',
            timestamp: new Date().toISOString()
          });
        } else {
          // Generate mock standings
          console.log('No database entries, using mock NHL standings');
          const mockStandings = generateMockNHLStandings();
          res.json({
            success: true,
            standings: mockStandings,
            count: mockStandings.length,
            source: 'mock_fallback',
            timestamp: new Date().toISOString(),
            note: 'Using mock data due to missing real-time and database sources'
          });
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        
        // Ultimate fallback: mock standings
        const mockStandings = generateMockNHLStandings();
        res.json({
          success: true,
          standings: mockStandings,
          count: mockStandings.length,
          source: 'mock_fallback',
          timestamp: new Date().toISOString(),
          note: 'Using mock data due to system errors'
        });
      }
    }
  },

  getPredictions: async (req, res) => {
    try {
      console.log('🎯 Fetching NHL predictions');
      
      // Try real-time predictions
      try {
        const realPredictions = await realDataService.getSportsPredictions('NHL');
        if (realPredictions && realPredictions.success) {
          res.json({
            ...realPredictions,
            source: 'realtime_api',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.log('Real-time predictions API failed:', apiError.message);
      }
      
      // Fallback to mock predictions
      res.json({ 
        success: true, 
        predictions: [
          { 
            game: 'Maple Leafs vs Bruins', 
            prediction: 'Over 5.5 goals', 
            confidence: 68,
            reasoning: 'Both teams rank in top 5 for goals per game, weak goaltending matchups',
            edge: '+3.2%'
          },
          { 
            game: 'Avalanche vs Oilers', 
            prediction: 'Oilers ML', 
            confidence: 55,
            reasoning: 'McDavid & Draisaitl against Avalanche\'s struggling defense',
            edge: '+1.8%'
          },
          { 
            game: 'Rangers vs Devils', 
            prediction: 'Under 6 goals', 
            confidence: 72,
            reasoning: 'Strong defensive systems, elite goaltending',
            edge: '+4.1%'
          }
        ],
        sport: 'NHL',
        source: 'mock_data',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in NHL getPredictions:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        source: 'error',
        timestamp: new Date().toISOString()
      });
    }
  },

  getOdds: async (req, res) => {
    try {
      console.log('💰 Fetching NHL odds');
      
      // Try real-time odds
      try {
        const realOdds = await realDataService.getNHLOdds();
        if (realOdds && realOdds.success) {
          res.json({
            ...realOdds,
            source: 'realtime_api',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.log('Real-time odds API failed:', apiError.message);
      }
      
      // Fallback to mock odds
      res.json({
        success: true,
        odds: [
          { 
            game: 'Maple Leafs vs Bruins', 
            moneyline: 'TOR +120 / BOS -140', 
            puckline: 'BOS -1.5 (+160) / TOR +1.5 (-190)', 
            total: 'O 5.5 (-110) / U 5.5 (-110)',
            bookmakers: ['DraftKings', 'FanDuel', 'BetMGM']
          },
          { 
            game: 'Avalanche vs Oilers', 
            moneyline: 'COL -140 / EDM +120', 
            puckline: 'COL -1.5 (+180) / EDM +1.5 (-220)', 
            total: 'U 6.5 (-110) / O 6.5 (-110)',
            bookmakers: ['DraftKings', 'FanDuel']
          },
          { 
            game: 'Rangers vs Devils', 
            moneyline: 'NYR -130 / NJD +110', 
            puckline: 'NYR -1.5 (+150) / NJD +1.5 (-170)', 
            total: 'U 6 (-115) / O 6 (-105)',
            bookmakers: ['DraftKings', 'BetMGM']
          }
        ],
        sport: 'NHL',
        source: 'mock_data',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in NHL getOdds:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        source: 'error',
        timestamp: new Date().toISOString()
      });
    }
  },

  getPlayerStats: async (req, res) => {
    try {
      const { playerId } = req.params;
      console.log(`📊 Fetching NHL player stats for: ${playerId}`);
      
      // Try real-time player stats
      try {
        const realPlayerStats = await realDataService.getNHLPlayerStats(playerId);
        if (realPlayerStats && realPlayerStats.success) {
          res.json({
            ...realPlayerStats,
            source: 'realtime_api',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.log('Real-time player stats API failed:', apiError.message);
      }
      
      // Fallback to mock player stats
      const playerStats = getMockNHLPlayerStats(playerId);
      if (playerStats) {
        res.json({
          success: true,
          player: playerStats,
          source: 'mock_data',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Player not found',
          source: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in NHL getPlayerStats:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        source: 'error',
        timestamp: new Date().toISOString()
      });
    }
  },

  getTeamSchedule: async (req, res) => {
    try {
      const { teamId } = req.params;
      console.log(`📅 Fetching NHL schedule for team: ${teamId}`);
      
      // Try real-time schedule
      try {
        const realSchedule = await realDataService.getNHLTeamSchedule(teamId);
        if (realSchedule && realSchedule.success) {
          res.json({
            ...realSchedule,
            source: 'realtime_api',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.log('Real-time schedule API failed:', apiError.message);
      }
      
      // Fallback to database
      try {
        const teamSchedule = await Game.find({ 
          sport: 'NHL',
          $or: [
            { 'homeTeam.id': teamId },
            { 'awayTeam.id': teamId }
          ]
        }).sort({ date: 1 });
        
        if (teamSchedule.length > 0) {
          res.json({
            success: true,
            teamId,
            schedule: teamSchedule,
            count: teamSchedule.length,
            source: 'database_fallback',
            timestamp: new Date().toISOString()
          });
        } else {
          // Generate mock schedule
          const mockSchedule = generateMockNHLSchedule(teamId);
          res.json({
            success: true,
            teamId,
            schedule: mockSchedule,
            count: mockSchedule.length,
            source: 'mock_fallback',
            timestamp: new Date().toISOString(),
            note: 'Using mock schedule data'
          });
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        
        // Ultimate fallback: mock schedule
        const mockSchedule = generateMockNHLSchedule(teamId);
        res.json({
          success: true,
          teamId,
          schedule: mockSchedule,
          count: mockSchedule.length,
          source: 'mock_fallback',
          timestamp: new Date().toISOString(),
          note: 'Using mock data due to system errors'
        });
      }
    } catch (error) {
      console.error('Error in NHL getTeamSchedule:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        source: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Helper functions for mock data generation

function generateMockNHLStandings() {
  const teams = [
    { team: 'Boston Bruins', wins: 38, losses: 14, otLosses: 8, points: 84, winPercentage: 0.700 },
    { team: 'Florida Panthers', wins: 36, losses: 15, otLosses: 9, points: 81, winPercentage: 0.675 },
    { team: 'New York Rangers', wins: 37, losses: 16, otLosses: 7, points: 81, winPercentage: 0.675 },
    { team: 'Toronto Maple Leafs', wins: 35, losses: 17, otLosses: 8, points: 78, winPercentage: 0.650 },
    { team: 'Colorado Avalanche', wins: 36, losses: 19, otLosses: 5, points: 77, winPercentage: 0.642 },
    { team: 'Edmonton Oilers', wins: 34, losses: 18, otLosses: 8, points: 76, winPercentage: 0.633 },
    { team: 'Vancouver Canucks', wins: 33, losses: 20, otLosses: 7, points: 73, winPercentage: 0.608 },
    { team: 'Winnipeg Jets', wins: 32, losses: 21, otLosses: 7, points: 71, winPercentage: 0.592 }
  ];
  
  return teams.map((team, index) => ({
    ...team,
    rank: index + 1,
    gamesPlayed: team.wins + team.losses + team.otLosses,
    goalsFor: Math.floor(Math.random() * 50) + 180,
    goalsAgainst: Math.floor(Math.random() * 50) + 130,
    streak: ['W3', 'L1', 'W2', 'W1'][index % 4]
  }));
}

function getMockNHLPlayerStats(playerId) {
  const players = {
    'connor-mcdavid': {
      name: 'Connor McDavid',
      team: 'EDM',
      position: 'C',
      gamesPlayed: 54,
      goals: 20,
      assists: 60,
      points: 80,
      plusMinus: +12,
      pim: 22,
      shots: 185,
      shotPct: 10.8,
      timeOnIce: '21:45',
      powerPlayPoints: 25,
      shortHandedPoints: 2,
      gameWinningGoals: 5,
      faceoffPct: 52.3
    },
    'nathan-mackinnon': {
      name: 'Nathan MacKinnon',
      team: 'COL',
      position: 'C',
      gamesPlayed: 56,
      goals: 31,
      assists: 55,
      points: 86,
      plusMinus: +18,
      pim: 34,
      shots: 210,
      shotPct: 14.8,
      timeOnIce: '22:30',
      powerPlayPoints: 28,
      shortHandedPoints: 1,
      gameWinningGoals: 7,
      faceoffPct: 48.9
    },
    'nikita-kucherov': {
      name: 'Nikita Kucherov',
      team: 'TB',
      position: 'RW',
      gamesPlayed: 55,
      goals: 28,
      assists: 53,
      points: 81,
      plusMinus: +8,
      pim: 18,
      shots: 195,
      shotPct: 14.4,
      timeOnIce: '21:15',
      powerPlayPoints: 30,
      shortHandedPoints: 0,
      gameWinningGoals: 6,
      faceoffPct: null
    }
  };
  
  return players[playerId] || players['connor-mcdavid'];
}

function generateMockNHLSchedule(teamId) {
  const teamMap = {
    'BOS': 'Boston Bruins',
    'TOR': 'Toronto Maple Leafs',
    'NYR': 'New York Rangers',
    'COL': 'Colorado Avalanche',
    'EDM': 'Edmonton Oilers'
  };
  
  const teamName = teamMap[teamId] || 'Boston Bruins';
  const opponents = ['Toronto Maple Leafs', 'New York Rangers', 'Colorado Avalanche', 'Edmonton Oilers', 'Florida Panthers'];
  
  return opponents.map((opponent, index) => {
    const date = new Date();
    date.setDate(date.getDate() + (index * 2));
    
    return {
      id: `game_${teamId}_${index}`,
      homeTeam: index % 2 === 0 ? { name: teamName, id: teamId } : { name: opponent, id: opponent.substring(0, 3).toUpperCase() },
      awayTeam: index % 2 === 0 ? { name: opponent, id: opponent.substring(0, 3).toUpperCase() } : { name: teamName, id: teamId },
      date: date.toISOString(),
      time: '7:00 PM',
      location: index % 2 === 0 ? `${teamName} Arena` : `${opponent} Arena`,
      broadcast: ['ESPN', 'MSG', 'ALT', 'SN'][index % 4],
      status: index < 2 ? 'Final' : 'Scheduled',
      homeScore: index < 2 ? Math.floor(Math.random() * 4) + 2 : null,
      awayScore: index < 2 ? Math.floor(Math.random() * 3) + 1 : null
    };
  });
}

export default nhlController;
