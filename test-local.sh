#!/bin/bash
echo "Testing local server..."

# Kill any running server on port 3002
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test endpoints
echo "Testing endpoints:"
curl -s http://localhost:3002/health | head -2
echo ""
curl -s http://localhost:3002/api/health | head -2
echo ""
curl -s http://localhost:3002/status | head -2

# Kill server
kill $SERVER_PID 2>/dev/null
echo "Test complete!"
