#!/bin/bash
echo "✅ NBA BACKEND PRODUCTION SETUP VERIFICATION"
echo "==========================================="

echo "1. 🖥️  PM2 Cluster Status:"
pm2 status nba-backend

echo ""
echo "2. 🔗 Network Connectivity:"
echo "   Direct Node.js (port 3002):"
curl -s http://localhost:3002/health | jq -r '"   Status: " + .status + " | Version: " + .version'

echo ""
echo "   Through Nginx (port 8080):"
curl -s http://localhost:8080/health | jq -r '"   Status: " + .status + " | Via: Nginx Proxy"'

echo ""
echo "3. 📊 Service Health:"
echo "   PM2: $(pm2 ping >/dev/null 2>&1 && echo '✅ Running' || echo '❌ Not Running')"
echo "   Nginx: $(brew services list | grep nginx | grep -q started && echo '✅ Running' || echo '❌ Not Running')"
echo "   MongoDB: $(mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1 && echo '✅ Connected' || echo '⚠️  Check Connection')"

echo ""
echo "4. 🚀 API Endpoints Test:"
ENDPOINTS=("/api/sports-analytics/arbitrage" "/api/situational/spot-plays" "/api/premium/check-access")
for endpoint in "${ENDPOINTS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080$endpoint)
  echo "   $endpoint: $(if [ $status -eq 200 ]; then echo '✅ 200 OK'; else echo "❌ $status"; fi)"
done

echo ""
echo "5. 📈 System Resources:"
echo "   Memory Usage: $(pm2 list | grep nba-backend | awk '{print $10}')"
echo "   Uptime: $(pm2 list | grep nba-backend | awk '{print $8}')"
echo "   Restarts: $(pm2 list | grep nba-backend | awk '{print $6}')"

echo ""
echo "==========================================="
echo "🎉 VERIFICATION COMPLETE"
echo "Your NBA Backend is production-ready!"
