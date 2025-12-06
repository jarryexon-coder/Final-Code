require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection test: PASSED');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database connection test: FAILED', error);
  }
}

testConnection();
