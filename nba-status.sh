#!/bin/bash
echo "🏀 NBA Backend Status"
echo "==================="
echo "PM2: $(pm2 list | grep nba-backend | awk '{print $18}')"
echo "Nginx: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health && echo '✅' || echo '❌')"
echo "API Health: $(curl -s http://localhost:8080/health | jq -r .status)"
echo "==================="
