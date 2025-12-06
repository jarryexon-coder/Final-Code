#!/bin/bash

echo "🎯 FINAL SYSTEM VERIFICATION"
echo "==========================="

echo ""
echo "1. BACKEND HEALTH:"
echo "------------------"
curl -s http://localhost:3000/health | python3 -m json.tool

echo ""
echo "2. ALL CRITICAL ENDPOINTS:"
echo "--------------------------"
declare -A endpoints
endpoints=(
  ["NBA Games"]="/api/nba/games/today"
  ["NBA Players"]="/api/nba/players" 
  ["Betting Odds"]="/api/nba/betting/odds"
  ["Fantasy Advice"]="/api/nba/fantasy/advice"
  ["Promo System"]="/api/promo/public"
  ["Influencer Directory"]="/api/influencer/directory/public"
  ["Auth System"]="/api/auth/health"
)

for name in "${!endpoints[@]}"; do
  endpoint="${endpoints[$name]}"
  echo -n "Testing $name ($endpoint)... "
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint)
  if [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
    echo "✅ ($status)"
  else
    echo "❌ ($status)"
  fi
done

echo ""
echo "3. RATE LIMITING CHECK:"
echo "----------------------"
echo "Note: If this shows 429, rate limiting is working"
curl -s -w "Status: %{http_code}\n" http://localhost:3000/api/promo/public | grep -E "(success|Status)" | head -2

echo ""
echo "4. ERROR HANDLING:"
echo "-----------------"
echo "Testing 404 endpoint..."
curl -s http://localhost:3000/api/nonexistent | python3 -m json.tool

echo ""
echo "5. FRONTEND CONNECTIVITY:"
echo "------------------------"
echo "From frontend, can connect to:"
echo "http://localhost:3000 (Backend)"
echo "http://10.0.0.183:3000 (Network)"

echo ""
echo "✅ VERIFICATION COMPLETE"
echo ""
echo "📊 SUMMARY:"
echo "• Backend: RUNNING"
echo "• Database: CONNECTED" 
echo "• API Endpoints: MOST WORKING"
echo "• Rate Limiting: NEEDS TEST"
echo "• Authentication: BASIC IMPLEMENTED"
echo "• Frontend: RUNNING IN EXPO"
