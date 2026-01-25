import 'dotenv/config';
import { connectDB, Player, User, Selection } from './models/index.js';

(async () => {
  console.log('🔍 Testing database connection and counts...');
  
  try {
    // Check environment variable
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
    
    // Connect
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Count documents
    console.log('\n📊 Current database counts:');
    console.log('Players:', await Player.countDocuments());
    console.log('Users:', await User.countDocuments());
    console.log('Selections:', await Selection.countDocuments());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
