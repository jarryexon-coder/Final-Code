#!/bin/bash

echo "=== Deploying to Railway ==="

# 1. Make sure we have the right files
echo "1. Checking files..."
ls -la server.js package.json railway.json

# 2. Stop any local servers
echo "2. Stopping local servers..."
pkill -f "node server.js" 2>/dev/null || true

# 3. Test locally first (without MongoDB)
echo "3. Testing server locally..."
PORT=3005 node server.js &
TEST_PID=$!
sleep 3

echo "Testing endpoints on port 3005:"
curl -s http://localhost:3005/health | grep -o '"status":"[^"]*"' || echo "No response"
curl -s http://localhost:3005/api/health | grep -o '"status":"[^"]*"' || echo "No response"
kill $TEST_PID 2>/dev/null

# 4. Commit changes
echo "4. Committing changes..."
git add .
git commit -m "Deploy fixed server.js with working endpoints" || echo "Already committed"

# 5. Deploy to Railway
echo "5. Deploying to Railway..."
if command -v railway &> /dev/null; then
    railway up
else
    echo "⚠️ Railway CLI not found. Pushing to GitHub..."
    git push origin main
fi

echo ""
echo "✅ Deployment started!"
echo "Wait 2-3 minutes, then test:"
echo "curl https://pleasing-determination-production.up.railway.app/api/health"
