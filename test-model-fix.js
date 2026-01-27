// test-model-fix.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Fixed User Model\n');

async function testFixedModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear cached model
    delete mongoose.connection.models.User;
    
    // Import the fixed model
    const UserModule = await import('./models/User.js');
    const User = UserModule.default;
    
    console.log('✅ User model reloaded\n');
    
    // Test creating a user
    const testData = {
      email: 'model-test@example.com',
      password: 'Test123!@#',
      name: 'Test User'
    };
    
    console.log('Creating user with:', testData);
    
    const user = new User(testData);
    
    console.log('\n📊 User object BEFORE validation:');
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- First name:', user.firstName);
    console.log('- Last name:', user.lastName);
    console.log('- Has password:', !!user.password);
    
    // Check validation
    const validationError = user.validateSync();
    if (validationError) {
      console.log('\n❌ VALIDATION ERRORS:');
      Object.keys(validationError.errors).forEach(key => {
        const err = validationError.errors[key];
        console.log(`  - ${key}: ${err.message} (value: "${err.value}")`);
      });
    } else {
      console.log('\n✅ Validation passed!');
      console.log('\n📊 User object AFTER defaults applied:');
      console.log('- First name:', user.firstName);
      console.log('- Last name:', user.lastName);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

testFixedModel();
