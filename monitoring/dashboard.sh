#!/bin/bash
echo "📊 NBA BACKEND MONITORING DASHBOARD"
echo "==================================="
echo "Real-time at: http://localhost:8080/status"
echo ""
echo "1. PM2 Processes:"
pm2 list
echo ""
echo "2. System Resources:"
top -l 1 | head -10 | tail -5
echo ""
echo "3. API Performance:"
echo "   Avg Response Time: $(curl -s http://localhost:8080/status/metrics | jq -r '.responseTime.mean' 2>/dev/null || echo 'N/A')ms"
echo "   Requests/minute: $(curl -s http://localhost:8080/status/metrics | jq -r '.rps' 2>/dev/null || echo 'N/A')"
echo ""
echo "4. Database Connections:"
echo "   MongoDB: $(mongosh --quiet --eval "db.serverStatus().connections.current" 2>/dev/null || echo 'N/A')"
echo "   Redis: $(redis-cli info clients | grep connected_clients | cut -d: -f2 2>/dev/null || echo 'N/A')"
