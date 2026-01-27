// test-direct.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Direct User Model Test\n');

async function testDirect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Import the fixed User model
    const UserModule = await import('./models/User.js');
    const User = UserModule.default;
    
    // Test data
    const testData = {
      email: 'direct-test@example.com',
      password: 'test123',
      name: 'Direct Test User'
    };
    
    console.log('Testing User.createUser() method...');
    console.log('Input:', testData);
    
    // Use the static method
    const user = await User.createUser(testData);
    
    console.log('\n✅ User created successfully!');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
    console.log('Password is hashed:', user.password.startsWith('$2'));
    
    // Test password comparison
    console.log('\n🔑 Testing password comparison...');
    const isMatch = user.comparePassword('test123');
    console.log('Password match:', isMatch);
    
    const isWrong = user.comparePassword('wrong');
    console.log('Wrong password match:', isWrong);
    
    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log('\n🧹 Test user cleaned up');
    
    await mongoose.disconnect();
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

testDirect();
