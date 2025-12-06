const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

// GET public promo codes
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/promo/public called');
    
    const result = await pool.query(`
      SELECT 
        id, 
        code, 
        description, 
        discount_type, 
        discount_value, 
        max_uses, 
        uses_count, 
        is_public,
        active,
        starts_at,
        expires_at,
        created_at,
        updated_at
      FROM promo_codes 
      WHERE is_public = true 
        AND active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND starts_at <= NOW()
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} public promo codes`);
    
    // Format the response
    const promoCodes = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      description: row.description,
      discount_type: row.discount_type,
      discount_value: parseFloat(row.discount_value),
      max_uses: row.max_uses,
      uses_count: row.uses_count,
      is_public: row.is_public,
      active: row.active,
      starts_at: row.starts_at,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json({
      success: true,
      promoCodes: promoCodes,
      count: promoCodes.length
    });
    
  } catch (error) {
    console.error('Error fetching public promo codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promo codes'
    });
  }
});

module.exports = router;
