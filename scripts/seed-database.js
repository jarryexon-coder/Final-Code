import 'dotenv/config';
import { connectDB, Player, User, Selection } from '../models/index.js';
import bcrypt from 'bcryptjs';

console.log('🚀 Starting database seed script...');

async function seedDatabase() {
  try {
    console.log('1. Connecting to database...');
    await connectDB();
    
    console.log('2. Clearing all existing data...');
    const deleteResults = await Promise.all([
      Player.deleteMany({}),
      User.deleteMany({}),
      Selection.deleteMany({})
    ]);
    console.log(`   Deleted: ${deleteResults[0].deletedCount} players, ${deleteResults[1].deletedCount} users, ${deleteResults[2].deletedCount} selections`);
    
    console.log('3. Creating sample players...');
    const players = await createSamplePlayers();
    console.log(`   Created ${players.length} players`);
    
    console.log('4. Creating sample users...');
    const users = await createSampleUsers();
    console.log(`   Created ${users.length} users`);
    
    console.log('5. Creating sample selections...');
    const selections = await createSampleSelections(users, players);
    console.log(`   Created ${selections.length} selections`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Final counts:');
    console.log(`   Players: ${await Player.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Selections: ${await Selection.countDocuments()}`);
    
    console.log('\n🔑 Sample login credentials:');
    console.log('   admin@example.com / admin123');
    console.log('   premium@example.com / premium123');
    console.log('   user@example.com / user123');
    
    console.log('\n🏀 Test with:');
    console.log('   node -e "import(\'./models/index.js\').then(m => m.connectDB().then(() => console.log(`Players: ${m.Player.countDocuments()}`)))"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

async function createSamplePlayers() {
  const nbaPlayers = [
    {
      externalId: 'lebron-james-2024',
      name: 'LeBron James',
      sport: 'NBA',
      team: 'LAL',
      position: 'SF',
      age: 39,
      stats: { season: '2023-24', games: 67, points: 25.3, rebounds: 7.9, assists: 7.3, steals: 1.2, blocks: 0.6 },
      fantasyPoints: 312,
      fantasyRank: 5,
      isPremium: true,
      salary: '$47,607,350'
    },
    {
      externalId: 'stephen-curry-2024',
      name: 'Stephen Curry',
      sport: 'NBA',
      team: 'GSW',
      position: 'PG',
      age: 36,
      stats: { season: '2023-24', games: 72, points: 27.5, rebounds: 4.5, assists: 5.0, steals: 0.9, blocks: 0.3 },
      fantasyPoints: 298,
      fantasyRank: 8,
      isPremium: true,
      salary: '$51,915,615'
    },
    {
      externalId: 'giannis-antetokounmpo-2024',
      name: 'Giannis Antetokounmpo',
      sport: 'NBA',
      team: 'MIL',
      position: 'PF',
      age: 29,
      stats: { season: '2023-24', games: 73, points: 30.8, rebounds: 11.5, assists: 6.3, steals: 1.2, blocks: 1.3 },
      fantasyPoints: 345,
      fantasyRank: 1,
      isPremium: true,
      salary: '$45,640,084'
    },
    {
      externalId: 'luka-doncic-2024',
      name: 'Luka Dončić',
      sport: 'NBA',
      team: 'DAL',
      position: 'PG',
      age: 25,
      stats: { season: '2023-24', games: 70, points: 33.9, rebounds: 9.2, assists: 9.8, steals: 1.4, blocks: 0.6 },
      fantasyPoints: 338,
      fantasyRank: 2,
      isPremium: true,
      salary: '$40,064,220'
    },
    {
      externalId: 'nikola-jokic-2024',
      name: 'Nikola Jokić',
      sport: 'NBA',
      team: 'DEN',
      position: 'C',
      age: 29,
      stats: { season: '2023-24', games: 79, points: 26.4, rebounds: 12.4, assists: 9.0, steals: 1.4, blocks: 0.9 },
      fantasyPoints: 326,
      fantasyRank: 3,
      isPremium: true,
      salary: '$47,607,350'
    }
  ];
  
  return await Player.insertMany(nbaPlayers);
}

async function createSampleUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const premiumPassword = await bcrypt.hash('premium123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  
  const users = await User.create([
    {
      email: 'admin@example.com',
      password: adminPassword,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      subscription: {
        planId: 'elite_yearly',
        status: 'active',
        active: true,
        features: ['all-access', 'premium-analytics', 'unlimited-selections']
      }
    },
    {
      email: 'premium@example.com',
      password: premiumPassword,
      username: 'premium',
      firstName: 'Premium',
      lastName: 'User',
      role: 'user',
      subscription: {
        planId: 'pro_yearly',
        status: 'active',
        active: true,
        features: ['premium-analytics', 'unlimited-selections']
      }
    },
    {
      email: 'user@example.com',
      password: userPassword,
      username: 'user',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      subscription: {
        planId: 'free',
        status: 'active',
        active: true,
        features: ['basic-analytics', 'limited-selections']
      }
    }
  ]);
  
  return users;
}

async function createSampleSelections(users, players) {
  if (!users.length || players.length < 3) {
    console.log('⚠️  Not enough users or players to create selections');
    return [];
  }
  
  const sampleSelections = [];
  const today = new Date();
  
  // Create 3 sample selections
  for (let i = 0; i < 3; i++) {
    const user = users[i % users.length];
    
    // Pick 3 unique players
    const selectedPlayers = [];
    while (selectedPlayers.length < 3) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      if (!selectedPlayers.find(p => p._id.equals(randomPlayer._id))) {
        selectedPlayers.push(randomPlayer);
      }
    }
    
    const winners = selectedPlayers.map((player, idx) => ({
      playerId: player._id,
      playerName: player.name,
      playerTeam: player.team,
      pick: idx === 0 ? 'Over 25.5 points' : idx === 1 ? 'Over 10.5 rebounds' : 'Over 8.5 assists',
      market: idx === 0 ? 'points' : idx === 1 ? 'rebounds' : 'assists',
      line: idx === 0 ? 25.5 : idx === 1 ? 10.5 : 8.5,
      odds: '-110',
      confidence: 75 + (i * 5),
      result: 'pending'
    }));
    
    sampleSelections.push({
      userId: user._id,
      type: 'parlay',
      sport: 'NBA',
      winners,
      totalOdds: '+600',
      confidence: 80,
      edgeScore: 8.5,
      bumpRisk: 'Low',
      status: 'active',
      result: 'pending',
      stake: 10,
      potentialPayout: 60,
      actualPayout: 0,
      gameDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000) // Next few days
    });
  }
  
  return await Selection.insertMany(sampleSelections);
}

seedDatabase();
