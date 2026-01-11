// test-db.js - ES Module version
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    return;
  }
  
  // Mask password in logs
  const maskedUri = uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)/, 'mongodb+srv://$1:****');
  console.log('Testing connection to:', maskedUri);

  try {
    await mongoose.connect(uri, { 
      serverSelectionTimeoutMS: 5000 
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // List available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections found:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.log('\n🔧 Quick checks:');
    console.log('1. Password correct? (Check .env file)');
    console.log('2. Network access in Atlas? (Add 0.0.0.0/0 temporarily)');
    console.log('3. User "jarryexon_db_user" exists?');
  }
}

// Run the test
testConnection();
