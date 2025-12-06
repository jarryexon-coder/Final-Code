// NFL Controller
const nflController = {
  getGames: (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          homeTeam: 'Kansas City Chiefs',
          awayTeam: 'Philadelphia Eagles',
          homeScore: 31,
          awayScore: 28,
          quarter: 'FINAL',
          time: '4:25 PM',
          status: 'final',
          spread: 'KC -2.5',
          total: '52.5',
        }
      ]
    });
  },

  getStats: (req, res) => {
    res.json({
      success: true,
      data: {
        topPassers: [
          { name: 'Patrick Mahomes', team: 'KC', yards: 4250, tds: 35, int: 12 }
        ]
      }
    });
  },

  getPredictions: (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          game: 'KC vs PHI',
          prediction: 'KC to win',
          confidence: '78%'
        }
      ]
    });
  },

  getOdds: (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          book: 'DraftKings',
          game: 'KC vs PHI',
          homeOdds: '-135',
          awayOdds: '+115'
        }
      ]
    });
  }
};

module.exports = nflController;
