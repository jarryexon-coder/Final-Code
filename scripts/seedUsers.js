import 'dotenv/config';
import { connectDB } from '../models/index.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

async function seedUsers() {
  try {
    await connectDB();
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      dailySelections: 5
    });
    
    // Create premium user
    const premiumPassword = await bcrypt.hash('premium123', 10);
    const premium = await User.create({
      username: 'premium',
      email: 'premium@example.com',
      password: premiumPassword,
      role: 'premium',
      dailySelections: 3
    });
    
    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      dailySelections: 2
    });
    
    console.log('✅ Users seeded successfully');
    console.log(`👑 Admin: admin@example.com / admin123`);
    console.log(`⭐ Premium: premium@example.com / premium123`);
    console.log(`👤 User: user@example.com / user123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
