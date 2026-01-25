// debug-registration.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function testRegistration() {
  console.log('=== Testing Registration Logic ===\n');
  
  try {
    // Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // Import User model
    console.log('\n2. Importing User model...');
    const UserModule = await import('./models/user.js');
    const User = UserModule.default;
    console.log('✅ User model loaded');
    
    // Test creating a user
    console.log('\n3. Testing user creation...');
    const testUser = new User({
      email: `test${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      username: `test${Date.now()}`
    });
    
    console.log('   User object created');
    console.log('   Email:', testUser.email);
    console.log('   Password (hashed):', testUser.password.substring(0, 20) + '...');
    
    // Test save
    console.log('\n4. Testing save...');
    const savedUser = await testUser.save();
    console.log('✅ User saved successfully!');
    console.log('   ID:', savedUser._id);
    console.log('   Created at:', savedUser.createdAt);
    
    // Test password comparison
    console.log('\n5. Testing password comparison...');
    const isMatch = await savedUser.comparePassword('Password123!');
    console.log('✅ Password match:', isMatch);
    
    // Clean up
    console.log('\n6. Cleaning up...');
    await User.deleteOne({ _id: savedUser._id });
    console.log('✅ Test user deleted');
    
    await mongoose.connection.close();
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error.stack);
    
    // Check for specific MongoDB errors
    if (error.name === 'MongoServerError') {
      console.log('\n📌 MongoDB Error Code:', error.code);
      console.log('📌 MongoDB Error Message:', error.message);
      
      // Check for duplicate key error
      if (error.code === 11000) {
        console.log('\n🔍 Duplicate key error!');
        console.log('   This means a user with that email or username already exists.');
      }
    }
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      console.log('\n🔍 Validation errors:');
      for (const field in error.errors) {
        console.log(`   ${field}: ${error.errors[field].message}`);
      }
    }
    
    await mongoose.connection.close();
  }
}

testRegistration();
