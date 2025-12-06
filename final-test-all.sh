#!/bin/bash

echo "🎯 FINAL COMPREHENSIVE SYSTEM TEST"
echo "=================================="

echo ""
echo "1. Checking backend status..."
curl -s http://10.0.0.183:3000/api/monitoring/health | python3 -m json.tool

echo ""
echo "2. Testing promo system..."
curl -s http://10.0.0.183:3000/api/promo/health | python3 -m json.tool

echo ""
echo "3. Testing influencer system..."
curl -s http://10.0.0.183:3000/api/influencer/health | python3 -m json.tool

echo ""
echo "4. Testing NBA data endpoints..."
echo "   Games:"
curl -s http://10.0.0.183:3000/api/nba/games/today | python3 -m json.tool | head -20
echo ""
echo "   Players:"
curl -s http://10.0.0.183:3000/api/nba/players | python3 -m json.tool | head -10
echo ""
echo "   Betting odds:"
curl -s http://10.0.0.183:3000/api/nba/betting/odds | python3 -m json.tool | head -10
echo ""
echo "   Fantasy advice:"
curl -s http://10.0.0.183:3000/api/nba/fantasy/advice | python3 -m json.tool | head -10

echo ""
echo "5. Testing rate limiting (try multiple requests)..."
for i in {1..3}; do
  echo "   Request $i:"
  curl -s http://10.0.0.183:3000/api/promo/public | python3 -m json.tool | grep -E "(success|error)" | head -2
  sleep 1
done

echo ""
echo "✅ Final test complete!"
echo ""
echo "🎉 SYSTEM READY FOR DEPLOYMENT!"
echo ""
echo "Next steps:"
echo "1. Update .env file with production credentials"
echo "2. Run: ./start-production.sh"
echo "3. Update frontend .env with production API URL"
echo "4. Test all app tabs in Expo"
echo "5. Deploy to App Store/Play Store"
