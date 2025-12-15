const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Atlas connection...');
console.log('Connection string (first 60 chars):', process.env.MONGODB_URI.substring(0, 60) + '...');

// Get current IP
const { execSync } = require('child_process');
let currentIP = 'unknown';
try {
  currentIP = execSync('curl -s ifconfig.me').toString().trim();
  console.log('Your current IP:', currentIP);
  console.log('Make sure this IP is whitelisted in MongoDB Atlas Network Access');
} catch (e) {
  console.log('Could not get IP address');
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Try to create a test document
    const db = mongoose.connection.db;
    const testCollection = db.collection('test_connection');
    
    await testCollection.insertOne({
      test: 'connection',
      timestamp: new Date(),
      message: 'Test from connection script'
    });
    
    console.log('✅ Test document inserted');
    
    // Clean up
    await testCollection.deleteMany({ test: 'connection' });
    console.log('✅ Test documents cleaned up');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Go to https://cloud.mongodb.com');
    console.log('2. Click "Network Access" in the sidebar');
    console.log('3. Click "Add IP Address"');
    console.log('4. Click "Add Current IP Address" or use:', currentIP);
    console.log('5. Wait 1-2 minutes for changes to apply');
    console.log('6. Try again');
    process.exit(1);
  });
