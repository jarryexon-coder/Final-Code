#!/bin/bash

URL="https://pleasing-determination-production.up.railway.app"

echo "=== FINAL TEST AFTER FIX ==="
echo "Testing: $URL"
echo ""

# Test with detailed output
test_endpoint() {
  local endpoint=$1
  echo "Testing $endpoint:"
  
  # Get status code and response
  status=$(curl -s -o /tmp/response -w "%{http_code}" "${URL}${endpoint}")
  response=$(cat /tmp/response | head -2)
  
  if [ "$status" = "200" ]; then
    echo "  ✅ HTTP $status"
    echo "  Response: $response"
  else
    echo "  ❌ HTTP $status"
    echo "  Response: $response"
  fi
  echo ""
}

test_endpoint "/"
test_endpoint "/health"
test_endpoint "/api/health"
test_endpoint "/privacy"
test_endpoint "/api/database/health"

echo "=== COMPLETE ==="
