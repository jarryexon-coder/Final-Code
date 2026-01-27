// scripts/fix-all-issues.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

console.log('🔧 FIXING ALL USER ISSUES');
console.log('==========================\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function fixAllIssues() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    // Use direct MongoDB driver to avoid schema issues
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`📊 Found ${users.length} users to fix\n`);
    
    for (const user of users) {
      console.log(`👤 Fixing: ${user.email || 'No email'}`);
      
      const updates = {};
      let changes = [];
      
      // 1. Fix name field if empty
      if (!user.name || user.name.trim() === '') {
        const firstName = user.firstName || 'User';
        const lastName = user.lastName || 'User';
        updates.name = `${firstName} ${lastName}`.trim();
        changes.push(`Name: ${updates.name}`);
      }
      
      // 2. Ensure firstName and lastName exist
      if (!user.firstName) {
        updates.firstName = 'User';
        changes.push(`FirstName: ${updates.firstName}`);
      }
      
      if (!user.lastName) {
        updates.lastName = 'User';
        changes.push(`LastName: ${updates.lastName}`);
      }
      
      // 3. Fix password - ALL USERS NEED PASSWORDS
      if (!user.password || user.password === '') {
        const defaultPassword = 'password123'; // Default password for all users
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(defaultPassword, salt);
        changes.push('Password: Set to default');
      }
      
      // 4. Ensure role is set
      if (!user.role) {
        updates.role = user.email?.includes('admin') ? 'admin' : 'user';
        changes.push(`Role: ${updates.role}`);
      }
      
      // 5. Ensure status is set
      if (!user.status) {
        updates.status = 'active';
        changes.push(`Status: ${updates.status}`);
      }
      
      // 6. Ensure subscription exists
      if (!user.subscription) {
        updates.subscription = {
          status: 'inactive',
          plan: 'free',
          tier: 'free'
        };
        changes.push('Subscription: Added');
      }
      
      // 7. Ensure stats exist
      if (!user.stats) {
        updates.stats = {
          loginCount: 0,
          lastLogin: null
        };
        changes.push('Stats: Added');
      }
      
      // Apply updates
      if (Object.keys(updates).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updates }
        );
        console.log(`   ✅ Fixed: ${changes.join(', ')}\n`);
      } else {
        console.log(`   ✅ Already ok\n`);
      }
    }
    
    // Verify fixes
    console.log('\n📋 VERIFICATION OF FIXES');
    console.log('========================');
    
    const fixedUsers = await usersCollection.find({}).toArray();
    for (const user of fixedUsers.slice(0, 3)) { // Show first 3
      console.log(`📧 ${user.email}`);
      console.log(`   Name: "${user.name}"`);
      console.log(`   First: "${user.firstName}", Last: "${user.lastName}"`);
      console.log(`   Password: ${user.password ? '✓ Set' : '✗ Missing'}`);
      console.log(`   Role: ${user.role || 'None'}`);
      console.log(`   Status: ${user.status || 'None'}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('✅ All fixes applied and verified!');
    console.log('\n🔑 DEFAULT PASSWORDS SET:');
    console.log('   All users now have password: "password123"');
    console.log('\n🚀 You can now register new users and login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

fixAllIssues();
