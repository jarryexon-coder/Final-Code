const nhlController = {
  getGames: async (req, res) => {
    try {
      const games = nhlController.getGamesInternal();
      res.json({ success: true, games });
    } catch (error) {
      console.error('Error in NHL getGames:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getGamesInternal: async () => {
    // In a real app, fetch from NHL API or database
    return [
      { id: 1, home: 'Toronto Maple Leafs', away: 'Boston Bruins', homeScore: 3, awayScore: 2, period: '3rd', time: '12:45', status: 'live' },
      { id: 2, home: 'New York Rangers', away: 'New Jersey Devils', homeScore: 4, awayScore: 1, period: 'FINAL', status: 'final' },
      { id: 3, home: 'Colorado Avalanche', away: 'Edmonton Oilers', homeScore: 2, awayScore: 2, period: '2nd', time: '8:30', status: 'live' },
    ];
  },

  getStats: async (req, res) => {
    try {
      const stats = {
        topScorers: [
          { name: 'Nathan MacKinnon', team: 'COL', goals: 31, assists: 55, points: 86 },
          { name: 'Nikita Kucherov', team: 'TB', goals: 28, assists: 53, points: 81 },
          { name: 'Connor McDavid', team: 'EDM', goals: 20, assists: 60, points: 80 },
        ]
      };
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getPredictions: async (req, res) => {
    res.json({ 
      success: true, 
      predictions: [
        { game: 'Maple Leafs vs Bruins', prediction: 'Over 5.5 goals', confidence: 68 },
        { game: 'Avalanche vs Oilers', prediction: 'Oilers ML', confidence: 55 }
      ]
    });
  },

  getOdds: async (req, res) => {
    res.json({
      success: true,
      odds: [
        { game: 'Maple Leafs vs Bruins', moneyline: 'TOR +120', puckline: 'BOS -1.5 (+160)', total: 'O 5.5 (-110)' },
        { game: 'Avalanche vs Oilers', moneyline: 'COL -140', puckline: 'COL -1.5 (+180)', total: 'U 6.5 (-110)' }
      ]
    });
  }
};

module.exports = nhlController;
