-- Add influencer columns to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_commission DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS influencer_since TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_handle VARCHAR(100);

-- Create influencer codes table
CREATE TABLE IF NOT EXISTS influencer_codes (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER REFERENCES users(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    uses_count INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER REFERENCES users(id),
    user_id INTEGER REFERENCES users(id),
    influencer_code_id INTEGER REFERENCES influencer_codes(id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add influencer tracking to promo_codes (if column doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='promo_codes' AND column_name='influencer_code_id') THEN
        ALTER TABLE promo_codes ADD COLUMN influencer_code_id INTEGER REFERENCES influencer_codes(id);
    END IF;
END $$;

-- Update promo_usage to track commissions (if column doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='promo_usage' AND column_name='commission_earned') THEN
        ALTER TABLE promo_usage ADD COLUMN commission_earned DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_influencer_codes_influencer_id ON influencer_codes(influencer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_influencer_id ON commissions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Check if sample influencer user exists, if not create one
INSERT INTO users (username, email, is_influencer, total_commission, referral_count, social_handle) 
SELECT 'nba_influencer', 'influencer@example.com', true, 500.00, 25, '@nba_influencer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'influencer@example.com');

-- Create sample influencer code for the influencer user (if it doesn't exist)
INSERT INTO influencer_codes (influencer_id, code, commission_rate, uses_count, total_commission)
SELECT u.id, 'NBAINFLUENCER', 15.00, 10, 500.00
FROM users u 
WHERE u.email = 'influencer@example.com'
AND NOT EXISTS (SELECT 1 FROM influencer_codes WHERE code = 'NBAINFLUENCER');
