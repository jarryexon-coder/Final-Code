const mongoose = require('mongoose');
const User = require('./models/User');
const Prediction = require('./models/Prediction');

async function createTestData() {
  try {
    console.log('🔧 Checking for test data...');
    
    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (!existingUser) {
      // Create test user
      const testUser = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        predictionStats: {
          total: 15,
          correct: 11,
          accuracy: 73.3
        }
      });
      
      console.log('✅ Test user created:', testUser.email);
      
      // Create some test predictions
      const predictions = [
        { userId: testUser._id, sport: 'NBA', prediction: 'Lakers to win', confidence: 78, outcome: true },
        { userId: testUser._id, sport: 'NFL', prediction: 'Chiefs to win', confidence: 65, outcome: true },
        { userId: testUser._id, sport: 'NBA', prediction: 'Over 220 points', confidence: 72, outcome: false },
        { userId: testUser._id, sport: 'NHL', prediction: 'Avalanche to win', confidence: 81, outcome: true },
      ];
      
      await Prediction.insertMany(predictions);
      console.log('✅ Test predictions created');
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

module.exports = createTestData;
