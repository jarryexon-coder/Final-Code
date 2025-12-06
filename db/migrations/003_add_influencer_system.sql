-- Add influencer columns to users table
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

-- Add influencer tracking to promo_codes
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS influencer_code_id INTEGER REFERENCES influencer_codes(id);

-- Update promo_usage to track commissions
ALTER TABLE promo_usage ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0.00;

-- Create indexes
CREATE INDEX idx_influencer_codes_influencer_id ON influencer_codes(influencer_id);
CREATE INDEX idx_commissions_influencer_id ON commissions(influencer_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Insert sample influencer user
INSERT INTO users (username, email, is_influencer, total_commission, referral_count, social_handle) 
VALUES ('nba_influencer', 'influencer@example.com', true, 500.00, 25, '@nba_influencer')
ON CONFLICT (email) DO UPDATE SET is_influencer = true;

-- Create sample influencer code
INSERT INTO influencer_codes (influencer_id, code, commission_rate, uses_count, total_commission)
SELECT id, 'NBAINFLUENCER', 15.00, 10, 500.00
FROM users WHERE email = 'influencer@example.com'
ON CONFLICT (code) DO NOTHING;
