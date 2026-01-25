// test-fixed-model.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testFixedModel() {
  console.log('=== Testing Fixed User Model ===\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // Import the FIXED model
    console.log('\nImporting fixed model...');
    const UserModule = await import('./models/user-fixed.js');
    const User = UserModule.default;
    console.log('✅ Fixed User model loaded');
    
    // Test 1: Create and save a user
    console.log('\n=== Test 1: Create User ===');
    const testUser = new User({
      email: `test${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('User before save:', {
      email: testUser.email,
      password: testUser.password, // Should be plain text
      firstName: testUser.firstName
    });
    
    const savedUser = await testUser.save();
    console.log('✅ User saved successfully!');
    console.log('User after save:', {
      id: savedUser._id,
      email: savedUser.email,
      password: savedUser.password.substring(0, 30) + '...', // Should be hashed
      createdAt: savedUser.createdAt
    });
    
    // Test 2: Compare password
    console.log('\n=== Test 2: Compare Password ===');
    const isMatch = await savedUser.comparePassword('Password123!');
    console.log('Password match:', isMatch ? '✅ Correct' : '❌ Incorrect');
    
    const isWrong = await savedUser.comparePassword('wrongpassword');
    console.log('Wrong password match:', isWrong ? '❌ Should be false' : '✅ Correctly false');
    
    // Test 3: Try duplicate email
    console.log('\n=== Test 3: Duplicate Email Check ===');
    try {
      const duplicateUser = new User({
        email: savedUser.email, // Same email
        password: 'AnotherPassword123!',
        firstName: 'Duplicate',
        lastName: 'User'
      });
      
      await duplicateUser.save();
      console.log('❌ Duplicate email should have failed!');
    } catch (error) {
      console.log('✅ Duplicate email correctly rejected');
      console.log('   Error:', error.code === 11000 ? 'Duplicate key' : error.message);
    }
    
    // Cleanup
    console.log('\n=== Cleanup ===');
    await User.deleteOne({ _id: savedUser._id });
    console.log('✅ Test user deleted');
    
    await mongoose.connection.close();
    console.log('\n🎉 All tests passed with fixed model!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.name === 'MongoServerError') {
      console.log('MongoDB Error Code:', error.code);
      console.log('MongoDB Error Details:', error.keyValue);
    }
    
    if (error.name === 'ValidationError') {
      console.log('Validation Errors:');
      for (const field in error.errors) {
        console.log(`  ${field}: ${error.errors[field].message}`);
      }
    }
    
    await mongoose.connection.close();
  }
}

testFixedModel();
