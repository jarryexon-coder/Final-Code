#!/bin/bash

echo "=== Testing Server Locally ==="

# Kill any existing server
pkill -f "node server.js" 2>/dev/null || true

# Start server with test port
PORT=3006 node server.js &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

echo -e "\nTesting endpoints:"

# Test each endpoint
endpoints=(
  "http://localhost:3006/"
  "http://localhost:3006/health"
  "http://localhost:3006/api/health"
  "http://localhost:3006/privacy"
  "http://localhost:3006/api/database/health"
)

for url in "${endpoints[@]}"; do
  echo -n "Testing $url: "
  if curl -s -f "$url" > /dev/null; then
    echo "✅ 200 OK"
  else
    echo "❌ FAILED"
  fi
done

# Kill server
kill $SERVER_PID 2>/dev/null

echo -e "\n✅ Local test complete!"
