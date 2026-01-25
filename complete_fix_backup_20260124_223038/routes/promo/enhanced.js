const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

// Get public promo codes
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT code, discount_type, discount_value, description 
       FROM promo_codes 
       WHERE active = true AND expires_at > NOW() 
       ORDER BY created_at DESC`
    );
    
    res.json({ success: true, promoCodes: result.rows });
  } catch (error) {
    console.error('Error fetching public promo codes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate promo code
router.post('/validate', async (req, res) => {
  try {
    const { code, userId } = req.body;
    
    const result = await pool.query(
      `SELECT pc.*, 
              (SELECT COUNT(*) FROM promo_usage 
               WHERE promo_code_id = pc.id AND user_id = $2) as user_used_count
       FROM promo_codes pc
       WHERE pc.code = $1 AND pc.active = true`,
      [code, userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Promo code not found or inactive' });
    }
    
    const promo = result.rows[0];
    const now = new Date();
    
    // Check expiration
    if (promo.expires_at && new Date(promo.expires_at) < now) {
      return res.json({ success: false, message: 'Promo code has expired' });
    }
    
    // Check if user already used this code
    if (promo.user_used_count > 0) {
      return res.json({ success: false, message: 'You have already used this promo code' });
    }
    
    res.json({ 
      success: true, 
      message: 'Promo code is valid',
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply promo code
router.post('/apply', async (req, res) => {
  try {
    const { code, userId } = req.body;
    
    const result = await pool.query(
      `SELECT pc.*, 
              (SELECT COUNT(*) FROM promo_usage 
               WHERE promo_code_id = pc.id AND user_id = $2) as user_used_count
       FROM promo_codes pc
       WHERE pc.code = $1 AND pc.active = true`,
      [code, userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Promo code not found' });
    }
    
    const promo = result.rows[0];
    const now = new Date();
    
    // Check expiration
    if (promo.expires_at && new Date(promo.expires_at) < now) {
      return res.json({ success: false, message: 'Promo code has expired' });
    }
    
    // Check if user already used this code
    if (promo.user_used_count > 0) {
      return res.json({ success: false, message: 'You have already used this promo code' });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Record usage
    await pool.query(
      'INSERT INTO promo_usage (user_id, promo_code_id) VALUES ($1, $2)',
      [userId, promo.id]
    );
    
    // Update usage count
    await pool.query(
      'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
      [promo.id]
    );
    
    await pool.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Promo code applied successfully!',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error applying promo code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
