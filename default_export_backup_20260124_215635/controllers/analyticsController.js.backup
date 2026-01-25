// controllers/analyticsController.js

const analyticsController = {
  getAnalytics: (req, res) => {
    // Get the time range from query parameter, default to '7d'
    const timeRange = req.query.range || '7d';
    
    // Mock analytics data (replace with real data later)
    const analyticsData = {
      success: true,
      range: timeRange,
      data: {
        activeUsers: timeRange === '7d' ? 1250 : 5400,
        totalPredictions: timeRange === '7d' ? 8900 : 45000,
        accuracyRate: '72.5%',
        topSports: [
          { sport: 'NBA', predictions: 4500, accuracy: '75%' },
          { sport: 'NFL', predictions: 2800, accuracy: '68%' },
          { sport: 'NHL', predictions: 1600, accuracy: '71%' }
        ],
        userEngagement: {
          dailyActiveUsers: 420,
          weeklyActiveUsers: 1250,
          monthlyActiveUsers: 5400
        }
      }
    };
    
    console.log(`[Analytics] Request for range: ${timeRange}`);
    res.json(analyticsData);
  }
};

module.exports = analyticsController;
