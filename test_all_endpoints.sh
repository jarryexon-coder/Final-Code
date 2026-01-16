#!/bin/bash

BASE_URL="https://pleasing-determination-production.up.railway.app"
echo "=== Testing Full Application Restore ==="
echo "Base URL: $BASE_URL"
echo ""

# Define test functions
test_endpoint() {
  local name=$1
  local path=$2
  local expected_code=$3
  local auth_header=$4
  
  echo -n "Testing $name ($path): "
  status_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "$auth_header" \
    "$BASE_URL$path")
  
  if [ "$status_code" == "$expected_code" ]; then
    echo "✅ PASS (HTTP $status_code)"
  else
    echo "❌ FAIL (Expected $expected_code, got $status_code)"
  fi
}

# 1. Public Core Endpoints
echo "--- Public Core Endpoints ---"
test_endpoint "Root" "/" 200
test_endpoint "Health" "/health" 200
test_endpoint "API Health" "/api/health" 200
test_endpoint "Privacy" "/privacy" 200
test_endpoint "Database Health" "/api/database/health" 200
test_endpoint "Status Monitor" "/status" 200
test_endpoint "API Docs" "/api-docs" 200

# 2. Public Sports Data Endpoints
echo -e "\n--- Public Sports Data ---"
test_endpoint "NBA Teams" "/api/nba/teams" 200
test_endpoint "NBA Players" "/api/nba/players" 200
test_endpoint "Live Games" "/api/games" 200
test_endpoint "News" "/api/news" 200

# 3. Protected Endpoints (should return 401 without token)
echo -e "\n--- Protected Endpoints (Auth Required) ---"
test_endpoint "Secret Phrases" "/api/secret-phrases" 401
test_endpoint "Premium Validate" "/api/premium/validate/test-user" 401

# 4. Analytics & Specialized Endpoints
echo -e "\n--- Analytics & Specialized ---"
test_endpoint "Sports Analytics Arbitrage" "/api/sports-analytics/arbitrage?sport=NBA" 200
test_endpoint "Situational Spot Plays" "/api/situational/spot-plays?sport=NBA" 200

echo -e "\n=== Testing Complete ==="
