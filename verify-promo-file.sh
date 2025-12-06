#!/bin/bash
echo "=== NBA Fantasy Pro - Promo System File Verification ==="
echo ""

# Basic file info
echo "File: $(ls -la promo-system.md)"
echo "Lines: $(wc -l < promo-system.md)"
echo ""

# Check structure
echo "=== File Structure ==="
echo "1. SQL Schema: $(grep -c "CREATE TABLE" promo-system.md) tables defined"
echo "2. API Routes: $(grep -c "###.*Routes" promo-system.md) route sections"
echo "3. Frontend Components: $(grep -c "###.*Components" promo-system.md) component sections"
echo "4. Implementation Steps: $(grep -c "### Phase" promo-system.md) phases"
echo ""

# Check key elements
echo "=== Key Elements Presence ==="
check_element() {
  if grep -q "$1" promo-system.md; then
    echo "✅ $2"
  else
    echo "❌ $2"
  fi
}

check_element "CREATE TABLE IF NOT EXISTS promo_codes" "Promo codes table"
check_element "CREATE TABLE IF NOT EXISTS promo_usage" "Promo usage table"
check_element "CREATE TABLE IF NOT EXISTS influencer_commissions" "Influencer commissions"
check_element "CREATE TABLE IF NOT EXISTS user_subscriptions" "User subscriptions"
check_element "ALTER TABLE users ADD COLUMN" "User table modifications"
check_element "INSERT INTO promo_codes" "Default promo codes"
check_element "POST /api/promo/validate" "Promo validation route"
check_element "PromoCodeInput Component" "Frontend component"
check_element "STRIPE_SECRET_KEY" "Stripe environment variable"
echo ""

# Check formatting
echo "=== Formatting Check ==="
if grep -q "^```sql" promo-system.md && grep -q "^```$" promo-system.md; then
  echo "✅ Code blocks properly formatted"
else
  echo "❌ Code block formatting issue"
fi

# Check for any obvious errors
echo ""
echo "=== Error Check ==="
if grep -q "error\|ERROR\|Error\|undefined\|null" promo-system.md; then
  echo "⚠️  Found potential error keywords"
  grep -i "error\|undefined\|null" promo-system.md
else
  echo "✅ No error keywords found"
fi

echo ""
echo "=== Verification Complete ==="
