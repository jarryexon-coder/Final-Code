const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  user: 'jerryexon',
  host: 'localhost',
  database: 'nba_fantasy_db',
  port: 5432,
});

// Apply promo code
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { code } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required in x-user-id header'
      });
    }
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Promo code is required'
      });
    }
    
    console.log(`Applying promo code ${code} for user ${userId}`);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Check if promo code is valid
      const promoResult = await client.query(
        `
        SELECT 
          id, 
          code, 
          description, 
          discount_type, 
          discount_value, 
          max_uses, 
          uses_count,
          active,
          starts_at,
          expires_at
        FROM promo_codes 
        WHERE code = $1 
          AND active = true
          AND (expires_at IS NULL OR expires_at > NOW())
          AND starts_at <= NOW()
        FOR UPDATE
        `,
        [code.toUpperCase()]
      );
      
      if (promoResult.rows.length === 0) {
        throw new Error('Invalid or expired promo code');
      }
      
      const promoCode = promoResult.rows[0];
      
      // Check if max uses reached
      if (promoCode.max_uses && promoCode.uses_count >= promoCode.max_uses) {
        throw new Error('This promo code has reached its usage limit');
      }
      
      // Check if user already used this code
      const usageCheck = await client.query(
        'SELECT id FROM promo_usage WHERE user_id = $1 AND promo_code_id = $2',
        [userId, promoCode.id]
      );
      
      if (usageCheck.rows.length > 0) {
        throw new Error('You have already used this promo code');
      }
      
      // Record the usage
      await client.query(
        `
        INSERT INTO promo_usage (user_id, promo_code_id, applied_at)
        VALUES ($1, $2, NOW())
        `,
        [userId, promoCode.id]
      );
      
      // Update usage count
      await client.query(
        `
        UPDATE promo_codes 
        SET uses_count = uses_count + 1, updated_at = NOW()
        WHERE id = $1
        `,
        [promoCode.id]
      );
      
      // If it's a trial code, create a subscription
      if (promoCode.discount_type === 'trial') {
        const trialDays = parseInt(promoCode.discount_value);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + trialDays);
        
        await client.query(
          `
          INSERT INTO user_subscriptions (user_id, tier, status, expires_at, created_at, updated_at)
          VALUES ($1, 'premium', 'active', $2, NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE 
          SET tier = 'premium', status = 'active', expires_at = $2, updated_at = NOW()
          `,
          [userId, expiresAt]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Promo code applied successfully',
        promoCode: {
          code: promoCode.code,
          description: promoCode.description,
          discount_type: promoCode.discount_type,
          discount_value: parseFloat(promoCode.discount_value),
          new_usage_count: promoCode.uses_count + 1
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error applying promo code:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
