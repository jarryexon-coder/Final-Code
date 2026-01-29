#!/bin/bash

BASE_URL="http://localhost:3002"
echo "🧪 Testing NBA Fantasy AI Backend at $BASE_URL"

# Test endpoints
endpoints=(
  "/health"
  "/api/health"
  "/api/debug"
  "/api/auth"
  "/api/auth/register"
  "/api/auth/health"
  "/api/nba"
  "/api/fantasy"
  "/api/predictions"
  "/api/games"
  "/api/players"
  "/api/teams"
  "/api/analytics"
  "/api/betting"
  "/api/admin"
  "/api/secret-phrases"
  "/api/news"
)

echo "========================================="
for endpoint in "${endpoints[@]}"; do
  echo -n "Testing $endpoint... "
  response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
  if [ "$response" = "200" ] || [ "$response" = "201" ]; then
    echo "✅ ($response)"
  else
    echo "❌ ($response)"
    # Show error details
    curl -s "${BASE_URL}${endpoint}" | head -c 200
    echo ""
  fi
  sleep 0.1 # Small delay to avoid overwhelming
done
echo "========================================="
echo "✅ Testing complete!"
