// test-registration-debug.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🐛 DEBUG: Registration Issue\n');

async function debugRegistration() {
  try {
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    console.log('2. Checking User model...');
    let User;
    try {
      User = mongoose.model('User');
      console.log('✅ User model exists in Mongoose registry\n');
    } catch (error) {
      console.log('❌ User model not registered:', error.message);
      console.log('   Let me try to import it...');
      
      // Try to import the model
      const userModule = await import('./models/User.js');
      User = userModule.default;
      console.log('✅ Imported User model\n');
    }
    
    console.log('3. Checking schema paths...');
    const schema = User.schema;
    const paths = schema.paths;
    
    console.log('📋 Schema paths:');
    Object.keys(paths).forEach(pathName => {
      const path = paths[pathName];
      console.log(`   ${pathName}:`);
      console.log(`     Type: ${path.instance}`);
      console.log(`     Required: ${path.isRequired}`);
      console.log(`     Default: ${path.defaultValue}`);
    });
    
    console.log('\n4. Creating a test user...');
    const testUser = new User({
      email: 'debug-test@example.com',
      password: 'Test123!@#',
      name: 'Debug User',
      firstName: 'Debug',
      lastName: 'User'
    });
    
    console.log('   Test user object:', {
      email: testUser.email,
      name: testUser.name,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      hasPassword: !!testUser.password
    });
    
    console.log('\n5. Validating...');
    const validationError = testUser.validateSync();
    if (validationError) {
      console.log('❌ Validation errors:');
      Object.keys(validationError.errors).forEach(key => {
        const err = validationError.errors[key];
        console.log(`   - ${key}: ${err.message}`);
      });
    } else {
      console.log('✅ Validation passed\n');
    }
    
    console.log('\n6. Checking existing users in database...');
    const existingUsers = await User.find({});
    console.log(`   Found ${existingUsers.length} users`);
    
    if (existingUsers.length > 0) {
      console.log('\n   Sample user structure:');
      const sample = existingUsers[0].toObject();
      console.log('   Email:', sample.email);
      console.log('   Name:', sample.name);
      console.log('   First Name:', sample.firstName);
      console.log('   Last Name:', sample.lastName);
      console.log('   Password exists:', !!sample.password);
      console.log('   Password type:', typeof sample.password);
      console.log('   Password length:', sample.password?.length);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

debugRegistration();
