// test-login.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔐 Testing Login Fix...\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function fixAndTestLogin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // User schema
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String
    }, { strict: false });
    
    const User = mongoose.model('User', userSchema, 'users');
    
    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`👤 Found user: ${testUser.email}`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Password field exists: ${!!testUser.password}`);
    console.log(`   Password length: ${testUser.password?.length || 0}`);
    
    // Check if password is already hashed
    const isHashed = testUser.password?.startsWith('$2a$') || testUser.password?.startsWith('$2b$');
    console.log(`   Password appears hashed: ${isHashed}`);
    
    if (!isHashed && testUser.password) {
      console.log('\n🔄 Hashing password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testUser.password, salt);
      
      await User.updateOne(
        { _id: testUser._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password hashed and updated');
      
      // Verify the hash
      const updatedUser = await User.findOne({ email: 'test@example.com' });
      const isValid = await bcrypt.compare('password123', updatedUser.password);
      console.log(`   Password verification: ${isValid ? '✅' : '❌'}`);
    } else if (isHashed) {
      console.log('\n✅ Password is already hashed');
      // Verify the hash
      const isValid = await bcrypt.compare('password123', testUser.password);
      console.log(`   Password verification: ${isValid ? '✅' : '❌'}`);
    } else {
      console.log('\n⚠️  No password to hash');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

fixAndTestLogin();
