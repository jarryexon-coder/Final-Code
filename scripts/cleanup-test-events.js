const mongoose = require('mongoose');

async function cleanupTestEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-fantasy');
    const db = mongoose.connection.db;
    
    console.log('🧹 Cleaning up test analytics events...\n');
    
    // Delete events with null screen_name or test data
    const result = await db.collection('analytics_events').deleteMany({
      $or: [
        { 'event_properties.screen_name': null },
        { 'event_properties.test': { $exists: true } },
        { user_id: /test_user|frontend_user/ },
        { event_name: null }
      ]
    });
    
    console.log(`✅ Deleted ${result.deletedCount} test/incorrect events`);
    
    // Add index for better performance
    await db.collection('analytics_events').createIndex({ timestamp: -1 });
    await db.collection('analytics_events').createIndex({ user_id: 1 });
    await db.collection('analytics_events').createIndex({ 'event_properties.screen_name': 1 });
    
    console.log('✅ Created indexes for better query performance');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

cleanupTestEvents();
