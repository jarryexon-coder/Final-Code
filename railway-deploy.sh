#!/bin/bash

echo "=== DEPLOYING TO RAILWAY ==="
echo ""

# 1. Add all files
echo "1. Adding files to git..."
git add .

# 2. Commit
echo "2. Committing changes..."
git commit -m "Railway deployment with working endpoints" || true

# 3. Deploy using Railway CLI if available
if command -v railway &> /dev/null; then
    echo "3. Using Railway CLI to deploy..."
    railway up
else
    echo "3. Pushing to main branch..."
    git push origin main
fi

echo ""
echo "✅ DEPLOYMENT STARTED!"
echo ""
echo "=== AFTER DEPLOYMENT CHECKLIST ==="
echo "1. Go to Railway dashboard → Variables → Add:"
echo "   PORT=3002"
echo "   MONGODB_URI=mongodb+srv://Jerryexon1:Bigyear1@cluster0.6sqqrz.mongodb.net/sports-app?appName=Cluster0"
echo "   REDIS_URL=redis://default:BIIjBqQGBdyzNGORZdQYmQQeBgJROcWe@caboose.proxy.rlwy.net:32242"
echo ""
echo "2. Check Settings → Start Command is: 'node server.js'"
echo ""
echo "3. Wait 3 minutes, then test:"
echo "   curl https://pleasing-determination-production.up.railway.app/api/health"
