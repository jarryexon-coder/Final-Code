// scripts/fix-names.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('👥 Fixing User Names...');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// User schema for the fix
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  firstName: String,
  lastName: String
}, { strict: false });

async function fixUserNames() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', userSchema, 'users');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      // Only fix users that have name but no firstName/lastName
      if (user.name && (!user.firstName || !user.lastName)) {
        const nameParts = user.name.trim().split(/\s+/);
        const updates = {};
        
        if (!user.firstName) {
          updates.firstName = nameParts[0] || 'User';
        }
        
        if (!user.lastName) {
          updates.lastName = nameParts.slice(1).join(' ') || '';
        }
        
        await User.updateOne({ _id: user._id }, { $set: updates });
        fixedCount++;
        console.log(`   ✅ Fixed ${user.email}: ${updates.firstName} ${updates.lastName}`);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} users`);
    console.log(`   📊 Total: ${users.length} users`);
    
    // Show updated users
    console.log('\n👥 Updated Users:');
    const updatedUsers = await User.find({}).limit(5);
    updatedUsers.forEach(u => {
      console.log(`   - ${u.email}: ${u.firstName || 'No first name'} ${u.lastName || 'No last name'}`);
    });
    
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

fixUserNames();
