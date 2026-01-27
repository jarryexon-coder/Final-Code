// scripts/user-management.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function manageUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User');
    
    console.log('👥 USER MANAGEMENT');
    console.log('=================\n');
    
    // List all users
    const users = await User.find({}).select('email name role status createdAt');
    
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // User stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 USER STATISTICS:');
    console.log('==================');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

manageUsers();
