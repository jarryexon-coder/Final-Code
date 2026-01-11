// Save as: test-connection-only.js
import mongoose from 'mongoose';
import 'dotenv/config'; // This loads your .env file

console.log('🔍 Testing MongoDB Atlas Connection from Node.js');
console.log('==============================================');

// Get the URI from environment (same as your backend uses)
const uri = process.env.MONGODB_URI;
console.log('URI from process.env (password hidden):');
console.log(uri ? uri.replace(/:[^:]*@/, ':****@') : 'MONGODB_URI is undefined!');

if (!uri) {
  console.error('❌ ERROR: MONGODB_URI is not defined in the environment.');
  console.error('   Make sure your .env file is in the correct directory and contains MONGODB_URI=...');
  process.exit(1);
}

console.log('\nAttempting to connect...');

try {
  // Try to connect with a short timeout for quick feedback
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,
  });
  
  console.log('✅ SUCCESS! Connected to MongoDB Atlas from Node.js.');
  console.log(`   Database: ${mongoose.connection.db.databaseName}`);
  
  // Try a simple operation to confirm we can read/write
  const testDoc = { test: 'connection', timestamp: new Date() };
  const result = await mongoose.connection.db.collection('connection_test').insertOne(testDoc);
  console.log(`   Write test successful. Inserted ID: ${result.insertedId}`);
  
  await mongoose.disconnect();
  console.log('\n🎉 Conclusion: Your connection string WORKS in Node.js.');
  console.log('   The problem is likely in your server.js configuration or startup order.');
  
} catch (error) {
  console.error('\n❌ CONNECTION FAILED from Node.js:');
  console.error(`   Error Name: ${error.name}`);
  console.error(`   Error Message: ${error.message}`);
  
  // Provide specific troubleshooting tips based on the error
  if (error.name === 'MongooseServerSelectionError') {
    console.error('\n💡 This is a network/authentication error. Check that:');
    console.error('   1. The password in your .env file is EXACTLY correct.');
    console.error('   2. There are no extra spaces in the URI.');
  }
  
  process.exit(1);
}
