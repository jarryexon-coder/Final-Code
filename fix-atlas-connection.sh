#!/bin/bash

echo "🔧 Fixing MongoDB Atlas Connection"
echo "================================"

cd ~/nba-backend

# Get current IP
echo "1. Your current IP address:"
CURRENT_IP=$(curl -s ifconfig.me)
echo "   $CURRENT_IP"
echo "   Make sure this IP is whitelisted in MongoDB Atlas"

echo ""
echo "2. Testing connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('   Using URI:', uri.substring(0, 50) + '...');

// Fix common issues
let fixedUri = uri;
if (uri.includes('nba-fantasy=Cluster1')) {
  fixedUri = uri.replace('nba-fantasy=Cluster1', 'nba-fantasy?appName=Cluster1');
  console.log('   Fixed URI:', fixedUri.substring(0, 50) + '...');
}

mongoose.connect(fixedUri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
  .then(async () => {
    console.log('   ✅ Connection successful!');
    
    // Try to create a test document
    const db = mongoose.connection.db;
    const testCollection = db.collection('test_connection');
    
    await testCollection.insertOne({
      test: 'connection',
      timestamp: new Date(),
      ip: '$CURRENT_IP'
    });
    
    console.log('   ✅ Test document inserted');
    
    const count = await testCollection.countDocuments();
    console.log('   ✅ Database contains', count, 'test documents');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('   ❌ Connection failed:', err.message);
    console.log('\\n🔧 Troubleshooting steps:');
    console.log('   1. Go to https://cloud.mongodb.com');
    console.log('   2. Click "Network Access"');
    console.log('   3. Add IP address: $CURRENT_IP');
    console.log('   4. Wait 1-2 minutes for changes to apply');
    console.log('   5. Try again');
    process.exit(1);
  });
"
