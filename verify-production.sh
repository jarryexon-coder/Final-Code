#!/bin/bash

URL="https://pleasing-determination-production.up.railway.app"

echo "=== Verifying Production Deployment ==="
echo "Testing at: $URL"
echo ""

# Wait a bit more if needed
sleep 10

echo "1. Testing /api/health (the problematic endpoint):"
for i in {1..10}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")
  if [ "$response" = "200" ]; then
    echo "   ✅ SUCCESS! Got HTTP 200"
    echo "   Response body:"
    curl -s "$URL/api/health" | head -5
    break
  else
    echo "   ⏳ Attempt $i: Got HTTP $response, waiting 15 seconds..."
    sleep 15
  fi
done

echo ""
echo "2. Testing all endpoints:"
echo "   /: $(curl -s -o /dev/null -w "%{http_code}" "$URL/")"
echo "   /health: $(curl -s -o /dev/null -w "%{http_code}" "$URL/health")"
echo "   /api/health: $(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")"
echo "   /privacy: $(curl -s -o /dev/null -w "%{http_code}" "$URL/privacy")"
echo "   /api/database/health: $(curl -s -o /dev/null -w "%{http_code}" "$URL/api/database/health")"

echo ""
echo "=== Verification Complete ==="
