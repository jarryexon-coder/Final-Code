#!/bin/bash
echo "🎯 END-TO-END SYSTEM TEST"
echo "========================"

echo "1. Backend Health:"
curl -s http://localhost:3000/health | python3 -m json.tool

echo ""
echo "2. All NBA Endpoints:"
endpoints=("games/today" "players" "betting/odds" "fantasy/advice")
for endpoint in "${endpoints[@]}"; do
  echo "Testing: /api/nba/$endpoint"
  curl -s "http://localhost:3000/api/nba/$endpoint" | python3 -m json.tool | head -5
  echo ""
done

echo ""
echo "3. Promo System:"
curl -s http://localhost:3000/api/promo/public | python3 -m json.tool

echo ""
echo "4. Influencer System:"
curl -s http://localhost:3000/api/influencer/directory/public | python3 -m json.tool | head -10

echo ""
echo "✅ E2E Test Complete"
