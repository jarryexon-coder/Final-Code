#!/bin/bash

echo "🧪 Testing All Backend Endpoints"
echo "================================="

echo ""
echo "1. Health Check:"
curl -s http://10.0.0.183:3000/api/promo/health | python3 -m json.tool

echo ""
echo "2. Public Promo Codes:"
curl -s http://10.0.0.183:3000/api/promo/public | python3 -m json.tool

echo ""
echo "3. Validate WELCOME10 (user 999):"
curl -s -X POST http://10.0.0.183:3000/api/promo/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME10", "userId": 999}' | python3 -m json.tool

echo ""
echo "4. Influencer Directory:"
curl -s http://10.0.0.183:3000/api/influencer/directory/public | python3 -m json.tool

echo ""
echo "5. Influencer Analytics (ID 1):"
curl -s http://10.0.0.183:3000/api/influencer/1/analytics | python3 -m json.tool | head -30

echo ""
echo "6. NBA Games Today:"
curl -s http://10.0.0.183:3000/api/nba/games/today | python3 -m json.tool

echo ""
echo "✅ All tests completed!"
