const { Pool } = require('pg');

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📊 Available tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    // Check promo codes
    const promoCodes = await client.query('SELECT code, description FROM promo_codes');
    console.log('\n🎯 Promo codes:');
    promoCodes.rows.forEach(row => console.log(`   - ${row.code}: ${row.description}`));
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
