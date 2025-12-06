const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

const API_BASE = 'http://localhost:3000';

async function verifySystem() {
  console.log('🔍 FINAL SYSTEM VERIFICATION\n');
  
  try {
    const client = await pool.connect();
    
    // 1. Database verification
    console.log('1. DATABASE VERIFICATION:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'promo_codes', 'promo_usage', 'influencer_commissions', 'user_subscriptions')
      ORDER BY table_name
    `);
    
    console.log(`   Found ${tables.rows.length} required tables:`);
    tables.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));
    
    // 2. Promo codes check
    console.log('\n2. PROMO CODES:');
    const promoCodes = await client.query('SELECT COUNT(*) as count FROM promo_codes');
    console.log(`   Total promo codes: ${promoCodes.rows[0].count}`);
    
    // 3. Test API endpoints
    console.log('\n3. API ENDPOINT TESTS:');
    
    try {
      // Test public endpoint
      const publicRes = await axios.get(`${API_BASE}/api/promo/public`);
      console.log(`   ✅ GET /api/promo/public: ${publicRes.data.promoCodes?.length || 0} codes`);
      
      // Test validation endpoint
      const validateRes = await axios.post(`${API_BASE}/api/promo/validate`, {
        code: 'WELCOME10'
      });
      console.log(`   ✅ POST /api/promo/validate: ${validateRes.data.valid ? 'VALID' : 'INVALID'}`);
      
      // Test application (need a user)
      const users = await client.query('SELECT id FROM users LIMIT 1');
      if (users.rows.length > 0) {
        const userId = users.rows[0].id;
        try {
          const applyRes = await axios.post(`${API_BASE}/api/promo/apply`, {
            code: 'WELCOME10'
          }, {
            headers: { 'x-user-id': userId }
          });
          console.log(`   ✅ POST /api/promo/apply: ${applyRes.data.success ? 'SUCCESS' : 'FAILED'}`);
        } catch (applyError) {
          if (applyError.response?.status === 400 && applyError.response?.data?.error?.includes('already used')) {
            console.log(`   ✅ POST /api/promo/apply: Code already used (expected)`);
          } else {
            console.log(`   ⚠️  POST /api/promo/apply: ${applyError.message}`);
          }
        }
      } else {
        console.log(`   ⚠️  POST /api/promo/apply: No users found for test`);
      }
      
    } catch (apiError) {
      console.log(`   ❌ API Test failed: ${apiError.message}`);
      console.log(`   Make sure server is running: npm start`);
    }
    
    // 4. Usage statistics
    console.log('\n4. USAGE STATISTICS:');
    const usage = await client.query('SELECT COUNT(*) as count FROM promo_usage');
    console.log(`   Total promo usages: ${usage.rows[0].count}`);
    
    const topCodes = await client.query(`
      SELECT code, description, uses_count 
      FROM promo_codes 
      ORDER BY uses_count DESC 
      LIMIT 3
    `);
    
    console.log(`   Top promo codes:`);
    topCodes.rows.forEach(row => {
      console.log(`      ${row.code}: ${row.uses_count} uses`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 SYSTEM VERIFICATION COMPLETE!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Frontend: Add PromoTestScreen to navigation');
    console.log('   2. Test: Apply promo codes through UI');
    console.log('   3. Extend: Add subscription and influencer features');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySystem();
