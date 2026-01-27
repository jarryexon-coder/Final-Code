// scripts/emergency-fix.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🚨 EMERGENCY FIX FOR AUTHENTICATION');
console.log('===================================\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Simple schema for emergency fix
const userSchema = new mongoose.Schema({}, { strict: false });

async function emergencyFix() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', userSchema, 'users');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.email || 'No email'}`);
      console.log(`   ID: ${user._id}`);
      
      const updates = {};
      
      // 1. Fix firstName and lastName
      if (user.name && !user.firstName && !user.lastName) {
        const nameParts = user.name.split(' ');
        updates.firstName = nameParts[0] || 'User';
        updates.lastName = nameParts.slice(1).join(' ') || 'User';
        console.log(`   ✏️  Setting firstName: ${updates.firstName}, lastName: ${updates.lastName}`);
      }
      
      // 2. Fix password if it's not hashed
      if (user.password) {
        // Check if it's already hashed
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        if (!isHashed) {
          const salt = await bcrypt.genSalt(10);
          updates.password = await bcrypt.hash(user.password, salt);
          console.log(`   🔑 Hashing password`);
        }
      } else {
        // No password? Set one
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash('password123', salt);
        console.log(`   🔑 Setting new password`);
      }
      
      // 3. Ensure required fields exist
      if (!user.role) updates.role = 'user';
      if (!user.status) updates.status = 'active';
      if (!user.subscription) {
        updates.subscription = {
          status: 'inactive',
          plan: 'free',
          tier: 'free'
        };
      }
      
      // Apply updates
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        console.log(`   ✅ Updated successfully\n`);
      } else {
        console.log(`   ✅ Already ok\n`);
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    console.log('\n🎉 Emergency fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

emergencyFix();
