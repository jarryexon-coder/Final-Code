import 'dotenv/config';

console.log('🚀 Starting diagnostic script...');

// Step 1: Check environment variables
console.log('\n1️⃣  Checking environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

// Step 2: Try to import models
console.log('\n2️⃣  Attempting to import models...');
try {
  // Dynamic import to catch errors
  const modelsModule = await import('./models/index.js');
  console.log('✓ Successfully imported models/index.js');
  
  const { connectDB, Player, User, Selection } = modelsModule;
  console.log('✓ Models available:', { Player, User, Selection });
  
  // Step 3: Test connection
  console.log('\n3️⃣  Testing database connection...');
  try {
    await connectDB();
    console.log('✓ MongoDB connected successfully');
    
    // Step 4: Check current data
    console.log('\n4️⃣  Checking current database state:');
    const playerCount = await Player.countDocuments();
    const userCount = await User.countDocuments();
    const selectionCount = await Selection.countDocuments();
    
    console.log(`Players: ${playerCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Selections: ${selectionCount}`);
    
    // Step 5: Try to create one sample player
    console.log('\n5️⃣  Testing single player creation...');
    try {
      const testPlayer = await Player.create({
        externalId: 'test-player-' + Date.now(),
        name: 'Test Player',
        sport: 'NBA',
        team: 'TEST',
        position: 'PG',
        age: 25
      });
      console.log('✓ Test player created:', testPlayer._id);
      
      // Clean up test player
      await Player.deleteOne({ _id: testPlayer._id });
      console.log('✓ Test player cleaned up');
      
    } catch (playerError) {
      console.error('✗ Player creation failed:', playerError.message);
      console.error('Full error:', playerError);
    }
    
    // Step 6: Try to create one sample user
    console.log('\n6️⃣  Testing single user creation...');
    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('test123', 10);
      
      const testUser = await User.create({
        email: `test-${Date.now()}@example.com`,
        password: hashedPassword,
        username: `testuser-${Date.now()}`,
        role: 'user'
      });
      console.log('✓ Test user created:', testUser._id);
      
      // Clean up test user
      await User.deleteOne({ _id: testUser._id });
      console.log('✓ Test user cleaned up');
      
    } catch (userError) {
      console.error('✗ User creation failed:', userError.message);
      console.error('Full error:', userError);
    }
    
  } catch (connectionError) {
    console.error('✗ Database connection failed:', connectionError.message);
    console.error('Full error:', connectionError);
  }
  
} catch (importError) {
  console.error('✗ Failed to import models:', importError.message);
  console.error('Full error:', importError);
}

console.log('\n🔍 Diagnostic complete!');
process.exit(0);
