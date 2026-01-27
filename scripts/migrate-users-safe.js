#!/usr/bin/env node
// scripts/migrate-users-safe.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config();

console.log('🔒 SAFE User Migration - Dry Run Only');
console.log('========================================\n');

// Configuration
const config = {
  mongodbUri: process.env.MONGODB_URI,
  dryRun: true,  // Set to false when ready to actually migrate
  backupPath: join(__dirname, '..', 'backup', 'migration-report.json')
};

if (!config.mongodbUri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Define schemas
const OldUserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  firstName: String,
  lastName: String,
  username: String,
  role: String,
  status: String,
  subscription: Object,
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
});

// Create models
const OldUser = mongoose.model('OldUser', OldUserSchema, 'users');

// New User Schema (simplified for migration)
const NewUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  firstName: String,
  lastName: String,
  username: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  isVerified: Boolean,
  emailVerified: Boolean,
  subscription: {
    status: String,
    plan: String,
    tier: String
  },
  preferences: Object,
  stats: Object,
  refreshTokens: Array,
  createdAt: Date,
  updatedAt: Date
});

const NewUser = mongoose.model('NewUser', NewUserSchema);

async function analyzeUsers() {
  console.log('\n📊 Analyzing existing users...');
  
  try {
    const users = await OldUser.find({});
    console.log(`✅ Found ${users.length} users`);
    
    const analysis = {
      total: users.length,
      byRole: {},
      byStatus: {},
      bySubscription: {},
      withEmailVerified: 0,
      withLastLogin: 0,
      sampleUsers: []
    };
    
    // Analyze first 5 users as sample
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      analysis.sampleUsers.push({
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription
      });
    }
    
    // Count by role
    users.forEach(user => {
      analysis.byRole[user.role || 'unknown'] = (analysis.byRole[user.role || 'unknown'] || 0) + 1;
      analysis.byStatus[user.status || 'unknown'] = (analysis.byStatus[user.status || 'unknown'] || 0) + 1;
      
      if (user.subscription?.plan) {
        analysis.bySubscription[user.subscription.plan] = (analysis.bySubscription[user.subscription.plan] || 0) + 1;
      }
      
      if (user.emailVerified) analysis.withEmailVerified++;
      if (user.lastLogin) analysis.withLastLogin++;
    });
    
    return { users, analysis };
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    return { users: [], analysis: null };
  }
}

async function generateMigrationPlan(users, analysis) {
  console.log('\n📋 Generating migration plan...');
  
  const plan = {
    timestamp: new Date().toISOString(),
    analysis,
    steps: [],
    warnings: [],
    estimatedTime: `${users.length * 0.1} seconds`
  };
  
  // Check for potential issues
  users.forEach(user => {
    if (!user.email) {
      plan.warnings.push(`User ${user._id} has no email`);
    }
    
    if (user.role && !['user', 'admin', 'premium'].includes(user.role)) {
      plan.warnings.push(`User ${user.email} has unknown role: ${user.role}`);
    }
  });
  
  // Generate migration steps
  plan.steps = [
    '1. Create backup of current users collection',
    '2. Validate all users have required fields',
    '3. Transform old user data to new schema',
    '4. Create new users in temporary collection',
    '5. Verify migration success',
    '6. Replace old collection with new one (if dryRun is false)'
  ];
  
  console.log(`✅ Migration plan generated`);
  console.log(`   ${users.length} users to migrate`);
  console.log(`   ${plan.warnings.length} warnings detected`);
  
  return plan;
}

async function createBackup(users) {
  console.log('\n💾 Creating backup...');
  
  try {
    // Ensure backup directory exists
    const backupDir = join(__dirname, '..', 'backup');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      count: users.length,
      users: users.map(user => ({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        subscription: user.subscription,
        emailVerified: user.emailVerified
      }))
    };
    
    const backupFile = join(backupDir, `users-backup-${Date.now()}.json`);
    writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`   ${users.length} users backed up`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return null;
  }
}

