// scripts/fix-all-users.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔧 Comprehensive User Fix Script');
console.log('================================\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Simple user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  firstName: String,
  lastName: String,
  role: String,
  status: String,
  subscription: Object,
  stats: Object,
  emailVerified: Boolean,
  isVerified: Boolean
}, { strict: false });

async function fixAllUsers() {
  try {
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    const User = mongoose.model('User', userSchema, 'users');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`👤 Processing: ${user.email}`);
      
      const updates = {};
      let needsUpdate = false;
      
      // 1. Fix name splitting if needed
      if (user.name && (!user.firstName || !user.lastName)) {
        const nameParts = user.name.trim().split(/\s+/);
        updates.firstName = nameParts[0] || 'User';
        updates.lastName = nameParts.slice(1).join(' ') || 'User';
        console.log(`   ✏️  Setting name: ${updates.firstName} ${updates.lastName}`);
        needsUpdate = true;
      }
      
      // 2. Ensure role is set
      if (!user.role) {
        updates.role = 'user';
        console.log(`   👑 Setting role: ${updates.role}`);
        needsUpdate = true;
      }
      
      // 3. Ensure status is set
      if (!user.status) {
        updates.status = 'active';
        console.log(`   📊 Setting status: ${updates.status}`);
        needsUpdate = true;
      }
      
      // 4. Ensure subscription exists
      if (!user.subscription) {
        updates.subscription = {
          status: 'inactive',
          plan: 'free',
          tier: 'free'
        };
        console.log(`   💳 Setting subscription: free`);
        needsUpdate = true;
      }
      
      // 5. Ensure stats exist
      if (!user.stats) {
        updates.stats = {
          loginCount: 0,
          lastLogin: null,
          totalPredictions: 0,
          correctPredictions: 0,
          winRate: 0
        };
        console.log(`   📈 Setting stats`);
        needsUpdate = true;
      }
      
      // 6. Sync verification fields
      if (user.emailVerified !== undefined && user.isVerified === undefined) {
        updates.isVerified = user.emailVerified;
        console.log(`   ✅ Syncing verification: ${updates.isVerified}`);
        needsUpdate = true;
      }
      
      if (user.isVerified !== undefined && user.emailVerified === undefined) {
        updates.emailVerified = user.isVerified;
        console.log(`   ✅ Syncing email verification: ${updates.emailVerified}`);
        needsUpdate = true;
      }
      
      // 7. Fix password for specific test users
      const testUsers = ['test@example.com', 'user@example.com', 'admin@example.com'];
      if (testUsers.includes(user.email)) {
        const newPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
        console.log(`   🔑 Resetting password to: ${newPassword}`);
        needsUpdate = true;
      }
      
      // Apply updates
      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        console.log(`   ✅ Updated user ${user.email}`);
      } else {
        console.log(`   ⏭️  No updates needed`);
      }
      
      console.log('');
    }
    
    // Show final state
    console.log('\n📋 Final User Status:');
    console.log('====================');
    const updatedUsers = await User.find({});
    
    for (const user of updatedUsers) {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   First: ${user.firstName || 'N/A'}, Last: ${user.lastName || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}, Status: ${user.status || 'N/A'}`);
      console.log(`   Verified: ${user.isVerified || user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Password: ${user.password ? 'Set' : 'Missing'}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

fixAllUsers();
