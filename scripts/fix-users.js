// scripts/fix-users.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config();

console.log('🔧 Fixing User Schema...');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Simple User schema for migration
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  emailVerified: { type: Boolean, default: false },
  subscription: {
    status: { type: String, default: 'inactive' },
    plan: { type: String, default: 'free' },
    tier: { type: String, default: 'free' }
  },
  stats: {
    loginCount: { type: Number, default: 0 },
    lastLogin: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Connect and update
async function fixUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get existing users
    const User = mongoose.model('User', userSchema, 'users');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      const updates = {};
      
      // Add missing fields
      if (!user.role) {
        updates.role = 'user';
      }
      
      if (!user.status) {
        updates.status = 'active';
      }
      
      if (!user.emailVerified) {
        updates.emailVerified = false;
      }
      
      if (!user.subscription) {
        updates.subscription = {
          status: 'inactive',
          plan: 'free',
          tier: 'free'
        };
      }
      
      if (!user.stats) {
        updates.stats = {
          loginCount: 0,
          lastLogin: null
        };
      }
      
      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        fixedCount++;
        console.log(`   ✅ Fixed ${user.email}`);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} users`);
    console.log(`   📊 Total: ${users.length} users`);
    
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

fixUsers();