function transformUser(oldUser) {
  // Transform old user data to new schema
  return {
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
      tier: mapPlanToTier(oldUser.subscription?.plan)
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
    updatedAt: oldUser.updatedAt || new Date()
  };
}

function mapPlanToTier(plan) {
  if (!plan || plan === 'free') return 'free';
  if (plan.includes('pro')) return 'pro';
  if (plan.includes('elite') || plan === 'premium') return 'premium';
  return 'free';
}

async function simulateMigration(users) {
  console.log('\n🔍 Simulating migration (dry run)...');
  
  const results = {
    total: users.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  for (const oldUser of users.slice(0, 10)) { // Only simulate first 10
    try {
      const newUserData = transformUser(oldUser);
      
      // Check if user would be valid
      if (!newUserData.email) {
        results.failed++;
        results.errors.push(`User ${oldUser._id} has no email`);
        continue;
      }
      
      // Check if email already exists in new collection
      const existing = await NewUser.findOne({ email: newUserData.email });
      if (existing) {
        results.skipped++;
        continue;
      }
      
      results.successful++;
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Error processing ${oldUser.email}: ${error.message}`);
    }
  }
  
  console.log(`✅ Simulation completed`);
  console.log(`   Successful: ${results.successful}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Skipped: ${results.skipped}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors found:');
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  return results;
}

async function generateReport(analysis, plan, simulation, backupFile) {
  console.log('\n📄 Generating migration report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      mongodbUri: config.mongodbUri ? '***' : 'not set',
      dryRun: config.dryRun
    },
    analysis,
    plan,
    simulation,
    backupFile,
    recommendations: []
  };
  
  // Add recommendations
  if (analysis?.analysis?.warnings?.length > 0) {
    report.recommendations.push('Fix warnings before proceeding with actual migration');
  }
  
  if (simulation.failed > 0) {
    report.recommendations.push('Address migration errors shown in simulation');
  }
  
  if (analysis?.users?.length > 1000) {
    report.recommendations.push('Consider running migration during off-peak hours');
  }
  
  report.recommendations.push('Test with a small subset of users first');
  report.recommendations.push('Have a rollback plan ready');
  
  // Save report
  const reportFile = config.backupPath;
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`✅ Report saved: ${reportFile}`);
  
  // Print summary
  console.log('\n========================================');
  console.log('           MIGRATION REPORT');
  console.log('========================================');
  console.log(`Total Users: ${analysis?.users?.length || 0}`);
  console.log(`Dry Run: ${config.dryRun ? 'YES (no changes made)' : 'NO (will modify database)'}`);
  console.log(`Backup: ${backupFile ? '✅ Created' : '❌ Failed'}`);
  console.log(`Simulation Success Rate: ${simulation.total > 0 ? Math.round((simulation.successful / simulation.total) * 100) : 0}%`);
  
  if (config.dryRun) {
    console.log('\n⚠️  THIS WAS A DRY RUN - NO CHANGES WERE MADE');
    console.log('To perform actual migration:');
    console.log('1. Review the migration report');
    console.log('2. Fix any warnings or errors');
    console.log('3. Set dryRun: false in the script');
    console.log('4. Run the migration again');
  }
  
  console.log('========================================\n');
  
  return report;
}

async function runSafeMigration() {
  try {
    console.log('🚀 Starting safe migration analysis...\n');
    
    // Connect to database
    await connectDB();
    
    // Analyze current users
    const analysis = await analyzeUsers();
    if (!analysis.users.length) {
      console.log('❌ No users found to migrate');
      await mongoose.disconnect();
      return;
    }
    
    // Generate migration plan
    const plan = await generateMigrationPlan(analysis.users, analysis.analysis);
    
    // Create backup
    const backupFile = await createBackup(analysis.users);
    
    // Simulate migration
    const simulation = await simulateMigration(analysis.users);
    
    // Generate report
    await generateReport(analysis, plan, simulation, backupFile);
    
    // Close connection
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Run the safe migration
runSafeMigration();
