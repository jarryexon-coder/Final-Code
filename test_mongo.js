import dotenv from 'dotenv';
dotenv.config();

console.log('=== Testing MongoDB Connection ===');
console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('URI (masked):', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
}

import mongoose from 'mongoose';

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connection successful!');
    
    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try to insert a test document
    const testDoc = {
      test: 'connection_test',
      timestamp: new Date()
    };
    const result = await db.collection('connection_tests').insertOne(testDoc);
    console.log('✅ Test insert successful, ID:', result.insertedId);
    
    // Clean up
    await db.collection('connection_tests').deleteOne({ _id: result.insertedId });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

test();
