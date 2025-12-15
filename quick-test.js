const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔄 Testing MongoDB connection...');
console.log('IP to whitelist: 146.75.232.158');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000
})
.then(() => {
  console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
  console.log('You can now start your server with: node server.js');
  mongoose.connection.close();
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error:', err.message);
  
  if (err.message.includes('whitelist')) {
    console.log('\n🔧 SOLUTION:');
    console.log('1. Go to: https://cloud.mongodb.com');
    console.log('2. Click "Network Access"');
    console.log('3. Click "Add IP Address"');
    console.log('4. Click "Add Current IP Address"');
    console.log('5. Click "Confirm"');
    console.log('6. Wait 2 minutes, then try again');
  }
  process.exit(1);
});
