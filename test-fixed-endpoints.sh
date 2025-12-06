#!/bin/bash

echo "🧪 Testing Fixed Backend Endpoints"
echo "==================================="

echo ""
echo "1. Health Check:"
curl -s http://10.0.0.183:3000/api/promo/health | python3 -m json.tool

echo ""
echo "2. Influencer Health:"
curl -s http://10.0.0.183:3000/api/influencer/health | python3 -m json.tool

echo ""
echo "3. Influencer Directory:"
curl -s http://10.0.0.183:3000/api/influencer/directory/public | python3 -m json.tool

echo ""
echo "4. Influencer Analytics (ID 1):"
curl -s http://10.0.0.183:3000/api/influencer/1/analytics | python3 -m json.tool | head -40

echo ""
echo "5. Generate Influencer Code:"
curl -s -X POST http://10.0.0.183:3000/api/influencer/generate-code \
  -H "Content-Type: application/json" \
  -d '{"influencerId": 1, "code": "TESTCODE", "commissionRate": 12.5}' | python3 -m json.tool

echo ""
echo "6. Promo Validation:"
curl -s -X POST http://10.0.0.183:3000/api/promo/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME10", "userId": 999}' | python3 -m json.tool

echo ""
echo "7. NBA Games Today:"
curl -s http://10.0.0.183:3000/api/nba/games/today | python3 -m json.tool

echo ""
echo "✅ All tests completed!"
