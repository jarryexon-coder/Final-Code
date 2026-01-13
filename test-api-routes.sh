#!/bin/bash

BASE_URL="https://pleasing-determination-production.up.railway.app"

echo "=== Testing API Routes ==="
echo ""

# Test public routes
echo "1. Public Routes:"
public_routes=(
  "/api/nba/teams"
  "/api/nba/players"
  "/api/nhl/teams"
  "/api/nfl/teams"
  "/api/news"
)

for route in "${public_routes[@]}"; do
  echo -n "  $route: "
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route" | grep -q "200\|201\|304"; then
    echo "✅"
  else
    echo "❌"
  fi
done

echo ""
echo "2. Authentication Required Routes (should return 401/403):"
auth_routes=(
  "/api/secret-phrases"
  "/api/premium/validate/test"
)

for route in "${auth_routes[@]}"; do
  echo -n "  $route: "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  if [ "$status" = "401" ] || [ "$status" = "403" ]; then
    echo "✅ (correctly requires auth: $status)"
  else
    echo "⚠️  (unexpected: $status)"
  fi
done

echo ""
echo "=== Test Complete ==="
