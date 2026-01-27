#!/usr/bin/env node
// scripts/migrate-users-complete.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 User Migration Script');
console.log('==============================\n');

// Check environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

// Old User Schema (from your current user-fixed.js)
const OldUserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  firstName: String,
  lastName: String,
  username: String,
  role: String,
  status: String,
  subscription: {
    status: String,
    plan: String
  },
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}, {
  collection: 'users'  // Explicitly set collection name
});

// Connect to MongoDB
let connection;
let OldUser;
let NewUser;

async function connectDB() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected');
    
    // Create models on this connection
    OldUser = connection.model('OldUser', OldUserSchema);
    
    // Try to load the new User model
    try {
      const newUserModule = await import(join(__dirname, '..', 'models', 'User.js'));
      NewUser = newUserModule.default;
      console.log('✅ New User model loaded');
    } catch (error) {
      console.log('⚠️  New User model not found, will create it');
      await createNewUserModel();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function createNewUserModel() {
  // Create a simplified version of the new User model for migration
  const newUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: String,
    role: { type: String, default: 'user', enum: ['user', 'admin', 'premium', 'moderator'] },
    status: { type: String, default: 'active', enum: ['active', 'suspended', 'inactive', 'pending_verification'] },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    
    subscription: {
      status: { type: String, enum: ['active', 'inactive', 'cancelled', 'expired', 'trial', 'pending'], default: 'inactive' },
      plan: { type: String, enum: ['free', 'pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly', 'premium', 'pro'], default: 'free' },
      tier: { type: String, enum: ['free', 'pro', 'premium', 'elite'], default: 'free' },
      expiresAt: Date,
      stripeCustomerId: String,
      revenuecatId: String
    },
    
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      },
      favoriteTeams: [String],
      favoritePlayers: [String],
      theme: { type: String, enum: ['light', 'dark', 'system', 'auto'], default: 'system' }
    },
    
    stats: {
      loginCount: { type: Number, default: 0 },
      lastLogin: Date,
      totalPredictions: { type: Number, default: 0 },
      correctPredictions: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      totalWagered: { type: Number, default: 0 },
      totalWon: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }
    },
    
    refreshTokens: [{
      token: String,
      device: String,
      ip: String,
      createdAt: Date
    }],
    
    resetToken: String,
    resetTokenExpiry: Date,
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  }, {
    timestamps: true
  });

  // Add methods
  newUserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  newUserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Sync email verification fields
    if (this.isModified('emailVerified')) {
      this.isVerified = this.emailVerified;
    }
    if (this.isModified('isVerified')) {
      this.emailVerified = this.isVerified;
    }
    
    // Set tier based on plan
    if (this.isModified('subscription.plan')) {
      const plan = this.subscription.plan;
      if (plan === 'free') this.subscription.tier = 'free';
      else if (plan.includes('pro')) this.subscription.tier = 'pro';
      else if (plan.includes('elite') || plan === 'premium') this.subscription.tier = 'premium';
    }
    
    next();
  });

  NewUser = connection.model('User', newUserSchema);
  console.log('✅ Created new User model for migration');
}

