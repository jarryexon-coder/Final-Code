-- Add promo system tables
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'trial')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER DEFAULT 0,
  influencer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE CASCADE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discount_applied DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS influencer_commissions (
  id SERIAL PRIMARY KEY,
  influencer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  commission_amount DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'elite')),
  promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add influencer flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS influencer_tier VARCHAR(20) DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_commission DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- Insert default promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses) VALUES
  ('WELCOME10', 'Welcome discount for new users', 'percentage', 10.00, 1000),
  ('NBAGURU20', 'NBA Guru influencer special', 'percentage', 20.00, 500),
  ('BALLISLIFE15', 'Ball is Life community code', 'percentage', 15.00, 300),
  ('TRIAL7', '7-day premium trial', 'trial', 7.00, 1000),
  ('ELITE50', '50% off Elite tier', 'percentage', 50.00, 100);
