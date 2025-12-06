#!/bin/bash
echo "🔍 Checking ALL Endpoints"

endpoints=(
  "/health"
  "/api/nba/games/today"
  "/api/nba/players"
  "/api/nba/betting/odds"
  "/api/nba/fantasy/advice"
  "/api/promo/public"
  "/api/influencer/directory/public"
)

for endpoint in "${endpoints[@]}"; do
  echo -n "Testing $endpoint... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
  if [ "$status" = "200" ]; then
    echo "✅ $status"
  elif [ "$status" = "429" ]; then
    echo "⚠️  $status (Rate Limited)"
  else
    echo "❌ $status"
  fi
done

echo ""
echo "📊 Summary: All endpoints should return 200"
