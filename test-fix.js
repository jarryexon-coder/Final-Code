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
    console.log('✅ Connected to database as jerryexon!');
    
    // Test promo codes query
    const result = await client.query(`
      SELECT code, description, discount_type, discount_value, uses_count, max_uses 
      FROM promo_codes 
      WHERE active = true
    `);
    
    console.log(`\n📊 Found ${result.rows.length} active promo codes:`);
    result.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.description} (${row.uses_count}/${row.max_uses || '∞'} uses)`);
    });
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

test();
