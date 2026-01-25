import 'dotenv/config';
import { connectDB, Player, User, Selection } from './models/index.js';

(async () => {
  try {
    await connectDB();
    
    console.log('📡 Testing API data retrieval...\n');
    
    // Test getting all players
    const players = await Player.find().limit(3);
    console.log('🏀 First 3 players:');
    players.forEach(p => console.log(`  ${p.name} (${p.team})`));
    
    // Test getting all users (without passwords)
    const users = await User.find({}, 'email username role');
    console.log('\n👤 Users:');
    users.forEach(u => console.log(`  ${u.email} - ${u.role}`));
    
    // Test selections with populated data
    const selections = await Selection.find()
      .populate('userId', 'email username')
      .limit(2);
    
    console.log('\n🎯 Sample selections:');
    selections.forEach(s => {
      console.log(`  Selection by ${s.userId.username}:`);
      s.winners.forEach(w => console.log(`    - ${w.playerName}: ${w.pick}`));
    });
    
    console.log('\n✅ API data test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
