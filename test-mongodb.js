import mongoose from 'mongoose';

const uri = 'mongodb+srv://Jerryexon1:Bigyear1@cluster0.6sqqrz.mongodb.net/sports-app?appName=Cluster0';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testConnection();
