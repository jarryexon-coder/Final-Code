// NHL Controller
const nhlController = {
  getGames: (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          homeTeam: 'Colorado Avalanche',
          awayTeam: 'Tampa Bay Lightning',
          homeScore: 4,
          awayScore: 3,
          period: 'FINAL',
          time: '7:00 PM',
          status: 'final',
          spread: 'COL -1.5',
          total: '6.5',
        }
      ]
    });
  },

  getStats: (req, res) => {
    res.json({
      success: true,
      data: {
        topScorers: [
          { name: 'Connor McDavid', team: 'EDM', points: 120, goals: 48 }
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
          game: 'COL vs TB',
          prediction: 'Over 6.5 Goals',
          confidence: '82%'
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
          game: 'COL vs TB',
          homeOdds: '-145',
          awayOdds: '+125'
        }
      ]
    });
  }
};

module.exports = nhlController;
