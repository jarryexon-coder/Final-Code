#!/bin/bash

echo "=== FORCE DEPLOY TO RAILWAY ==="

# 1. Add all files
git add .

# 2. Commit with force flag
git commit -m "Force deploy with Railway fixes" || true

# 3. Deploy
echo "Deploying..."
if command -v railway &> /dev/null; then
    railway up --force
else
    git push railway main --force || git push origin main --force
fi

echo ""
echo "✅ DEPLOYMENT STARTED!"
echo ""
echo "=== MANUAL STEPS REQUIRED ==="
echo "1. Go to Railway dashboard → Variables"
echo "2. Add: PORT=3002"
echo "3. Add: NODE_ENV=production"
echo "4. Wait 2 minutes"
echo "5. Test: curl https://pleasing-determination-production.up.railway.app/api/health"
