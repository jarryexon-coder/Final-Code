// debug-registration.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DEBUG: Registration Validation Issue\n');

async function debugValidation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Import your current User model
    const User = mongoose.model('User');
    console.log('✅ User model loaded\n');
    
    // Test the name splitting logic
    const testNames = [
      'John Doe',
      'John',
      'John Michael Doe',
      '  John  Doe  ', // with extra spaces
      '', // empty
      ' ' // just spaces
    ];
    
    console.log('Testing name splitting logic:');
    console.log('=============================');
    
    testNames.forEach(name => {
      console.log(`\nInput: "${name}"`);
      const trimmedName = name.trim();
      const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
      console.log(`  Parts:`, nameParts);
      console.log(`  Count: ${nameParts.length}`);
      
      if (nameParts.length > 0) {
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
        console.log(`  First: "${firstName}"`);
        console.log(`  Last: "${lastName}"`);
        console.log(`  Full: "${firstName} ${lastName}"`);
      } else {
        console.log(`  ERROR: No valid name parts!`);
      }
    });
    
    // Test creating a user with the actual logic
    console.log('\n\nTesting actual user creation:');
    console.log('=============================');
    
    const testUserData = {
      email: 'debug-test@example.com',
      password: 'Test123!@#',
      name: 'John Doe'
    };
    
    console.log('Input data:', testUserData);
    
    // Apply the same logic as in authRoutes.js
    const { name } = testUserData;
    const trimmedName = name.trim();
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 0) {
      console.log('❌ ERROR: No valid name parts after splitting!');
      return;
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
    
    console.log(`\nAfter processing:`);
    console.log(`  First name: "${firstName}"`);
    console.log(`  Last name: "${lastName}"`);
    console.log(`  Full name: "${trimmedName}"`);
    
    // Try to create a user
    const user = new User({
      email: testUserData.email,
      password: testUserData.password,
      name: trimmedName,
      firstName,
      lastName,
      role: 'user',
      status: 'active',
      stats: { loginCount: 0, lastLogin: null },
      subscription: { status: 'inactive', plan: 'free', tier: 'free' }
    });
    
    console.log('\nUser object before validation:');
    console.log({
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      hasPassword: !!user.password
    });
    
    // Validate
    const validationError = user.validateSync();
    if (validationError) {
      console.log('\n❌ VALIDATION ERRORS:');
      Object.keys(validationError.errors).forEach(key => {
        const err = validationError.errors[key];
        console.log(`  - ${key}: ${err.message} (value: "${err.value}")`);
      });
    } else {
      console.log('\n✅ Validation passed!');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

debugValidation();
