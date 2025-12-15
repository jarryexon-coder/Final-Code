#!/bin/bash
echo "📊 Analytics Monitor - Refreshing every 5 seconds"
echo "Press Ctrl+C to exit"
echo ""

while true; do
  clear
  echo "🕐 $(date)"
  echo "======================"
  
  # Get dashboard data
  DASHBOARD=$(curl -s http://localhost:3000/api/analytics/dashboard)
  
  echo "📈 Overview:"
  echo $DASHBOARD | jq -r '
    .data.overview | 
    "   Users: \(.totalUsers) total, \(.activeUsers) active
    Events: \(.totalEvents) last 24h
    Conversion: \(.conversionRate)%"
  '
  
  echo ""
  echo "📱 Popular Screens:"
  echo $DASHBOARD | jq -r '.data.popularScreens[] | "   \(._id): \(.count) views"' 2>/dev/null || echo "   (No screen views yet)"
  
  echo ""
  echo "📊 Latest Event:"
  curl -s http://localhost:3000/api/analytics/realtime 2>/dev/null | \
    jq -r '.data[-1] | "   \(.event_name) - \(.timestamp)"' 2>/dev/null || \
    echo "   (No real-time events)"
  
  sleep 5
done
