import mongoose from 'mongoose';

const testCases = [
  {
    name: "Original (from working logs)",
    uri: "mongodb+srv://jarryexon@gmail.com:Bigyear26!@cluster0.6sqqrz.mongodb.net/?retryWrites=true&w=majority"
  },
  {
    name: "With sports-app database",
    uri: "mongodb+srv://jarryexon@gmail.com:Bigyear26!@cluster0.6sqqrz.mongodb.net/sports-app?retryWrites=true&w=majority"
  },
  {
    name: "URL-encoded password",
    uri: "mongodb+srv://jarryexon@gmail.com:Bigyear26%21@cluster0.6sqqrz.mongodb.net/sports-app?retryWrites=true&w=majority"
  },
  {
    name: "Without email",
    uri: "mongodb+srv://jarryexon:Bigyear26!@cluster0.6sqqrz.mongodb.net/sports-app?retryWrites=true&w=majority"
  }
];

async function testConnection(name, uri) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URI: ${uri.split('@')[0]}****@${uri.split('@')[1]?.split('/')[0]}`);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    });
    
    console.log(`   ✅ SUCCESS: Connected to MongoDB Atlas`);
    
    const db = mongoose.connection.db;
    console.log(`   Database: ${db.databaseName}`);
    
    const collections = await db.listCollections().toArray();
    console.log(`   Collections: ${collections.length} found`);
    
    await mongoose.disconnect();
    return { success: true, uri };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Testing all MongoDB Atlas connections...\n');
  
  for (const testCase of testCases) {
    const result = await testConnection(testCase.name, testCase.uri);
    if (result.success) {
      console.log(`\n🎉 Found working connection: ${testCase.name}`);
      console.log(`Use this URI in your .env file:`);
      console.log(`MONGODB_URI=${testCase.uri}`);
      return testCase.uri;
    }
  }
  
  console.log('\n⚠️ No connections worked. Please:');
  console.log('1. Check your Atlas username/password');
  console.log('2. Verify IP whitelisting in Atlas');
  console.log('3. Try creating a new database user in Atlas');
  return null;
}

runAllTests();