async function backupOldUsers() {
  try {
    console.log('\n📋 Backing up old users...');
    const oldUsers = await OldUser.find({}).lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      count: oldUsers.length,
      users: oldUsers.map(user => ({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }))
    };
    
    const backupPath = join(__dirname, '..', 'backup', 'users-backup.json');
    const fs = await import('fs');
    const path = await import('path');
    
    // Create backup directory if it doesn't exist
    if (!existsSync(join(__dirname, '..', 'backup'))) {
      fs.mkdirSync(join(__dirname, '..', 'backup'), { recursive: true });
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}`);
    console.log(`   Total users backed up: ${oldUsers.length}`);
    
    return oldUsers;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return [];
  }
}

async function migrateUsers() {
  try {
    console.log('\n🔄 Starting user migration...');
    
    // Get all old users
    const oldUsers = await OldUser.find({});
    console.log(`📊 Found ${oldUsers.length} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const oldUser of oldUsers) {
      try {
        // Check if user already exists in new collection
        const existingUser = await NewUser.findOne({ email: oldUser.email });
        
        if (existingUser) {
          console.log(`   ⚠️  Skipping ${oldUser.email} (already exists)`);
          skippedCount++;
          continue;
        }
        
        // Map old user to new user schema
        const newUserData = {
          email: oldUser.email,
          password: oldUser.password,
          name: oldUser.name || `${oldUser.firstName || ''} ${oldUser.lastName || ''}`.trim(),
          firstName: oldUser.firstName || oldUser.name?.split(' ')[0] || 'User',
          lastName: oldUser.lastName || oldUser.name?.split(' ').slice(1).join(' ') || '',
          username: oldUser.username,
          role: oldUser.role || 'user',
          status: oldUser.status || 'active',
          isVerified: oldUser.emailVerified || false,
          emailVerified: oldUser.emailVerified || false,
          
          subscription: {
            status: oldUser.subscription?.status || 'inactive',
            plan: oldUser.subscription?.plan || 'free',
            tier: mapPlanToTier(oldUser.subscription?.plan),
            expiresAt: null
          },
          
          preferences: {
            notifications: {
              email: true,
              push: true
            },
            favoriteTeams: [],
            favoritePlayers: [],
            theme: 'system'
          },
          
          stats: {
            loginCount: 0,
            lastLogin: oldUser.lastLogin || null,
            totalPredictions: 0,
            correctPredictions: 0,
            winRate: 0,
            totalWagered: 0,
            totalWon: 0,
            roi: 0
          },
          
          refreshTokens: [],
          
          createdAt: oldUser.createdAt || new Date(),
          updatedAt: oldUser.updatedAt || new Date(),
          lastSeen: oldUser.lastLogin || new Date()
        };
        
        // Create new user
        const newUser = new NewUser(newUserData);
        await newUser.save();
        
        migratedCount++;
        console.log(`   ✅ Migrated ${oldUser.email} (${newUser._id})`);
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Failed to migrate ${oldUser.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${oldUsers.length}`);
    
    return { migratedCount, skippedCount, errorCount };
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { migratedCount: 0, skippedCount: 0, errorCount: 1 };
  }
}

function mapPlanToTier(plan) {
  if (!plan || plan === 'free') return 'free';
  if (plan.includes('pro')) return 'pro';
  if (plan.includes('elite') || plan === 'premium') return 'premium';
  return 'free';
}

async function validateMigration() {
  try {
    console.log('\n🔍 Validating migration...');
    
    const oldCount = await OldUser.countDocuments();
    const newCount = await NewUser.countDocuments();
    
    console.log(`   Old collection count: ${oldCount}`);
    console.log(`   New collection count: ${newCount}`);
    
    if (newCount >= oldCount) {
      console.log('✅ Migration validation passed');
      return true;
    } else {
      console.log('⚠️  Some users may not have been migrated');
      return false;
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up...');
    
    // You can choose to rename or drop the old collection
    // For safety, we'll just rename it
    const collections = await connection.db.listCollections().toArray();
    const oldCollectionExists = collections.some(col => col.name === 'users_old');
    
    if (!oldCollectionExists) {
      await connection.db.collection('users').rename('users_old');
      console.log('✅ Renamed old collection to "users_old"');
    } else {
      console.log('⚠️  "users_old" already exists, keeping both collections');
    }
    
    // Rename the new collection to 'users'
    await connection.db.collection('users').drop().catch(() => {});
    await connection.db.collection('User').rename('users');
    console.log('✅ New collection is now "users"');
    
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('========================================');
    console.log('        USER MIGRATION TOOL');
    console.log('========================================\n');
    
    // Step 1: Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Step 2: Backup
    const backupResult = await backupOldUsers();
    if (!backupResult || backupResult.length === 0) {
      console.log('⚠️  No users found or backup failed. Continue? (y/n)');
      const answer = await waitForInput();
      if (answer.toLowerCase() !== 'y') {
        console.log('Migration cancelled');
        process.exit(0);
      }
    }
    
    // Step 3: Run migration
    console.log('\n🚀 Starting migration process...');
    const migrationResult = await migrateUsers();
    
    if (migrationResult.errorCount > 0 && migrationResult.migratedCount === 0) {
      console.error('❌ Migration failed completely');
      process.exit(1);
    }
    
    // Step 4: Validate
    const isValid = await validateMigration();
    
    if (!isValid) {
      console.log('⚠️  Validation warnings. Continue with cleanup? (y/n)');
      const answer = await waitForInput();
      if (answer.toLowerCase() !== 'y') {
        console.log('Cleanup cancelled');
        process.exit(0);
      }
    }
    
    // Step 5: Cleanup (optional)
    console.log('\nProceed with cleanup? This will rename collections. (y/n)');
    const cleanupAnswer = await waitForInput();
    
    if (cleanupAnswer.toLowerCase() === 'y') {
      await cleanup();
    } else {
      console.log('⚠️  Cleanup skipped. Collections remain as-is.');
    }
    
    // Step 6: Final summary
    console.log('\n========================================');
    console.log('        MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`✅ Backup created in /backup folder`);
    console.log(`✅ ${migrationResult.migratedCount} users migrated`);
    console.log(`⚠️  ${migrationResult.skippedCount} users skipped`);
    console.log(`❌ ${migrationResult.errorCount} errors`);
    console.log('\n💡 Next steps:');
    console.log('   1. Test authentication with migrated users');
    console.log('   2. Verify user data in new collection');
    console.log('   3. Delete old backup when confident');
    console.log('========================================\n');
    
    // Close connection
    await connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }
}

// Helper function to wait for user input
function waitForInput() {
  return new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('> ', answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the migration
runMigration().catch(console.error);
