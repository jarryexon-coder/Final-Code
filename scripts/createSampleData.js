async function createSampleData() {
  try {
    await connectDB();
    
    console.log('Creating sample data...');
    
    // Create sample players if we have less than 5
    const playerCount = await Player.countDocuments();
    if (playerCount < 10) {
      console.log(`Found ${playerCount} players, creating more...`);
      await createSamplePlayers();
    }
    
    // Create sample users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Creating sample users...');
      await createSampleUsers();
    }
    
    // Create sample selections if none exist
    const selectionCount = await Selection.countDocuments();
    if (selectionCount === 0) {
      console.log('Creating sample selections...');
      await createSampleSelections();
    }
    
    console.log('✅ Sample data creation complete!');
    console.log(`🏀 Total Players: ${await Player.countDocuments()}`);
    console.log(`👤 Total Users: ${await User.countDocuments()}`);
    console.log(`🎯 Total Selections: ${await Selection.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
}
