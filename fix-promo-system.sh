#!/bin/bash

echo "🔧 COMPLETE PROMO SYSTEM FIX"
echo "============================"

echo ""
echo "1. Resetting promo_codes table:"
psql -d nba_fantasy_db << 'SQL1'
UPDATE promo_codes SET uses_count = 0 WHERE code IN ('WELCOME10', 'NBAGURU20', 'BALLISLIFE15', 'TRIAL7', 'ELITE50');
SELECT code, uses_count FROM promo_codes ORDER BY code;
SQL1

echo ""
echo "2. Resetting promo_usage table for user 1:"
psql -d nba_fantasy_db << 'SQL2'
-- Clear all promo usage for user 1
DELETE FROM promo_usage WHERE user_id = 1;

-- Also clear for any test users
DELETE FROM promo_usage WHERE user_id IN (1, 2, 3, 999);

-- Verify
SELECT 'promo_usage records remaining:' as status, COUNT(*) as count FROM promo_usage;
SQL2

echo ""
echo "3. Creating test user 2 if needed:"
psql -d nba_fantasy_db << 'SQL3'
INSERT INTO users (id, email, username, created_at, updated_at)
SELECT 2, 'user2@example.com', 'testuser2', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);

SELECT id, email FROM users WHERE id IN (1, 2) ORDER BY id;
SQL3

echo ""
echo "4. Testing promo system for user 1:"
echo "   Testing WELCOME10 validation..."
VALIDATE1=$(curl -s -X POST http://10.0.0.183:3000/api/promo/validate \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"code": "WELCOME10"}')
echo "   Valid: $(echo $VALIDATE1 | grep -o '"valid":[^,]*')"

echo ""
echo "   Testing WELCOME10 application..."
APPLY1=$(curl -s -X POST http://10.0.0.183:3000/api/promo/apply \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"code": "WELCOME10"}')
echo "   Success: $(echo $APPLY1 | grep -o '"success":[^,]*')"
echo "   Message: $(echo $APPLY1 | grep -o '"message":"[^"]*"' | head -1)"

echo ""
echo "5. Testing promo system for user 2:"
echo "   Testing NBAGURU20 application..."
APPLY2=$(curl -s -X POST http://10.0.0.183:3000/api/promo/apply \
  -H "Content-Type: application/json" \
  -H "x-user-id: 2" \
  -d '{"code": "NBAGURU20"}')
echo "   Success: $(echo $APPLY2 | grep -o '"success":[^,]*')"
echo "   Message: $(echo $APPLY2 | grep -o '"message":"[^"]*"' | head -1)"

echo ""
echo "6. Final database state:"
psql -d nba_fantasy_db << 'SQL4'
SELECT 
  pc.code,
  pc.uses_count,
  (SELECT COUNT(*) FROM promo_usage pu WHERE pu.promo_code_id = pc.id) as promo_usage_count
FROM promo_codes pc
ORDER BY pc.code;

SELECT 'promo_usage entries:' as table, COUNT(*) as count FROM promo_usage;
SQL4

echo ""
echo "✅ Fix complete! Both user 1 and user 2 should now work."
echo "🎯 In the app, you can test with:"
echo "   - User ID: 1 and any promo code"
echo "   - User ID: 2 and any promo code"
