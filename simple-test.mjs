// simple-test.mjs
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://jarryexon_db_user:0iZkfgL5v1Eul107@cluster0.kt3bxc.mongodb.net/nba-fantasy?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting...');
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Pinged your deployment. Successfully connected to MongoDB!');
    
    // List databases
    const databasesList = await client.db().admin().listDatabases();
    console.log('Databases:');
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n🔍 Definitely a network/IP issue. Did you:');
      console.log('1. Click "Confirm" after adding IP in Network Access?');
      console.log('2. Wait 1-2 minutes for changes to propagate?');
    }
  } finally {
    await client.close();
  }
}

run();
