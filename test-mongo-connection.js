// test-mongo-connection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing MongoDB connection...');
console.log('Connection string (first 50 chars):', process.env.MONGODB_URI?.substring(0, 50) + '...');

// Test 1: Try with mongoose
async function testMongoose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Mongoose connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('❌ Mongoose connection failed:', error.message);
    return false;
  }
}

// Test 2: Try without SRV
async function testWithoutSRV() {
  try {
    const uriWithoutSRV = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
    await mongoose.connect(uriWithoutSRV);
    console.log('✅ Connected without SRV');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('❌ Connection without SRV failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n=== Test 1: Normal connection ===');
  const test1 = await testMongoose();
  
  if (!test1) {
    console.log('\n=== Test 2: Without SRV ===');
    await testWithoutSRV();
  }
  
  process.exit(0);
}

runTests();
