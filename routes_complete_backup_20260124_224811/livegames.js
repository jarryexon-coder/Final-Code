import express from 'express';
const router = express.Router();

console.log('🎮 Live games routes loaded');

router.get('/live', async (req, res) => {
  console.log('🎮 /api/games/live called');
  
  try {
    // Create realistic live games data
    const liveGames = {
      nba: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'LAL',
            name: 'Los Angeles Lakers',
            score: 108,
            color: '#552583',
            record: '35-30'
          },
          awayTeam: {
            abbreviation: 'GSW',
            name: 'Golden State Warriors',
            score: 105,
            color: '#1D428A',
            record: '33-30'
          },
          status: 'live',
          clock: '2:14',
          period: '4th Qtr',
          timeRemaining: '2:14',
          lastPlay: 'LeBron James makes 2pt driving layup',
          arena: 'Crypto.com Arena',
          attendance: '18997',
          broadcast: 'ESPN',
          gameId: 'nba-live-001',
          league: 'NBA',
          date: new Date().toISOString(),
          betting: {
            spread: 'GSW -4.5',
            overUnder: '225.5',
            moneylineHome: '+180',
            moneylineAway: '-220'
          }
        },
        {
          id: 2,
          homeTeam: {
            abbreviation: 'BOS',
            name: 'Boston Celtics',
            score: 95,
            color: '#007A33',
            record: '48-13'
          },
          awayTeam: {
            abbreviation: 'MIA',
            name: 'Miami Heat',
            score: 89,
            color: '#98002E',
            record: '35-29'
          },
          status: 'live',
          clock: '5:42',
          period: '3rd Qtr',
          timeRemaining: '5:42',
          lastPlay: 'Jayson Tatum makes 3pt jump shot',
          arena: 'TD Garden',
          attendance: '19156',
          broadcast: 'TNT',
          gameId: 'nba-live-002',
          league: 'NBA',
          date: new Date().toISOString(),
          betting: {
            spread: 'BOS -8.5',
            overUnder: '218.5',
            moneylineHome: '-350',
            moneylineAway: '+280'
          }
        }
      ],
      nhl: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'BOS',
            name: 'Boston Bruins',
            score: 3,
            color: '#FFB81C',
            record: '38-14-14'
          },
          awayTeam: {
            abbreviation: 'TOR',
            name: 'Toronto Maple Leafs',
            score: 2,
            color: '#00205B',
            record: '37-19-8'
          },
          status: 'live',
          clock: '10:45',
          period: '3rd',
          timeRemaining: '10:45',
          lastPlay: 'Pastrnak scores (3-2)',
          arena: 'TD Garden',
          attendance: '17565',
          broadcast: 'ESPN+',
          gameId: 'nhl-live-001',
          league: 'NHL',
          date: new Date().toISOString(),
          shotsOnGoal: {
            home: 28,
            away: 24
          },
          powerPlay: {
            home: '1/3',
            away: '0/2'
          }
        }
      ],
      nfl: [
        {
          id: 1,
          homeTeam: {
            abbreviation: 'KC',
            name: 'Kansas City Chiefs',
            score: 24,
            color: '#E31837',
            record: '11-6'
          },
          awayTeam: {
            abbreviation: 'SF',
            name: 'San Francisco 49ers',
            score: 21,
            color: '#AA0000',
            record: '12-5'
          },
          status: 'live',
          clock: '4:30',
          period: '4th',
          quarter: '4th',
          timeRemaining: '4:30',
          lastPlay: 'Mahomes pass complete to Kelce for 8 yards',
          arena: 'Arrowhead Stadium',
          attendance: '76416',
          broadcast: 'FOX',
          gameId: 'nfl-live-001',
          league: 'NFL',
          date: new Date().toISOString(),
          downDistance: '3rd & 2',
          possession: 'KC',
          yardLine: 'SF 42'
        }
      ],
      updated: new Date().toISOString(),
      totalLiveGames: 4
    };
    
    // Count total games
    const totalGames = liveGames.nba.length + liveGames.nhl.length + liveGames.nfl.length;
    
    res.json({
      success: true,
      data: liveGames,
      count: totalGames,
      breakdown: {
        nba: liveGames.nba.length,
        nhl: liveGames.nhl.length,
        nfl: liveGames.nfl.length
      },
      timestamp: new Date().toISOString(),
      note: 'mock-data-for-development'
    });
    
  } catch (error) {
    console.error('Error in /api/games/live:', error);
    
    // Even on error, return structured response to prevent frontend crashes
    res.json({
      success: true,
      data: {
        nba: [],
        nhl: [],
        nfl: [],
        updated: new Date().toISOString(),
        totalLiveGames: 0
      },
      count: 0,
      timestamp: new Date().toISOString(),
      note: 'error-recovery-mode'
    });
  }
});

export default router;
