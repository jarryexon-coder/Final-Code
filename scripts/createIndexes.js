import { connectDB, Player, Team, Stat, Game } from '../models/index.js';

async function createIndexes() {
  try {
    await connectDB();
    
    console.log('Creating text indexes...');
    
    // Player indexes
    await Player.collection.createIndex(
      { name: 'text', team: 'text', position: 'text', college: 'text' },
      {
        name: 'player_text_search',
        weights: {
          name: 10,
          team: 5,
          position: 3,
          college: 2
        },
        default_language: 'english'
      }
    );
    
    // Team indexes
    await Team.collection.createIndex(
      { name: 'text', city: 'text', conference: 'text', division: 'text' },
      {
        name: 'team_text_search',
        weights: {
          name: 10,
          city: 5,
          conference: 3,
          division: 2
        }
      }
    );
    
    // Game indexes
    await Game.collection.createIndex(
      { 
        'homeTeam.name': 'text', 
        'awayTeam.name': 'text',
        location: 'text',
        stadium: 'text'
      },
      {
        name: 'game_text_search',
        weights: {
          'homeTeam.name': 5,
          'awayTeam.name': 5,
          location: 2,
          stadium: 1
        }
      }
    );
    
    // Compound indexes for common queries
    await Player.collection.createIndex({ sport: 1, fantasyPoints: -1 });
    await Player.collection.createIndex({ sport: 1, team: 1, position: 1 });
    await Player.collection.createIndex({ sport: 1, position: 1, fantasyPoints: -1 });
    
    await Team.collection.createIndex({ sport: 1, 'record.winPercentage': -1 });
    await Team.collection.createIndex({ sport: 1, conference: 1, division: 1 });
    
    await Game.collection.createIndex({ sport: 1, date: 1, status: 1 });
    await Game.collection.createIndex({ sport: 1, 'homeTeam.id': 1, date: -1 });
    
    console.log('✅ All indexes created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
