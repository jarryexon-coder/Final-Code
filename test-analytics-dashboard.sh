#!/bin/bash

# Test script for Analytics Dashboard

echo "🚀 Testing Analytics Dashboard Connection"
echo "=========================================="

# Check if analytics dashboard backend is running
ANALYTICS_BACKEND_URL="http://localhost:3005"
NBA_BACKEND_URL="http://localhost:3002"

echo "1️⃣  Checking NBA Backend..."
curl -s -f "$NBA_BACKEND_URL/health" && echo "✅ NBA Backend is running" || echo "❌ NBA Backend is not running"

echo -e "\n2️⃣  Testing Analytics Endpoints..."

# Test analytics endpoints
echo "📊 Testing /api/analytics/log..."
curl -s -X POST "$NBA_BACKEND_URL/api/analytics/log" \
  -H "Content-Type: application/json" \
  -d '{"eventName":"dashboard_test","userId":"dashboard_user_001","sessionId":"session_001"}' | jq '.success'

echo "📈 Testing /api/analytics/summary..."
curl -s "$NBA_BACKEND_URL/api/analytics/summary?userId=test_user" | jq '.success'

echo -e "\n3️⃣  Checking for analytics dashboard backend..."
if curl -s -f "$ANALYTICS_BACKEND_URL/health" > /dev/null; then
    echo "✅ Analytics Dashboard Backend is running"
    
    # Get dashboard status
    echo "📡 Dashboard Status:"
    curl -s "$ANALYTICS_BACKEND_URL/health" | jq
    
else
    echo "⚠️  Analytics Dashboard Backend not found at $ANALYTICS_BACKEND_URL"
    echo "💡 Start it with: cd /Users/jerryexon/sports-app-production/sports-analytics-dashboard && npm start"
fi

echo -e "\n4️⃣  Testing Secret Phrase Analytics..."
curl -s "$NBA_BACKEND_URL/api/secret-phrases" | jq '.success'

echo -e "\n🎉 Test Complete!"
