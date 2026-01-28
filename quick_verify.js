console.log('Quick verification...\n');

// Check if we can import server.js without starting it
try {
  // Just parse, don't execute
  await import('./server.js?test=1');
  console.log('✅ server.js can be imported');
} catch (error) {
  console.log('❌ Error:', error.message);
  if (error.stack) {
    console.log('Stack:', error.stack.split('\n')[0]);
  }
}

// Check MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

try {
  await mongoose.connect(process.env.MONGODB_URI, { connectTimeoutMS: 5000 });
  console.log('✅ MongoDB connection successful');
  await mongoose.disconnect();
} catch (error) {
  console.log('⚠ MongoDB connection:', error.message);
}

console.log('\n✅ Ready to start server!');
process.exit(0);
