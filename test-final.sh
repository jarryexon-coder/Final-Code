#!/bin/bash

URL="https://pleasing-determination-production.up.railway.app"

echo "=== FINAL TEST ==="
echo "URL: $URL"
echo ""

# Try multiple times
for i in {1..5}; do
  echo "Attempt $i:"
  
  # Test root
  root_status=$(curl -s -o /dev/null -w "%{http_code}" "$URL/")
  echo "  /: $root_status"
  
  # Test api/health
  api_status=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")
  echo "  /api/health: $api_status"
  
  if [ "$root_status" = "200" ] && [ "$api_status" = "200" ]; then
    echo ""
    echo "🎉 SUCCESS! Both endpoints are working!"
    echo "Your frontend should now connect successfully."
    exit 0
  fi
  
  echo "Waiting 30 seconds..."
  sleep 30
done

echo ""
echo "❌ Still failing. Check Railway logs and variables."
echo "Run: railway logs"
