#!/usr/bin/env node
// scripts/update-users-in-place.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config();

console.log('🔄 In-Place User Update Script');
console.log('========================================\n');

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

// Get the current User model
async function getCurrentUserModel() {
  try {
    // Try to import existing model
    const modelPath = join(__dirname, '..', 'models', 'User.js');
    
    if (!existsSync(modelPath)) {
      console.error('❌ User model not found at:', modelPath);
      return null;
    }
    
    const userModule = await import(`file://${modelPath}`);
    return userModule.default;
  } catch (error) {
    console.error('❌ Failed to load User model:', error.message);
    return null;
  }
}

// Create backup before making changes
async function createBackup() {
  try {
    console.log('\n💾 Creating backup...');
    
    const backupDir = join(__dirname, '..', 'backup');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    
    // Get current users
    const User = mongoose.model('User');
    const users = await User.find({}).lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      count: users.length,
      users: users.map(user => ({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }))
    };
    
    const backupFile = join(backupDir, `users-pre-update-${Date.now()}.json`);
    writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`   ${users.length} users backed up`);
    
    return { users, backupFile };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return { users: [], backupFile: null };
  }
}

// Update users in place
async function updateUsersInPlace() {
  try {
    console.log('\n🔄 Updating users...');
    
    const User = mongoose.model('User');
    const users = await User.find({});
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Add missing fields with defaults
      if (!user.firstName) {
        user.firstName = user.name?.split(' ')[0] || 'User';
        needsUpdate = true;
      }
      
      if (!user.lastName) {
        user.lastName = user.name?.split(' ').slice(1).join(' ') || '';
        needsUpdate = true;
      }
      
      if (!user.role) {
        user.role = 'user';
        needsUpdate = true;
      }
      
      if (!user.status) {
        user.status = 'active';
        needsUpdate = true;
      }
      
      // Ensure subscription object exists
      if (!user.subscription) {
        user.subscription = {
          status: 'inactive',
          plan: 'free'
        };
        needsUpdate = true;
      }
      
      // Sync email verification fields
      if (user.emailVerified !== undefined && user.isVerified === undefined) {
        user.isVerified = user.emailVerified;
        needsUpdate = true;
      }
      
      if (user.isVerified !== undefined && user.emailVerified === undefined) {
        user.emailVerified = user.isVerified;
        needsUpdate = true;
      }
      
      // Save if changes were made
      if (needsUpdate) {
        try {
          await user.save();
          updatedCount++;
          console.log(`   ✅ Updated ${user.email}`);
        } catch (saveError) {
          console.error(`   ❌ Failed to update ${user.email}:`, saveError.message);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total: ${users.length}`);
    
    return { updatedCount, skippedCount, total: users.length };
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    return { updatedCount: 0, skippedCount: 0, total: 0 };
  }
}

// Main function
async function main() {
  console.log('⚠️  This script will update existing users in your database.');
  console.log('   It will add missing fields and set defaults.\n');
  
  // Ask for confirmation
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Do you want to proceed? (yes/no): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Update cancelled');
    process.exit(0);
  }
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }
    
    // Create backup
    const backup = await createBackup();
    if (!backup.backupFile) {
      console.log('⚠️  Backup failed. Continue anyway? (yes/no)');
      const continueAnswer = await new Promise(resolve => {
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl2.question('> ', resolve);
        rl2.close();
      });
      
      if (continueAnswer.toLowerCase() !== 'yes') {
        console.log('❌ Update cancelled');
        await mongoose.disconnect();
        process.exit(0);
      }
    }
    
    // Update users
    const result = await updateUsersInPlace();
    
    // Final message
    console.log('\n========================================');
    console.log('           UPDATE COMPLETE');
    console.log('========================================');
    console.log(`✅ ${result.updatedCount} users updated`);
    console.log(`✅ Backup saved to: ${backup.backupFile}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Test user authentication');
    console.log('   2. Verify user data is correct');
    console.log('   3. Delete old backup when confident');
    console.log('========================================\n');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Run the script
main();
