#!/bin/bash
echo "🔄 Restarting NBA Backend..."
pm2 restart nba-backend
sleep 3
curl -s http://localhost:8080/health | jq -r '"✅ Status: " + .status'
