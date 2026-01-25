const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

// Validate promo code
router.post('/', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        valid: false,
        error: 'Promo code is required'
      });
    }
    
    console.log(`Validating promo code: ${code}`);
    
    const result = await pool.query(
      `
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
        expires_at
      FROM promo_codes 
      WHERE code = $1 
        AND active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND starts_at <= NOW()
      `,
      [code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        valid: false,
        message: 'Invalid or expired promo code'
      });
    }
    
    const promoCode = result.rows[0];
    
    // Check if max uses reached
    if (promoCode.max_uses && promoCode.uses_count >= promoCode.max_uses) {
      return res.json({
        valid: false,
        message: 'This promo code has reached its usage limit'
      });
    }
    
    return res.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discount_type: promoCode.discount_type,
        discount_value: parseFloat(promoCode.discount_value),
        max_uses: promoCode.max_uses,
        uses_count: promoCode.uses_count,
        expires_at: promoCode.expires_at
      }
    });
    
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to validate promo code'
    });
  }
});

module.exports = router;
