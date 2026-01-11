// Seed secret phrases into the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_PHRASES = [
  {
    key: '26snake_anchor',
    triggers: ['26snakeanchor', 'snake anchor', 'first round lock'],
    category: 'snake_draft',
    requiresPremium: true,
    description: 'Identifies elite superstars for 1st/2nd round picks',
    rarity: 'rare'
  },
  {
    key: '26gpp_leverage',
    triggers: ['26gppleverage', 'gpp leverage', 'tournament leverage'],
    category: 'gpp_tournament',
    requiresPremium: true,
    description: 'Finds leverage plays with low ownership projections',
    rarity: 'legendary'
  },
  {
    key: '26kalshi_inefficiency',
    triggers: ['26kalshiinefficiency', 'kalshi inefficiency', 'market misprice'],
    category: 'kalshi_bets',
    requiresPremium: true,
    description: 'Finds contracts where market price differs from model probability',
    rarity: 'rare'
  },
  {
    key: 'arbitrage',
    triggers: ['arbitrage', 'line shopping', 'best odds'],
    category: 'advanced_analytics',
    requiresPremium: true,
    description: 'Finds line discrepancies across sportsbooks',
    rarity: 'rare'
  },
  {
    key: 'spot_play',
    triggers: ['spot play', 'situational edge', 'schedule spot'],
    category: 'situational_analysis',
    requiresPremium: false,
    description: 'Identifies situational advantages',
    rarity: 'uncommon'
  }
];

async function seedSecretPhrases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nba_fantasy_ai');
    
    const db = mongoose.connection.db;
    const collection = db.collection('secret_phrases');
    
    // Clear existing phrases
    await collection.deleteMany({});
    
    // Insert new phrases
    const result = await collection.insertMany(SECRET_PHRASES);
    
    console.log(`✅ Successfully seeded ${result.insertedCount} secret phrases`);
    
    // Create index for faster lookup
    await collection.createIndex({ key: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ requiresPremium: 1 });
    
    console.log('✅ Created indexes for secret phrases');
    
    // Verify the seed
    const count = await collection.countDocuments();
    console.log(`📊 Total phrases in database: ${count}`);
    
    // List all phrases
    const phrases = await collection.find({}).toArray();
    console.log('\n📝 Seeded Phrases:');
    phrases.forEach(phrase => {
      console.log(`   - ${phrase.key} (${phrase.category}): ${phrase.description}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error seeding secret phrases:', error);
    process.exit(1);
  }
}

seedSecretPhrases();
