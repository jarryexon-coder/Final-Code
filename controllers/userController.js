const User = require('../models/User');
const Prediction = require('../models/Prediction');

const userController = {
  // Get user's prediction accuracy
  getUserAccuracy: async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`Looking up user with ID/Email: ${userId}`);
      
      let user;
      // Check if it looks like an ObjectId (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        user = await User.findById(userId);
      } else {
        // Treat as email or other identifier
        user = await User.findOne({ email: userId });
      }
      
      if (!user) {
        // Try creating a test user if none exists
        console.log('User not found, creating test user...');
        user = await User.create({
          email: 'test@example.com',
          name: 'Test User',
          predictionStats: { total: 10, correct: 7, accuracy: 70 }
        });
      }
      
      // Calculate accuracy
      const accuracy = user.predictionStats.total > 0 
        ? (user.predictionStats.correct / user.predictionStats.total) * 100 
        : 0;
      
      res.json({
        success: true,
        data: {
          userId: user._id,
          email: user.email,
          name: user.name,
          totalPredictions: user.predictionStats.total,
          correctPredictions: user.predictionStats.correct,
          accuracy: accuracy.toFixed(1) + '%',
          subscriptionTier: user.subscriptionTier
        }
      });
    } catch (error) {
      console.error('Error getting user accuracy:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  },
  
  // Get personalized picks based on user's history
  getPersonalizedPicks: async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`Getting personalized picks for: ${userId}`);
      
      // Try to find user by ID or email
      let user;
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: userId });
      }
      
      if (!user) {
        // Return default recommendations
        return res.json({
          success: true,
          data: {
            recommendedSport: 'NBA',
            confidence: 75,
            message: 'Try NBA predictions to get started!',
            reason: 'Default recommendation for new users'
          }
        });
      }
      
      // Get user's predictions
      const userPredictions = await Prediction.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(50);
      
      // Simple recommendation logic
      const sportSuccess = {};
      userPredictions.forEach(p => {
        if (p.outcome === true) {
          sportSuccess[p.sport] = (sportSuccess[p.sport] || 0) + 1;
        }
      });
      
      const recommendedSport = Object.keys(sportSuccess).length > 0
        ? Object.keys(sportSuccess).reduce((a, b) => sportSuccess[a] > sportSuccess[b] ? a : b)
        : 'NBA'; // Default to NBA
      
      res.json({
        success: true,
        data: {
          userId: user._id,
          recommendedSport,
          confidence: sportSuccess[recommendedSport] || 75,
          message: `Based on your history, try ${recommendedSport} predictions`
        }
      });
    } catch (error) {
      console.error('Error getting personalized picks:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
};

module.exports = userController;
