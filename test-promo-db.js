const { Pool } = require('pg');

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

async function testPromoDB() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test promo_codes table
    const result = await client.query('SELECT COUNT(*) FROM promo_codes');
    console.log(`✅ promo_codes table has ${result.rows[0].count} records`);
    
    // Test users table
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ users table has ${usersResult.rows[0].count} records`);
    
    // List promo codes
    const promoCodes = await client.query('SELECT code, description FROM promo_codes');
    console.log('✅ Available promo codes:');
    promoCodes.rows.forEach(row => {
      console.log(`   - ${row.code}: ${row.description}`);
    });
    
    client.release();
    await pool.end();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testPromoDB();
